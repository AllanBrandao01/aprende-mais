import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Cliente com privilégios de administrador — ignora RLS. Usar só no back-end,
// para criar contas de professor/aluno sem depender do envio de e-mail de confirmação.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
