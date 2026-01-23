import express from 'express';
import {} from '../controllers/projectController.js';
const projectRouter = express.router();

projectRouter.post('/', createProject);
projectRouter.put('/', updateProject);
projectRouter.post('/add-member', addMemberToProject);