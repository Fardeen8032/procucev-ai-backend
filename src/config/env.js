import 'dotenv/config';

export const env = {
  port: process.env.PORT || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_LIVE_MODEL || 'gemini-2.0-flash-live-001',
  },
  sttProvider: process.env.STT_PROVIDER || 'gemini',
  whisperWsUrl: process.env.WHISPER_WS_URL || 'ws://localhost:9000/ws',
};
