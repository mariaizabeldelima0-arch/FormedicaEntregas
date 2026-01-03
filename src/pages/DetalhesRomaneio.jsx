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

  const { data: romaneio, isLoading } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      if (!romaneioId) throw new Error("ID do romaneio não fornecido");

      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone, cpf, email),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento, cep, regiao, ponto_referencia, aos_cuidados_de),
          motoboy:motoboys(id, nome),
          atendente:usuarios(id, nome, email)
        `)
        .eq('id', romaneioId)
        .single();

      if (error) throw error;

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

      return {
        ...data,
        endereco: enderecoDisplay,
        clientesAdicionais
      };
    },
    enabled: !!romaneioId,
  });

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
      navigate('/entregas-moto');
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
      <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!romaneio) {
    return (
      <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Romaneio não encontrado</div>
          <Button onClick={() => navigate('/entregas-moto')} style={{ marginTop: '1rem' }}>
            Voltar
          </Button>
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
      <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Cabeçalho */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => navigate('/entregas-moto')}
                  style={{
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                <div>
                  <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    margin: 0,
                    color: '#1f2937'
                  }}>
                    Romaneio #{numeroRequisicao}
                  </h1>
                  <p style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    Criado em {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleDateString('pt-BR') : '-'} às {romaneio.data_criacao ? new Date(romaneio.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAlterarStatus}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '1px solid #8b5cf6',
                    borderRadius: '6px',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Clock size={16} />
                  A Caminho
                </button>

                <button
                  onClick={handleAlterarStatus}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Clock size={16} />
                  Alterar Status
                </button>

                <button
                  onClick={() => navigate(`/editar-romaneio?id=${romaneioId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Edit size={16} />
                  Editar
                </button>

                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Printer size={16} />
                  Imprimir
                </button>

                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>

                <button
                  style={{
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>

            {/* Coluna Esquerda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Informações do Romaneio */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <FileText size={18} />
                  Informações do Romaneio
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Número da Requisição
                    </div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      #{numeroRequisicao}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Status
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        background: getStatusColor(romaneio.status),
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        <Clock size={14} />
                        {romaneio.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Data de Entrega Prevista
                    </div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {romaneio.data_entrega ? new Date(romaneio.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} - {romaneio.periodo}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Valor da Entrega
                    </div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.125rem' }}>
                      R$ {(romaneio.valor || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <User size={18} />
                  Cliente
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    {nomesClientes}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    <Phone size={14} />
                    {telefonesClientes}
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <MapPin size={18} />
                  Endereço de Entrega
                </div>

                <div style={{ color: '#1f2937' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {romaneio.endereco?.logradouro}, {romaneio.endereco?.numero}
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    {romaneio.endereco?.bairro} - {romaneio.endereco?.cidade}
                  </div>
                  {romaneio.endereco?.complemento && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Complemento: {romaneio.endereco.complemento}
                    </div>
                  )}
                  {romaneio.endereco?.ponto_referencia && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Referência: {romaneio.endereco.ponto_referencia}
                    </div>
                  )}
                  {romaneio.endereco?.aos_cuidados_de && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: '#eff6ff',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      color: '#1e40af'
                    }}>
                      Aos cuidados de: {romaneio.endereco.aos_cuidados_de}
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  Observações
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {romaneio.observacoes || 'Nenhuma observação'}
                </div>
              </div>

              {/* Imagens Anexadas */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <ImageIcon size={18} />
                    Imagens Anexadas
                  </div>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <Download size={14} />
                    Anexar Imagens
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  color: '#9ca3af'
                }}>
                  <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                  <div style={{ fontSize: '0.875rem' }}>Nenhuma imagem anexada</div>
                </div>
              </div>

            </div>

            {/* Coluna Direita */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Informações */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Informações
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <MapPin size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Região</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {romaneio.regiao || romaneio.endereco?.regiao || '-'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <DollarSign size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pagamento</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {romaneio.forma_pagamento}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '600' }}>
                        R$ {(romaneio.valor || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Clock size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Período</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {romaneio.periodo}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Truck size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Motoboy</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {romaneio.motoboy?.nome || '-'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <User size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Atendente</div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {romaneio.atendente?.email || romaneio.atendente?.nome || '-'}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Pagamento Motoboy
                    </div>
                    <select
                      value={pagamentoMotoboy}
                      onChange={(e) => setPagamentoMotoboy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}
                    >
                      <option value="Aguardando">Aguardando</option>
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={pagamentoRecebido}
                        onChange={(e) => handlePagamentoRecebidoChange(e.target.checked)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        Pagamento Recebido
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Código de Rastreio */}
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Código de Rastreio
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: 'white',
                    letterSpacing: '0.1em',
                    fontFamily: 'monospace'
                  }}>
                    {romaneio.codigo_rastreio || '54NVT9NS'}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Componente de impressão (oculto) */}
      <div style={{ display: 'none' }}>
        <ImpressaoRomaneio romaneio={romaneio} />
      </div>
    </>
  );
}
