import express from 'express';
import {} from '../controllers/projectController.js';
const projectRouter = express.router();

projectRouter.post('/projects', createProject);