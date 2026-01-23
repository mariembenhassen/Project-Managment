import express from 'express';
const commentRouter = express.Router();
import { addComment, getTaskComments} from '../controllers/commentController.js';

commentRouter.post('/', addComment);
commentRouter.get('/:taskId', getTaskComments);
export default commentRouter;