// Cria um usuário novo do sistema.
//
// Roda dentro do Supabase (não no navegador), porque criar um login exige a
// chave service_role, que nunca pode aparecer no site.
//
// O que ela faz, em ordem:
//   1. Confere que quem está chamando está logado e é admin ativo.
//   2. Valida os dados recebidos.
//   3. Confere que o login e o e-mail ainda não estão em uso.
//   4. Envia o convite por e-mail (isso cria a conta no Supabase Auth).
//   5. Grava a linha na tabela `usuarios` já vinculada a essa conta.
//   6. Se o passo 5 falhar, desfaz o passo 4 para não deixar conta órfã.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Para onde a pessoa é levada ao clicar no link do e-mail.
// Só estes endereços são aceitos — evita que alguém redirecione o link para fora.
const REDIRECTS: Record<string, string> = {
  'https://mariaizabeldelima0-arch.github.io':
    'https://mariaizabeldelima0-arch.github.io/FormedicaEntregas/definir-senha',
  'http://localhost:5173': 'http://localhost:5173/definir-senha',
};

const ORIGENS_PERMITIDAS = Object.keys(REDIRECTS);
const REDIRECT_PADRAO = REDIRECTS['https://mariaizabeldelima0-arch.github.io'];
const TIPOS_VALIDOS = ['admin', 'atendente', 'motoboy'];

function cabecalhosCors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin':
      origin && ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function resposta(corpo: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors(origin), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cabecalhosCors(origin) });
  }

  if (req.method !== 'POST') {
    return resposta({ error: 'Método não permitido' }, 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 1. Quem está chamando?
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return resposta({ error: 'Você precisa estar logado.' }, 401, origin);
  }

  const clienteDoUsuario = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: erroUser } = await clienteDoUsuario.auth.getUser();
  if (erroUser || !user) {
    return resposta({ error: 'Sessão inválida. Faça login novamente.' }, 401, origin);
  }

  // A partir daqui usamos a chave mestra — só depois de saber quem é o solicitante.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: solicitante } = await admin
    .from('usuarios')
    .select('tipo_usuario, ativo')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!solicitante || !solicitante.ativo || solicitante.tipo_usuario !== 'admin') {
    return resposta({ error: 'Apenas administradores podem criar usuários.' }, 403, origin);
  }

  // 2. Dados recebidos
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return resposta({ error: 'Dados inválidos.' }, 400, origin);
  }

  const usuario = String(corpo?.usuario ?? '').trim();
  const email = String(corpo?.email ?? '').trim().toLowerCase();
  const tipo_usuario = String(corpo?.tipo_usuario ?? '').trim();

  if (!usuario) {
    return resposta({ error: 'Informe o nome de usuário.' }, 400, origin);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return resposta({ error: 'Informe um e-mail válido.' }, 400, origin);
  }
  if (!TIPOS_VALIDOS.includes(tipo_usuario)) {
    return resposta({ error: 'Tipo de usuário inválido.' }, 400, origin);
  }

  // 3. Já está em uso?
  const { data: loginEmUso } = await admin
    .from('usuarios')
    .select('id')
    .eq('usuario', usuario)
    .maybeSingle();

  if (loginEmUso) {
    return resposta({ error: 'Já existe um usuário com esse login.' }, 409, origin);
  }

  const { data: emailEmUso } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (emailEmUso) {
    return resposta(
      { error: 'Esse e-mail já está cadastrado para outra pessoa. Cada pessoa precisa de um e-mail próprio.' },
      409,
      origin
    );
  }

  // 4. Convite (cria a conta no Supabase Auth e dispara o e-mail)
  const redirectTo = (origin && REDIRECTS[origin]) || REDIRECT_PADRAO;

  const { data: convite, error: erroConvite } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo }
  );

  if (erroConvite || !convite?.user) {
    return resposta(
      { error: `Não foi possível enviar o convite: ${erroConvite?.message ?? 'erro desconhecido'}` },
      500,
      origin
    );
  }

  // 5. Grava na tabela do sistema, já vinculada à conta criada
  const { error: erroInsert } = await admin.from('usuarios').insert([{
    usuario,
    nome: usuario,
    email,
    tipo_usuario,
    ativo: true,
    auth_id: convite.user.id,
    deve_trocar_senha: false,
  }]);

  // 6. Deu errado? Desfaz o convite para não sobrar conta sem dono.
  if (erroInsert) {
    await admin.auth.admin.deleteUser(convite.user.id);
    return resposta(
      { error: 'Erro ao gravar o usuário. Nada foi criado — pode tentar de novo.' },
      500,
      origin
    );
  }

  return resposta(
    { ok: true, mensagem: `Usuário criado. Convite enviado para ${email}.` },
    200,
    origin
  );
});
