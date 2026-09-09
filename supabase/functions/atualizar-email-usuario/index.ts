// Corrige o e-mail de um usuário do sistema.
//
// O e-mail fica guardado em DOIS lugares: na tabela `usuarios` (que o site lê
// para descobrir quem está tentando entrar) e dentro do Supabase Auth (que
// guarda a senha). Se os dois ficarem diferentes, a pessoa para de conseguir
// entrar sem nenhuma mensagem de erro.
//
// Por isso esta função troca os dois juntos e, se o segundo falhar, desfaz o
// primeiro.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ORIGENS_PERMITIDAS = [
  'https://mariaizabeldelima0-arch.github.io',
  'http://localhost:5173',
];

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

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: solicitante } = await admin
    .from('usuarios')
    .select('tipo_usuario, ativo')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!solicitante || !solicitante.ativo || solicitante.tipo_usuario !== 'admin') {
    return resposta({ error: 'Apenas administradores podem alterar e-mails.' }, 403, origin);
  }

  // 2. Dados recebidos
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return resposta({ error: 'Dados inválidos.' }, 400, origin);
  }

  const id = String(corpo?.id ?? '').trim();
  const email = String(corpo?.email ?? '').trim().toLowerCase();

  if (!id) {
    return resposta({ error: 'Usuário não informado.' }, 400, origin);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return resposta({ error: 'Informe um e-mail válido.' }, 400, origin);
  }

  // 3. Quem vai ser alterado?
  const { data: alvo } = await admin
    .from('usuarios')
    .select('id, usuario, email, auth_id')
    .eq('id', id)
    .maybeSingle();

  if (!alvo) {
    return resposta({ error: 'Usuário não encontrado.' }, 404, origin);
  }

  if ((alvo.email ?? '').toLowerCase() === email) {
    return resposta({ ok: true, mensagem: 'O e-mail já era esse.' }, 200, origin);
  }

  // 4. Esse e-mail já é de outra pessoa?
  const { data: emailEmUso } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .neq('id', id)
    .maybeSingle();

  if (emailEmUso) {
    return resposta(
      { error: 'Esse e-mail já está cadastrado para outra pessoa. Cada pessoa precisa de um e-mail próprio.' },
      409,
      origin
    );
  }

  // 5. Troca no Supabase Auth (só se a pessoa já tiver conta criada)
  if (alvo.auth_id) {
    const { error: erroAuth } = await admin.auth.admin.updateUserById(alvo.auth_id, {
      email,
      email_confirm: true,
    });

    if (erroAuth) {
      return resposta(
        { error: `Não foi possível alterar o e-mail de acesso: ${erroAuth.message}` },
        500,
        origin
      );
    }
  }

  // 6. Troca na tabela do sistema
  const { error: erroTabela } = await admin
    .from('usuarios')
    .update({ email })
    .eq('id', id);

  // 7. Falhou aqui? Volta o Auth para o e-mail antigo, para não desalinhar.
  if (erroTabela) {
    if (alvo.auth_id && alvo.email) {
      await admin.auth.admin.updateUserById(alvo.auth_id, {
        email: alvo.email,
        email_confirm: true,
      });
    }
    return resposta(
      { error: 'Erro ao salvar o e-mail. Nada foi alterado.' },
      500,
      origin
    );
  }

  return resposta(
    {
      ok: true,
      mensagem: alvo.auth_id
        ? 'E-mail alterado. A pessoa continua entrando com o mesmo usuário e a mesma senha.'
        : 'E-mail alterado.',
    },
    200,
    origin
  );
});
