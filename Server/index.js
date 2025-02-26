import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/userRoutes.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "https://dashboard-adm-front-end.vercel.app/",
    // origin: process.env.FRONTEND_URL || "http://localhost:3000",
  }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
