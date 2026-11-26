import { supabase, TRANSCRIPTIONS_TABLE } from './supabaseClient.js';

function toApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    text: row.text,
    languages: row.languages,
    durationMs: row.duration_ms,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDb({ sessionId, text, languages, durationMs, status }) {
  const row = {};
  if (sessionId !== undefined) row.session_id = sessionId;
  if (text !== undefined) row.text = text;
  if (languages !== undefined) row.languages = languages;
  if (durationMs !== undefined) row.duration_ms = durationMs;
  if (status !== undefined) row.status = status;
  return row;
}

export async function listTranscriptions() {
  const { data, error } = await supabase
    .from(TRANSCRIPTIONS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(toApi);
}

export async function getTranscriptionById(id) {
  const { data, error } = await supabase
    .from(TRANSCRIPTIONS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return toApi(data);
}

export async function createTranscription(fields) {
  const { data, error } = await supabase
    .from(TRANSCRIPTIONS_TABLE)
    .insert(toDb(fields))
    .select('*')
    .single();
  if (error) throw error;
  return toApi(data);
}

export async function updateTranscription(id, fields) {
  const { data, error } = await supabase
    .from(TRANSCRIPTIONS_TABLE)
    .update(toDb(fields))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return toApi(data);
}

export async function deleteTranscription(id) {
  const { error } = await supabase.from(TRANSCRIPTIONS_TABLE).delete().eq('id', id);
  if (error) throw error;
}
