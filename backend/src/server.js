import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRouter from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
