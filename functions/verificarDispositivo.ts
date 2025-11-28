import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { fingerprint, deviceName } = await req.json();

    if (!fingerprint) {
      return Response.json({ error: 'Fingerprint não fornecido' }, { status: 400 });
    }

    // Buscar dispositivos do usuário
    const dispositivos = await base44.asServiceRole.entities.DispositivoAutorizado.filter({
      user_email: user.email,
      device_fingerprint: fingerprint
    });

    if (dispositivos.length === 0) {
      // Dispositivo novo - criar registro aguardando aprovação
      await base44.asServiceRole.entities.DispositivoAutorizado.create({
        user_email: user.email,
        device_fingerprint: fingerprint,
        device_name: deviceName || 'Dispositivo desconhecido',
        ultimo_acesso: new Date().toISOString(),
        autorizado: false,
        aguardando_aprovacao: true
      });

      return Response.json({
        autorizado: false,
        aguardando_aprovacao: true,
        mensagem: 'Dispositivo novo detectado. Aguardando aprovação do administrador.'
      });
    }

    const dispositivo = dispositivos[0];

    // Atualizar último acesso
    await base44.asServiceRole.entities.DispositivoAutorizado.update(dispositivo.id, {
      ultimo_acesso: new Date().toISOString()
    });

    if (dispositivo.autorizado) {
      return Response.json({
        autorizado: true,
        aguardando_aprovacao: false,
        mensagem: 'Dispositivo autorizado.'
      });
    }

    if (dispositivo.aguardando_aprovacao) {
      return Response.json({
        autorizado: false,
        aguardando_aprovacao: true,
        mensagem: 'Dispositivo aguardando aprovação do administrador.'
      });
    }

    return Response.json({
      autorizado: false,
      aguardando_aprovacao: false,
      mensagem: 'Dispositivo bloqueado. Entre em contato com o administrador.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});