import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, DatabaseBackup, Users, Package, Truck, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

function downloadJSON(dados, nomeArquivo) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function Backup() {
  const { userType } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState({});

  if (userType !== 'admin') {
    navigate('/');
    return null;
  }

  async function exportarEntregas() {
    setLoading(l => ({ ...l, entregas: true }));
    try {
      const { data, error } = await supabase
        .from('entregas')
        .select('*')
        .order('data_entrega', { ascending: false });
      if (error) throw error;
      downloadJSON(
        { exportado_em: new Date().toISOString(), projeto: 'Formédica Entregas', tabelas: { entregas: data } },
        `backup-entregas-${dataHoje()}.json`
      );
      toast.success(`${data.length} entregas exportadas com sucesso.`);
    } catch (err) {
      toast.error('Erro ao exportar entregas: ' + err.message);
    } finally {
      setLoading(l => ({ ...l, entregas: false }));
    }
  }

  async function exportarClientes() {
    setLoading(l => ({ ...l, clientes: true }));
    try {
      const [resClientes, resEnderecos] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('enderecos').select('*'),
      ]);
      if (resClientes.error) throw resClientes.error;
      if (resEnderecos.error) throw resEnderecos.error;
      downloadJSON(
        {
          exportado_em: new Date().toISOString(),
          projeto: 'Formédica Entregas',
          tabelas: { clientes: resClientes.data, enderecos: resEnderecos.data }
        },
        `backup-clientes-${dataHoje()}.json`
      );
      toast.success(`${resClientes.data.length} clientes e ${resEnderecos.data.length} endereços exportados.`);
    } catch (err) {
      toast.error('Erro ao exportar clientes: ' + err.message);
    } finally {
      setLoading(l => ({ ...l, clientes: false }));
    }
  }

  async function exportarSedex() {
    setLoading(l => ({ ...l, sedex: true }));
    try {
      const { data, error } = await supabase
        .from('sedex_disktenha')
        .select('*')
        .order('data_saida', { ascending: false });
      if (error) throw error;
      downloadJSON(
        { exportado_em: new Date().toISOString(), projeto: 'Formédica Entregas', tabelas: { sedex_disktenha: data } },
        `backup-sedex-${dataHoje()}.json`
      );
      toast.success(`${data.length} registros de Sedex/Disktenha exportados.`);
    } catch (err) {
      toast.error('Erro ao exportar Sedex: ' + err.message);
    } finally {
      setLoading(l => ({ ...l, sedex: false }));
    }
  }

  async function exportarTudo() {
    setLoading(l => ({ ...l, tudo: true }));
    try {
      const [resEntregas, resClientes, resEnderecos, resSedex, resMotoboys, resUsuarios] = await Promise.all([
        supabase.from('entregas').select('*').order('data_entrega', { ascending: false }),
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('enderecos').select('*'),
        supabase.from('sedex_disktenha').select('*').order('data_saida', { ascending: false }),
        supabase.from('motoboys').select('id, nome'),
        supabase.from('usuarios').select('id, usuario, tipo_usuario, ativo'),
      ]);

      const erros = [resEntregas, resClientes, resEnderecos, resSedex, resMotoboys, resUsuarios]
        .find(r => r.error);
      if (erros) throw erros.error;

      downloadJSON(
        {
          exportado_em: new Date().toISOString(),
          projeto: 'Formédica Entregas',
          tabelas: {
            entregas: resEntregas.data,
            clientes: resClientes.data,
            enderecos: resEnderecos.data,
            sedex_disktenha: resSedex.data,
            motoboys: resMotoboys.data,
            usuarios: resUsuarios.data,
          }
        },
        `backup-completo-${dataHoje()}.json`
      );

      const total = resEntregas.data.length + resClientes.data.length + resSedex.data.length;
      toast.success(`Backup completo exportado — ${total} registros principais.`);
    } catch (err) {
      toast.error('Erro ao exportar backup completo: ' + err.message);
    } finally {
      setLoading(l => ({ ...l, tudo: false }));
    }
  }

  const cardStyle = {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const btnStyle = (cor, disabled) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: disabled ? '#e2e8f0' : cor,
    color: disabled ? '#94a3b8' : 'white',
    fontWeight: 600,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    alignSelf: 'flex-start',
  });

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DatabaseBackup size={28} color="#457bba" />
          Backup de Dados
        </h1>
        <p style={{ color: '#64748b', marginTop: '6px' }}>
          Exporte os dados do sistema para o seu computador em formato JSON.
          Os arquivos podem ser abertos em qualquer editor de texto ou importados futuramente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>

        {/* Entregas */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={22} color="#457bba" />
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Entregas de Moto</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Todos os romaneios cadastrados</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Arquivo: <code>backup-entregas-{dataHoje()}.json</code>
          </div>
          <button
            style={btnStyle('#457bba', loading.entregas)}
            onClick={exportarEntregas}
            disabled={loading.entregas}
          >
            <Download size={16} />
            {loading.entregas ? 'Exportando...' : 'Exportar Entregas'}
          </button>
        </div>

        {/* Clientes */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="#7c3aed" />
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Clientes e Endereços</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Cadastro completo de clientes</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Arquivo: <code>backup-clientes-{dataHoje()}.json</code>
          </div>
          <button
            style={btnStyle('#7c3aed', loading.clientes)}
            onClick={exportarClientes}
            disabled={loading.clientes}
          >
            <Download size={16} />
            {loading.clientes ? 'Exportando...' : 'Exportar Clientes'}
          </button>
        </div>

        {/* Sedex */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={22} color="#0891b2" />
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Sedex / Disktenha</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Remessas postadas</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Arquivo: <code>backup-sedex-{dataHoje()}.json</code>
          </div>
          <button
            style={btnStyle('#0891b2', loading.sedex)}
            onClick={exportarSedex}
            disabled={loading.sedex}
          >
            <Download size={16} />
            {loading.sedex ? 'Exportando...' : 'Exportar Sedex'}
          </button>
        </div>

        {/* Tudo — card em destaque */}
        <div style={{ ...cardStyle, border: '2px solid #16a34a', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive size={22} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, color: '#15803d' }}>Backup Completo</div>
              <div style={{ fontSize: '13px', color: '#4ade80' }}>
                Entregas + Clientes + Sedex + Motoboys + Usuários
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#86efac' }}>
            Arquivo: <code>backup-completo-{dataHoje()}.json</code>
          </div>
          <button
            style={btnStyle('#16a34a', loading.tudo)}
            onClick={exportarTudo}
            disabled={loading.tudo}
          >
            <Archive size={16} />
            {loading.tudo ? 'Exportando...' : 'Exportar Tudo'}
          </button>
        </div>

      </div>

      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: '#fffbeb',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#92400e',
      }}>
        <strong>Recomendação:</strong> Faça o backup completo regularmente (ex: uma vez por semana)
        e salve em um local seguro fora do computador (nuvem, pen drive, etc.).
        Senhas de usuários <strong>não são exportadas</strong> por segurança.
      </div>
    </div>
  );
}
