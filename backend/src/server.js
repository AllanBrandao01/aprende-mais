import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import exerciciosRouter from './routes/exercicios.js';
import alunosRouter from './routes/alunos.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/exercicios', exerciciosRouter);
app.use('/api/alunos', alunosRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
