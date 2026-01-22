import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/next";
import { inngest,functions} from "./inngest/index.js";
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

const app= express();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use('/api/inngest', serve ({client: inngest , functions }));

//Routes & adding the protect middleware
app.use('/api/workspaces' , protect, workspaceRouter);

app.get('/' , (req, res) => res.send('server is live ! '));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));