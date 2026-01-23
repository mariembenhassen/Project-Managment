import express from 'express';
 const taskRouter = express.Router();
import { createTask, updateTask, deleteTask } from '../controllers/taskController.js';

taskRouter.post('/', createTask);
taskRouter.put('/:id', updateTask);
taskRouter.delete('/delete', deleteTask);

export default taskRouter;