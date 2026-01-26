import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import ImpressaoRomaneio from "@/components/ImpressaoRomaneio";
import { CustomDropdown } from "@/components/CustomDropdown";

export default function DetalhesRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userType } = useAuth();
  const { id } = useParams();
  const romaneioId = id || new URLSearchParams(window.location.search).get('id');

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

  // Mutation para atualizar status de pagamento recebido
  const updatePagamentoMutation = useMutation({
    mutationFn: async ({ recebido }) => {
      const { error } = await supabase
        .from('entregas')
        .update({ pagamento_recebido: recebido })
        .eq('id', romaneioId);

      if (error) throw error;
    },
    onSuccess: (_, { recebido }) => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      toast.success(recebido ? 'Pagamento marcado como recebido!' : 'Pagamento marcado como pendente!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pagamento: ' + error.message);
    },
  });

  // Verifica se a forma de pagamento requer cobrança (não começa com "Pago")
  const requerCobranca = (forma) => {
    if (!forma) return false;
    const f = forma.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Formas que requerem cobrança: Dinheiro, Máquina, Receber, etc.
    return f.includes('dinheiro') || f.includes('maquina') || f.includes('receber') || f.includes('cartao');
  };

  const VALORES_UNICA_BRUNO = {
    'BC': 12, 'NOVA ESPERANÇA': 15, 'CAMBORIÚ': 20, 'TABULEIRO': 15,
    'MONTE ALEGRE': 15, 'BARRA': 15, 'ESTALEIRO': 25, 'TAQUARAS': 25,
    'LARANJEIRAS': 25, 'ITAJAI': 25, 'ESPINHEIROS': 35, 'PRAIA DOS AMORES': 15,
    'PRAIA BRAVA': 15, 'ITAPEMA': 35, 'NAVEGANTES': 50, 'PENHA': 75,
    'PORTO BELO': 60, 'TIJUCAS': 87, 'PIÇARRAS': 80, 'BOMBINHAS': 90, 'CLINICA': 12
  };

  const VALORES_NORMAIS_BRUNO = {
    'BC': 7, 'NOVA ESPERANÇA': 9, 'CAMBORIÚ': 14, 'TABULEIRO': 9,
    'MONTE ALEGRE': 9, 'BARRA': 9, 'ESTALEIRO': 14, 'TAQUARAS': 14,
    'LARANJEIRAS': 14, 'ITAJAI': 17, 'ESPINHEIROS': 21, 'PRAIA DOS AMORES': 11.50,
    'PRAIA BRAVA': 11.50, 'ITAPEMA': 25, 'NAVEGANTES': 40, 'PENHA': 50,
    'PORTO BELO': 30, 'TIJUCAS': 50, 'PIÇARRAS': 50, 'BOMBINHAS': 50, 'CLINICA': 7
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este romaneio?')) return;

    try {
      // Guardar dados antes de excluir para verificar entrega única
      const motoboyNome = romaneio?.motoboy?.nome;
      const motoboyId = romaneio?.motoboy_id;
      const dataEntrega = romaneio?.data_entrega;

      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', romaneioId);

      if (error) throw error;

      // Após excluir, verificar se as entregas restantes do Bruno devem virar entrega única
      if (motoboyNome === 'Bruno' && motoboyId && dataEntrega) {
        try {
          const { count: countManha } = await supabase
            .from('entregas')
            .select('*', { count: 'exact', head: true })
            .eq('motoboy_id', motoboyId)
            .eq('data_entrega', dataEntrega)
            .eq('periodo', 'Manhã');

          const { count: countTarde } = await supabase
            .from('entregas')
            .select('*', { count: 'exact', head: true })
            .eq('motoboy_id', motoboyId)
            .eq('data_entrega', dataEntrega)
            .eq('periodo', 'Tarde');

          // Se ambos períodos têm no máximo 1 entrega, são entregas únicas
          if (countManha <= 1 && countTarde <= 1) {
            const { data: entregasRestantes } = await supabase
              .from('entregas')
              .select('id, regiao, valor')
              .eq('motoboy_id', motoboyId)
              .eq('data_entrega', dataEntrega);

            if (entregasRestantes) {
              for (const entrega of entregasRestantes) {
                const valorUnico = VALORES_UNICA_BRUNO[entrega.regiao];
                const valorNormal = VALORES_NORMAIS_BRUNO[entrega.regiao];
                if (valorUnico && valorNormal && entrega.valor === valorNormal) {
                  await supabase
                    .from('entregas')
                    .update({ valor: valorUnico })
                    .eq('id', entrega.id);
                  console.log(`Entrega ${entrega.id} promovida para entrega única: R$${valorNormal} → R$${valorUnico}`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Erro ao atualizar entregas únicas do Bruno:', err);
        }
      }

      toast.success('Romaneio excluído com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir romaneio');
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
      'Entregue': '#3dac38',
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Romaneio #{numeroRequisicao}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Criado em {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleDateString('pt-BR') : '-'} às {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>

              {userType !== 'motoboy' && (
                <div className="flex flex-wrap items-center gap-2">
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
              )}
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

            {/* Coluna Esquerda */}
            <div className="flex flex-col gap-6">

              {/* Informações do Romaneio */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4" style={{ color: '#376295' }}>
                  <FileText size={18} />
                  <h2 className="text-lg font-bold">Informações do Romaneio</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
                        color: romaneio.status === 'Entregue' ? '#3dac38' : romaneio.status === 'A Caminho' ? '#f97316' : '#890d5d'
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
                      {romaneio.valor_venda > 0 && requerCobranca(romaneio.forma_pagamento) ? (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          background: romaneio.pagamento_recebido ? '#3dac38' : '#1b5e20',
                          borderRadius: '0.375rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: '500' }}>
                            {romaneio.pagamento_recebido ? 'Valor Recebido:' :
                             romaneio.forma_pagamento?.includes('Máquina') ? 'Receber na Máquina:' :
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

                      {/* Botão de controle de pagamento - apenas para formas que requerem cobrança */}
                      {requerCobranca(romaneio.forma_pagamento) && (
                        <button
                          onClick={() => updatePagamentoMutation.mutate({ recebido: !romaneio.pagamento_recebido })}
                          disabled={updatePagamentoMutation.isPending}
                          style={{
                            marginTop: '0.75rem',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: updatePagamentoMutation.isPending ? 'not-allowed' : 'pointer',
                            backgroundColor: romaneio.pagamento_recebido ? '#fee2e2' : '#dcfce7',
                            color: romaneio.pagamento_recebido ? '#991b1b' : '#166534',
                            opacity: updatePagamentoMutation.isPending ? 0.7 : 1
                          }}
                        >
                          {romaneio.pagamento_recebido ? (
                            <>
                              <AlertCircle size={18} />
                              {updatePagamentoMutation.isPending ? 'Atualizando...' : 'Marcar como Pendente'}
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              {updatePagamentoMutation.isPending ? 'Atualizando...' : 'Marcar como Recebido'}
                            </>
                          )}
                        </button>
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
