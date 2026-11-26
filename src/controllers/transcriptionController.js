import * as transcriptionRepo from '../db/transcriptionRepo.js';

export async function listTranscriptions(req, res) {
  const transcriptions = await transcriptionRepo.listTranscriptions();
  res.json(transcriptions);
}

export async function getTranscription(req, res) {
  const transcription = await transcriptionRepo.getTranscriptionById(req.params.id);
  if (!transcription) return res.status(404).json({ error: 'Not found' });
  res.json(transcription);
}

export async function createTranscription(req, res) {
  const { sessionId, text, languages, durationMs, status } = req.body;
  const transcription = await transcriptionRepo.createTranscription({
    sessionId,
    text: text || '',
    languages: languages || [],
    durationMs,
    status: status || 'completed',
  });
  res.status(201).json(transcription);
}

export async function updateTranscription(req, res) {
  const existing = await transcriptionRepo.getTranscriptionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { text, languages, durationMs, status } = req.body;
  const transcription = await transcriptionRepo.updateTranscription(req.params.id, {
    text,
    languages,
    durationMs,
    status,
  });
  res.json(transcription);
}

export async function deleteTranscription(req, res) {
  const existing = await transcriptionRepo.getTranscriptionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await transcriptionRepo.deleteTranscription(req.params.id);
  res.status(204).send();
}
