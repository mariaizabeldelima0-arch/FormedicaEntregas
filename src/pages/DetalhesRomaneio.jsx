import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Edit,
  Trash2,
  Clock,
  MapPin,
  Phone,
  User,
  DollarSign,
  Truck,
  FileText,
  Image as ImageIcon,
  Download
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ImpressaoRomaneio from "@/components/ImpressaoRomaneio";

export default function DetalhesRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const romaneioId = id || new URLSearchParams(window.location.search).get('id');

  const [pagamentoMotoboy, setPagamentoMotoboy] = useState("Aguardando");
  const [pagamentoRecebido, setPagamentoRecebido] = useState(false);

  const { data: romaneio, isLoading, error: queryError } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      console.log('🔍 Buscando romaneio com ID:', romaneioId);

      if (!romaneioId) {
        console.error('❌ ID do romaneio não fornecido');
        throw new Error("ID do romaneio não fornecido");
      }

      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone, cpf, email),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento, cep, regiao),
          motoboy:motoboys(id, nome)
        `)
        .eq('id', romaneioId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar romaneio:', error);
        throw error;
      }

      console.log('✅ Romaneio encontrado:', data);

      // Buscar clientes adicionais se houver
      let clientesAdicionais = [];
      if (data.clientes_adicionais && data.clientes_adicionais.length > 0) {
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, nome, telefone')
          .in('id', data.clientes_adicionais);
        clientesAdicionais = clientesData || [];
      }

      // Priorizar dados do snapshot de endereço
      const enderecoDisplay = data.endereco_logradouro
        ? {
            id: data.endereco_id,
            logradouro: data.endereco_logradouro,
            numero: data.endereco_numero,
            complemento: data.endereco_complemento,
            bairro: data.endereco_bairro,
            cidade: data.endereco_cidade,
            cep: data.endereco_cep,
            regiao: data.regiao
          }
        : data.endereco;

      // Buscar informações do atendente se houver
      let atendente = null;
      if (data.atendente_id) {
        const { data: atendenteData } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .eq('id', data.atendente_id)
          .single();
        atendente = atendenteData;
      }

      return {
        ...data,
        endereco: enderecoDisplay,
        clientesAdicionais,
        atendente
      };
    },
    enabled: !!romaneioId,
  });

  // Log de debug para ver o que está acontecendo
  useEffect(() => {
    if (queryError) {
      console.error('❌ Erro na query:', queryError);
    }
  }, [queryError]);

  useEffect(() => {
    if (romaneio) {
      setPagamentoRecebido(romaneio.pagamento_recebido || false);
    }
  }, [romaneio]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este romaneio?')) return;

    try {
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', romaneioId);

      if (error) throw error;

      toast.success('Romaneio excluído com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir romaneio');
    }
  };

  const handlePagamentoRecebidoChange = async (checked) => {
    setPagamentoRecebido(checked);

    try {
      const { error } = await supabase
        .from('entregas')
        .update({ pagamento_recebido: checked })
        .eq('id', romaneioId);

      if (error) throw error;

      toast.success('Pagamento atualizado!');
      queryClient.invalidateQueries(['romaneio', romaneioId]);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast.error('Erro ao atualizar pagamento');
      setPagamentoRecebido(!checked);
    }
  };

  const handleAlterarStatus = () => {
    // Implementar lógica de alteração de status
    toast.info('Funcionalidade em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="py-8 shadow-sm mb-6" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-white">Detalhes do Romaneio</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-xl text-slate-600">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!romaneio && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="py-8 shadow-sm mb-6" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-white">Detalhes do Romaneio</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
            <div className="text-2xl font-bold text-slate-900 mb-4">
              Romaneio não encontrado
            </div>
            <div className="text-sm text-slate-600 mb-4">
              ID buscado: {romaneioId || 'Nenhum ID fornecido'}
            </div>
            {queryError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="text-sm text-red-600">
                  Erro: {queryError.message}
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: '#376295', color: 'white' }}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formatar número de requisição (combinar se houver múltiplos clientes)
  const numeroRequisicao = romaneio.requisicao || '';

  // Todos os clientes (principal + adicionais)
  const todosClientes = [romaneio.cliente, ...(romaneio.clientesAdicionais || [])].filter(Boolean);
  const nomesClientes = todosClientes.map(c => c.nome).join(', ');
  const telefonesClientes = todosClientes.map(c => c.telefone).filter(Boolean).join(', ');

  // Cor do status
  const getStatusColor = (status) => {
    const colors = {
      'A Caminho': '#8b5cf6',
      'Produzindo no Laboratório': '#3b82f6',
      'Entregue': '#10b981',
      'Não Entregue': '#ef4444',
      'Pendente': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
        {/* Header Customizado */}
        <div className="py-8 shadow-sm mb-6" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white">Detalhes do Romaneio</h1>
                <p className="text-base text-white opacity-90 mt-1">Visualização completa da entrega</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">

          {/* Cabeçalho */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 rounded-lg transition-all border border-slate-300 hover:bg-slate-50"
                >
                  <ChevronLeft size={20} style={{ color: '#376295' }} />
                </button>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Romaneio #{numeroRequisicao}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Criado em {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleDateString('pt-BR') : '-'} às {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/editar-romaneio?id=${romaneioId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#376295', color: 'white' }}
                  title="Editar"
                >
                  <Edit size={16} />
                  Editar
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#890d5d', color: 'white' }}
                  title="Imprimir"
                >
                  <Printer size={16} />
                  Imprimir
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-[1fr_400px] gap-6">

            {/* Coluna Esquerda */}
            <div className="flex flex-col gap-6">

              {/* Informações do Romaneio */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <FileText size={18} />
                  <h2 className="text-lg font-bold">Informações do Romaneio</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gap: '3.5rem', justifyContent: 'start' }}>
                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      Número da Requisição
                    </div>
                    <div className="text-base font-semibold" style={{ color: '#376295' }}>
                      #{numeroRequisicao}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      Status
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded text-xs font-medium" style={{
                        backgroundColor: romaneio.status === 'Entregue' ? '#E8F5E8' : romaneio.status === 'A Caminho' ? '#FEF3E8' : '#F5E8F5',
                        color: romaneio.status === 'Entregue' ? '#22c55e' : romaneio.status === 'A Caminho' ? '#f97316' : '#890d5d'
                      }}>
                        {romaneio.status === 'Produzindo no Laboratório' ? 'Produção' : romaneio.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      Data de Entrega Prevista
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      {romaneio.data_entrega ? new Date(romaneio.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} - {romaneio.periodo}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      Valor da Entrega
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#376295' }}>
                      R$ {(romaneio.valor || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <User size={18} />
                  <h2 className="text-lg font-bold">Cliente</h2>
                </div>

                <div>
                  <div className="text-lg font-bold text-slate-900 mb-2">
                    {nomesClientes}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} />
                    {telefonesClientes}
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <MapPin size={18} />
                  <h2 className="text-lg font-bold">Endereço de Entrega</h2>
                </div>

                <div className="text-sm text-slate-600">
                  <div className="font-bold text-slate-900 mb-1">
                    {romaneio.endereco?.logradouro}, {romaneio.endereco?.numero}
                  </div>
                  <div className="mb-3">
                    {romaneio.endereco?.bairro} - {romaneio.endereco?.cidade}
                  </div>
                  {romaneio.endereco?.complemento && (
                    <div className="text-sm text-slate-600">
                      Complemento: {romaneio.endereco.complemento}
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <FileText size={18} />
                  <h2 className="text-lg font-bold">Observações</h2>
                </div>
                <div className="text-sm text-slate-600">
                  {romaneio.observacoes || 'Nenhuma observação'}
                </div>
              </div>

              {/* Imagens Anexadas */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2" style={{ color: '#376295' }}>
                    <ImageIcon size={18} />
                    <h2 className="text-lg font-bold">Imagens Anexadas</h2>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all" style={{ backgroundColor: '#376295', color: 'white' }}>
                    <Download size={14} />
                    Anexar Imagens
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
                  <ImageIcon size={48} className="mb-2 opacity-30" />
                  <div className="text-sm">Nenhuma imagem anexada</div>
                </div>
              </div>

            </div>

            {/* Coluna Direita */}
            <div className="flex flex-col gap-6">

              {/* Informações */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <FileText size={20} />
                  <h2 className="text-xl font-bold">Informações</h2>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-slate-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1">Região</div>
                      <div className="text-base font-semibold" style={{ color: '#376295' }}>
                        {romaneio.regiao || romaneio.endereco?.regiao || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-slate-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1">Pagamento</div>
                      <div className="text-base font-semibold text-slate-900">
                        {romaneio.forma_pagamento}
                      </div>
                      {romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento) ? (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          background: '#1b5e20',
                          borderRadius: '0.375rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: '500' }}>
                            {romaneio.forma_pagamento === 'Receber Máquina' ? 'Receber na Máquina:' :
                             romaneio.forma_pagamento === 'Pagar MP' ? 'Cobrar via MP:' : 'Valor a Receber:'}
                          </div>
                          <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700' }}>
                            R$ {romaneio.valor_venda.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold mt-1" style={{ color: '#376295' }}>
                          R$ {(romaneio.valor || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-slate-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1">Período</div>
                      <div className="text-base font-semibold text-slate-900">
                        {romaneio.periodo}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck size={20} className="text-slate-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1">Motoboy</div>
                      <div className="text-base font-semibold text-slate-900">
                        {romaneio.motoboy?.nome || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User size={20} className="text-slate-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1">Atendente</div>
                      <div className="text-base font-semibold text-slate-900">
                        {romaneio.atendente?.email || romaneio.atendente?.nome || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Item de Geladeira */}
                  {romaneio.item_geladeira && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '12px 15px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      border: '2px solid #2196F3',
                      backgroundColor: '#E3F2FD',
                      color: '#1565C0',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>❄</span>
                      <span>ITEM DE GELADEIRA</span>
                      <span style={{ fontSize: '20px' }}>❄</span>
                    </div>
                  )}

                  {/* Reter Receita */}
                  {romaneio.buscar_receita && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '12px 15px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      border: '2px solid #FF9800',
                      backgroundColor: '#FFF3E0',
                      color: '#E65100',
                      borderRadius: '8px'
                    }}>
                      <FileText size={20} />
                      <span>RETER RECEITA</span>
                      <FileText size={20} />
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 mt-2">
                    <div className="text-xs text-slate-500 mb-2">
                      Pagamento Motoboy
                    </div>
                    <select
                      value={pagamentoMotoboy}
                      onChange={(e) => setPagamentoMotoboy(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Aguardando">Aguardando</option>
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pagamentoRecebido}
                        onChange={(e) => handlePagamentoRecebidoChange(e.target.checked)}
                        className="w-4 h-4"
                        style={{ accentColor: '#376295' }}
                      />
                      <span className="text-sm text-slate-700 font-medium">
                        Pagamento Recebido
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Código de Rastreio */}
              <div className="rounded-xl shadow-lg p-6" style={{
                background: 'linear-gradient(135deg, #890d5d 0%, #457bba 100%)'
              }}>
                <div className="text-sm font-semibold text-white opacity-90 mb-4 text-center">
                  Código de Rastreio
                </div>
                <div className="bg-white bg-opacity-20 p-6 rounded-lg text-center backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white tracking-widest font-mono">
                    {romaneio.codigo_rastreio || '54NVT9NS'}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Componente de impressão (oculto na tela, visível na impressão) */}
      <ImpressaoRomaneio romaneio={romaneio} />
    </>
  );
}
