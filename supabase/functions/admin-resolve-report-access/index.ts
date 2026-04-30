import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json(200, { ok: true });
  if (req.method !== 'POST') return json(405, { success: false, error: 'Method not allowed.' });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY =
    Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, { success: false, error: 'Missing service role environment configuration.' });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) return json(401, { success: false, error: 'Missing auth token.' });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: requesterData, error: requesterError } = await admin.auth.getUser(accessToken);
    if (requesterError || !requesterData.user) {
      return json(401, { success: false, error: 'Invalid auth token.' });
    }

    const { data: requesterProfile, error: requesterProfileError } = await admin
      .from('user_profile')
      .select('role')
      .eq('user_id', requesterData.user.id)
      .maybeSingle();
    if (requesterProfileError || !requesterProfile || requesterProfile.role !== 'Admin') {
      return json(403, { success: false, error: 'Only admins can resolve access requests.' });
    }

    const body = await req.json();
    const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
    const approved = body?.approved === true;
    if (!requestId) return json(400, { success: false, error: 'requestId is required.' });

    const { data: requestRow, error: requestError } = await admin
      .from('report_access_request')
      .select('request_id, assignment_id, requester_user_id, status')
      .eq('request_id', requestId)
      .maybeSingle();
    if (requestError || !requestRow) {
      return json(404, { success: false, error: 'Access request not found.' });
    }
    if (requestRow.status !== 'Pending') {
      return json(400, { success: false, error: 'Request is already resolved.' });
    }

    const { data: assignmentRow } = await admin
      .from('audit_assignment')
      .select('title')
      .eq('assignment_id', requestRow.assignment_id)
      .maybeSingle();
    const assignmentTitle =
      (typeof assignmentRow?.title === 'string' && assignmentRow.title) || 'Condition report';

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from('report_access_request')
      .update({
        status: approved ? 'Approved' : 'Declined',
        decided_by: requesterData.user.id,
        decided_at: now,
        updated_at: now,
      })
      .eq('request_id', requestId);
    if (updateError) {
      return json(400, { success: false, error: updateError.message });
    }

    const { error: notifyError } = await admin.from('alert').insert([
      {
        title: approved
          ? `Report access approved · ${assignmentTitle}`
          : `Report access declined · ${assignmentTitle}`,
        body: approved
          ? `Your request to view completed report "${assignmentTitle}" was approved.`
          : `Your request to view completed report "${assignmentTitle}" was declined.`,
        type: 'User',
        severity: approved ? 'Info' : 'Attention',
        status: 'Open',
        kind: 'AssetFlag',
        read: false,
        user_id: requestRow.requester_user_id,
      },
    ]);
    if (notifyError) {
      return json(400, { success: false, error: notifyError.message });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
});
