import { GoogleGenAI, Modality } from '@google/genai';
import { env } from '../config/env.js';

/**
 * Wraps a single Gemini Live API session for real-time, multilingual
 * speech-to-text. Audio is streamed in as 16kHz mono PCM16 chunks;
 * partial and final transcripts are surfaced via callbacks.
 */
export class GeminiLiveSession {
  constructor({ onPartial, onFinal, onError }) {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
    this.onError = onError;
    this.session = null;
    this.ready = false;
    this.pendingText = '';
  }

  async connect() {
    if (!env.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }
    const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey, apiVersion: 'v1beta' });

    this.session = await ai.live.connect({
      model: env.gemini.model,
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction:
          'You are a real-time multilingual speech transcriber. Transcribe exactly ' +
          'what is spoken, including code-mixed speech (e.g. Hindi and English mixed ' +
          'in the same sentence). Output only the transcription text, no commentary, ' +
          'no translation, preserve the original language(s) as spoken.',
        inputAudioTranscription: {},
      },
      // callbacks: {
      //   onopen: () => {
      //     this.ready = true;
      //   },
      //   onmessage: (message) => this.handleMessage(message),
      //   onerror: (err) => this.onError?.(err),
      //   onclose: () => {
      //     this.ready = false;
      //   },
      // },
      callbacks: {
  onopen: () => {
    console.log('[Gemini] Connection opened');
    this.ready = true;
  },

  onmessage: (message) => {
    console.log('[Gemini] Incoming message:', JSON.stringify(message));
    this.handleMessage(message);
  },

  onerror: (err) => {
    console.error('[Gemini] Error:', err);
    this.onError?.(err);
  },

  onclose: (event) => {
    console.error('[Gemini] Connection closed:', event);
    this.ready = false;
  },
},
    });

    return this;
  }

  // handleMessage(message) {
  //   // Native input audio transcription events carry the recognized text.
  //   const inputTranscription = message?.serverContent?.inputTranscription;
  //   if (inputTranscription?.text) {
  //     this.pendingText += inputTranscription.text;
  //     this.onPartial?.(this.pendingText);
  //   }

  //   if (message?.serverContent?.turnComplete) {
  //     if (this.pendingText.trim()) {
  //       this.onFinal?.(this.pendingText.trim());
  //     }
  //     this.pendingText = '';
  //   }
  // }

  handleMessage(message) {
  const content = message?.serverContent;

  if (!content) {
    console.log('[Gemini] No serverContent');
    return;
  }

  // Live, interim transcription
  const interim = content.interimInputTranscription?.text;

  if (interim) {
    console.log('[Gemini] Interim transcript:', interim);
    this.onPartial?.(interim);
  }

  // Finalized transcription
  const finalText = content.inputTranscription?.text;

  if (finalText) {
    console.log('[Gemini] Final transcript:', finalText);
    this.onFinal?.(finalText);
  }

  if (content.turnComplete) {
    console.log('[Gemini] Turn completed');
  }
}

  /**
   * @param {Buffer} pcmChunk raw 16-bit PCM, 16kHz mono
   */
  // sendAudioChunk(pcmChunk) {
  //   if (!this.ready || !this.session) return;
  //   this.session.sendRealtimeInput({
  //     audio: {
  //       data: pcmChunk.toString('base64'),
  //       mimeType: 'audio/pcm;rate=16000',
  //     },
  //   });
  // }

async sendAudioChunk(pcmChunk) {
  if (!this.ready || !this.session) {
    console.log('[Gemini] Session not ready');
    return;
  }

  try {
    await this.session.sendRealtimeInput({
      audio: {
        data: pcmChunk.toString('base64'),
        mimeType: 'audio/pcm;rate=16000',
      },
    });

    this.audioChunkCount = (this.audioChunkCount || 0) + 1;

    if (this.audioChunkCount % 20 === 0) {
      console.log('[Gemini] Audio chunks sent:', this.audioChunkCount);
    }
  } catch (err) {
    console.error('[Gemini] Audio send failed:', err);
    this.onError?.(err);
  }
}

  close() {
    this.ready = false;
    try {
      this.session?.close();
    } catch {
      // ignore close errors
      console.warn('[Gemini] Session close failed, ignoring.');
    }
  }
}
