// Aluno do fundamental normalmente não tem e-mail próprio, então ele usa um
// nome de usuário. O Supabase Auth exige e-mail internamente, então convertemos
// o usuário num e-mail sintético (nunca exposto na interface).
export function emailDoUsuario(usuario) {
  return `${usuario.toLowerCase()}@aprendemais.local`;
}
