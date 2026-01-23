import express from 'express';
import { createProject, updateProject , addMember} from '../controllers/projectController.js';
const projectRouter = express.router();

projectRouter.post('/', createProject);
projectRouter.put('/', updateProject);
projectRouter.post('/:projectId/add-member', addMember);

export default projectRouter;