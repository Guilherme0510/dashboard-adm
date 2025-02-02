import dotenv from 'dotenv' 
import express from 'express';
import cors from 'cors' 
import { userRouter } from './routes/userRoutes.js';
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter)
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
