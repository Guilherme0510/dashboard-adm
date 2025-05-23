import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/userRoutes.js';

dotenv.config();
const app = express();

const allowedOrigins = [
  "https://dashboard-adm-front-end.vercel.app",
  "http://localhost:3000",  // ajuste a porta conforme seu frontend local
  "http://localhost:5173",  // exemplo para Vite
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true); // libera
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

console.log("CORS Config:", corsOptions);

app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log("Headers being set:", res.getHeaders()); // Verifica se os headers estão sendo aplicados
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
