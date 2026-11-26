import { Router } from 'express';
import {
  listTranscriptions,
  getTranscription,
  createTranscription,
  updateTranscription,
  deleteTranscription,
} from '../controllers/transcriptionController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(listTranscriptions));
router.get('/:id', asyncHandler(getTranscription));
router.post('/', asyncHandler(createTranscription));
router.put('/:id', asyncHandler(updateTranscription));
router.delete('/:id', asyncHandler(deleteTranscription));

export default router;
