export type AuditDraftPhoto = {
  uri: string;
  remotePath?: string;
  uploadStatus: 'pending' | 'uploaded' | 'failed';
};

export type AuditDraft = {
  assetId: string;
  assignmentId?: string;
  findingsSummary: string;
  recommendedActions: string;
  followUpOwner: string;
  comments: string;
  photoNotes: string;
  photosCaptured: boolean;
  photos: AuditDraftPhoto[];
  updatedAt: string;
};

const draftByAssetId = new Map<string, AuditDraft>();

export function saveAuditDraftSnapshot(draft: AuditDraft): void {
  draftByAssetId.set(draft.assetId, draft);
}

export function getAuditDraftSnapshot(assetId: string): AuditDraft | null {
  return draftByAssetId.get(assetId) ?? null;
}

export function clearAuditDraftSnapshot(assetId: string): void {
  draftByAssetId.delete(assetId);
}
