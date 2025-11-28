import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Smartphone } from "lucide-react";

// Função para gerar fingerprint do dispositivo
const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  const canvasData = canvas.toDataURL();

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
    canvasData.slice(-50)
  ];

  // Gerar hash simples
  const str = components.join('|||');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'DEV' + Math.abs(hash).toString(36).toUpperCase();
};

const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = 'Navegador';
  let os = 'Sistema';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} em ${os}`;
};

export default function DeviceGuard({ children, onStatusChange }) {
  const [status, setStatus] = useState(() => {
    // Verificar se já foi autorizado recentemente (cache de 30 minutos)
    const cached = localStorage.getItem('device_auth_status');
    const cachedTime = localStorage.getItem('device_auth_time');
    if (cached === 'authorized' && cachedTime) {
      const elapsed = Date.now() - parseInt(cachedTime);
      if (elapsed < 30 * 60 * 1000) { // 30 minutos
        return 'authorized';
      }
    }
    return 'loading';
  });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    // Se já está autorizado pelo cache, não verificar novamente
    if (status === 'authorized') {
      return;
    }

    const verificarDispositivo = async () => {
      try {
        const fingerprint = generateFingerprint();
        const deviceName = getDeviceName();

        // Salvar fingerprint localmente para referência
        localStorage.setItem('device_fingerprint', fingerprint);

        const response = await base44.functions.invoke('verificarDispositivo', {
          fingerprint,
          deviceName
        });

        const data = response.data;

        if (data.autorizado) {
          setStatus('authorized');
          // Salvar no cache
          localStorage.setItem('device_auth_status', 'authorized');
          localStorage.setItem('device_auth_time', Date.now().toString());
        } else if (data.aguardando_aprovacao) {
          setStatus('pending');
          setMensagem(data.mensagem);
          localStorage.removeItem('device_auth_status');
          localStorage.removeItem('device_auth_time');
        } else {
          setStatus('blocked');
          setMensagem(data.mensagem);
          localStorage.removeItem('device_auth_status');
          localStorage.removeItem('device_auth_time');
        }

        if (onStatusChange) {
          onStatusChange(data.autorizado ? 'authorized' : 'blocked');
        }

      } catch (error) {
        console.error('Erro ao verificar dispositivo:', error);
        // Em caso de erro, permitir acesso para não bloquear completamente
        setStatus('authorized');
      }
    };

    verificarDispositivo();
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardContent className="p-12 text-center">
            <Smartphone className="w-16 h-16 text-[#457bba] mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 font-medium">Verificando dispositivo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="bg-yellow-50 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-3 text-yellow-800">
              <Clock className="w-6 h-6" />
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Smartphone className="w-20 h-20 text-yellow-600 mx-auto mb-6" />
            <p className="text-slate-700 font-medium mb-2">
              Novo dispositivo detectado
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {mensagem || 'Seu acesso neste dispositivo está aguardando aprovação do administrador.'}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Entre em contato com o administrador para liberar seu acesso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6" />
              Acesso Bloqueado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Smartphone className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <p className="text-slate-700 font-medium mb-2">
              Este dispositivo não está autorizado
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {mensagem || 'Seu acesso foi negado neste dispositivo.'}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Entre em contato com o administrador para solicitar acesso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}