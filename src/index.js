import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import transcriptionsRouter from './routes/transcriptions.js';
import { registerTranscriptionSocket } from './sockets/transcriptionSocket.js';

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/transcriptions', transcriptionsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.clientOrigin },
  maxHttpBufferSize: 1e7,
});

registerTranscriptionSocket(io);

httpServer.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
