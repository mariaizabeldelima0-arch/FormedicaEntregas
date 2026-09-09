// Regra única de senha do sistema, usada em todas as telas onde se cria senha.
// Mantida junto com o ajuste equivalente no Supabase (Authentication → Sign In / Providers),
// para que o servidor recuse o que a tela recusa.

export const REQUISITOS = [
  { id: 'tamanho',  texto: 'Pelo menos 8 caracteres',                  testa: (s) => s.length >= 8 },
  { id: 'letra',    texto: 'Pelo menos uma letra',                     testa: (s) => /[a-zA-Z]/.test(s) },
  { id: 'numero',   texto: 'Pelo menos um número',                     testa: (s) => /[0-9]/.test(s) },
  { id: 'especial', texto: 'Pelo menos um caractere especial (!@#$%)', testa: (s) => /[^a-zA-Z0-9]/.test(s) },
];

export const MENSAGEM_REGRA =
  'A senha precisa ter no mínimo 8 caracteres, com pelo menos uma letra, um número e um caractere especial.';

export function conferirRequisitos(senha) {
  const s = senha || '';
  return REQUISITOS.map((r) => ({ id: r.id, texto: r.texto, ok: r.testa(s) }));
}

export function senhaValida(senha) {
  const s = senha || '';
  return REQUISITOS.every((r) => r.testa(s));
}

// Cores da identidade visual do sistema
const VERMELHO = '#f0191f';
const AMARELO = '#ecdf3c';
const VERDE = '#7BBA45';

// Fraca -> não atende os requisitos (não dá para salvar)
// Boa   -> atende tudo
// Forte -> atende tudo, é longa e mistura maiúsculas com minúsculas
export function forcaDaSenha(senha) {
  const s = senha || '';
  if (!s) return null;

  if (!senhaValida(s)) {
    return { nivel: 'fraca', rotulo: 'Fraca', cor: VERMELHO, preenchimento: 33 };
  }

  const misturaCaixa = /[a-z]/.test(s) && /[A-Z]/.test(s);
  if (s.length >= 12 && misturaCaixa) {
    return { nivel: 'forte', rotulo: 'Forte', cor: VERDE, preenchimento: 100 };
  }

  return { nivel: 'boa', rotulo: 'Boa', cor: AMARELO, preenchimento: 66 };
}
