import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';

// Storage bucket where audit photos live. Must be created in Supabase Storage
// (e.g. via the dashboard) before uploads will succeed. If missing, uploadPhoto
// returns ok:false with a descriptive error so callers can surface a message.
const PHOTO_BUCKET = 'audit-photos';

export type CapturedPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export type UploadedPhoto = {
  bucket: string;
  path: string;
  publicUrl: string | null;
};

function inferMimeAndExt(uri: string, providedMime?: string | null): { mime: string; ext: string } {
  const lower = uri.toLowerCase();
  const ext = lower.endsWith('.png')
    ? 'png'
    : lower.endsWith('.heic')
      ? 'heic'
      : lower.endsWith('.webp')
        ? 'webp'
        : 'jpg';
  const mime = providedMime && providedMime !== 'image' ? providedMime : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return { mime, ext };
}

export async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function captureFromCamera(): Promise<CapturedPhoto | null> {
  const granted = await ensureCameraPermission();
  if (!granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
    exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const { mime, ext } = inferMimeAndExt(asset.uri, asset.mimeType ?? null);
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `photo-${Date.now()}.${ext}`,
    mimeType: mime,
  };
}

export async function pickFromLibrary(): Promise<CapturedPhoto | null> {
  const granted = await ensureMediaLibraryPermission();
  if (!granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
    exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const { mime, ext } = inferMimeAndExt(asset.uri, asset.mimeType ?? null);
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `photo-${Date.now()}.${ext}`,
    mimeType: mime,
  };
}

async function readAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // The picker hands us a local content/file URI on native, and a blob URL on
  // web. fetch() works for both, returning the bytes ready for upload.
  const response = await fetch(uri);
  return await response.arrayBuffer();
}

export async function uploadPhoto(
  photo: CapturedPhoto,
  pathPrefix: string = 'general'
): Promise<{ ok: true; data: UploadedPhoto } | { ok: false; error: string }> {
  try {
    const buffer = await readAsArrayBuffer(photo.uri);
    const safePrefix = pathPrefix.replace(/[^a-zA-Z0-9_\-./]/g, '_');
    const objectPath = `${safePrefix}/${Date.now()}-${photo.fileName}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(objectPath, buffer, {
      contentType: photo.mimeType,
      upsert: false,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const { data: publicData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(objectPath);
    return {
      ok: true,
      data: {
        bucket: PHOTO_BUCKET,
        path: objectPath,
        publicUrl: publicData?.publicUrl ?? null,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Upload failed' };
  }
}

// Persist a photo reference into `location_attachment` so it shows up alongside
// the audit_log row it was captured for. file_url is required by the schema; we
// pass either the public URL or the storage path as a fallback.
export async function saveAttachmentReference(params: {
  locationId: string;
  auditId?: string | null;
  fileUrl: string;
  fileName: string;
  uploadedBy?: string | null;
  description?: string | null;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('location_attachment').insert([
      {
        location_id: params.locationId,
        audit_id: params.auditId ?? null,
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_type: 'Photo',
        description: params.description ?? null,
        uploaded_by: params.uploadedBy ?? null,
      },
    ]);
    return !error;
  } catch {
    return false;
  }
}
