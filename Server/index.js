import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/userRoutes.js';

dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://dashboard-adm-front-end.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

console.log("CORS Config:", corsOptions); // Adiciona um log para verificar a configuração

app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log("Headers being set:", res.getHeaders()); // Verifica se os headers estão sendo aplicados
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
