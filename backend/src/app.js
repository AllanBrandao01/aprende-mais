import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import exerciciosRouter from './routes/exercicios.js';
import alunosRouter from './routes/alunos.js';
import professoresRouter from './routes/professores.js';

export const app = express();

app.use(cors());
// limite maior que o padrão (100kb) porque exercícios podem trazer imagem em
// base64 no corpo da requisição (já redimensionada no navegador, mas ainda
// assim maior que o padrão)
app.use(express.json({ limit: '4mb' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/exercicios', exerciciosRouter);
app.use('/api/alunos', alunosRouter);
app.use('/api/professores', professoresRouter);
