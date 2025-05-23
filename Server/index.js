import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/userRoutes.js';

dotenv.config();
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://dashboard-adm-front-end.vercel.app",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
