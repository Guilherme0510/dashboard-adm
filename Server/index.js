const express = require("express");
const cors = require("cors");
const admin = require("./config/admFirebase");
const { userRouter } = require("./routes/userRoutes");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', userRouter)
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
