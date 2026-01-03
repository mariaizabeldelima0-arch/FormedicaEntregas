import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  FileText,
  Printer,
  Edit,
  Trash2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Snowflake,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIGS = {
  "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
  "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
  "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
  "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
  "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
  "Não Entregue": { color: "bg-red-100 text-red-700", icon: AlertCircle },
  "Voltou": { color: "bg-orange-100 text-orange-700", icon: Clock },
  "Cancelado": { color: "bg-gray-100 text-gray-700", icon: FileText },
};

const StatusBadge = ({ status }) => {
  const { color, icon: Icon } = STATUS_CONFIGS[status] || STATUS_CONFIGS["Pendente"];
  return (
    <Badge className={`${color} text-base px-4 py-2`}>
      <Icon className="w-4 h-4 mr-2" />
      {status}
    </Badge>
  );
};

export default function DetalhesRomaneio({ printMode = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const romaneioId = urlParams.get('id');

  // Forçar esconder sidebar ao imprimir
  useEffect(() => {
    const handleBeforePrint = () => {
      // Esconder todos os sidebars e elementos de navegação
      const elements = document.querySelectorAll('[data-sidebar="sidebar"], aside, nav, header');
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.position = 'absolute';
        el.style.left = '-99999px';
      });
    };

    const handleAfterPrint = () => {
      // Restaurar após impressão
      const elements = document.querySelectorAll('[data-sidebar="sidebar"], aside, nav, header');
      elements.forEach(el => {
        el.style.display = '';
        el.style.visibility = '';
        el.style.position = '';
        el.style.left = '';
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const { data: romaneio, isLoading, error } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      if (!romaneioId) {
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

      if (error) throw error;

      // Priorizar dados do snapshot de endereço
      const enderecoDisplay = data.endereco_logradouro
        ? {
            // Usar snapshot se existir
            id: data.endereco_id,
            logradouro: data.endereco_logradouro,
            numero: data.endereco_numero,
            complemento: data.endereco_complemento,
            bairro: data.endereco_bairro,
            cidade: data.endereco_cidade,
            cep: data.endereco_cep,
            regiao: data.regiao
          }
        : data.endereco; // Usar dados da relação se snapshot não existir

      return {
        ...data,
        endereco: enderecoDisplay
      };
    },
    enabled: !!romaneioId,
    retry: 2,
  });

  // Auto-imprimir quando em modo de impressão (precisa vir ANTES dos returns)
  useEffect(() => {
    if (printMode && romaneio) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [printMode, romaneio]);

  const handlePrint = () => {
    window.print();
  };

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Skeleton className="h-12 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !romaneio) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <Card className="max-w-2xl mx-auto border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Romaneio Não Encontrado</h2>
            <p className="text-slate-500 mb-4">
              {error?.message || "O romaneio que você está procurando não foi encontrado."}
            </p>
            <Button onClick={() => navigate(-1)} style={{ background: '#457bba' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se estiver em modo de impressão, renderizar apenas o conteúdo de impressão
  if (printMode) {
    return (
      <div style={{ width: '100%', height: '100vh', padding: 0, margin: 0 }}>
        <style>{`
          @media print {
            @page { margin: 0; }
            body { margin: 0; padding: 0; }
            .print-page {
              width: 210mm;
              padding: 15mm;
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
            }
            .print-header-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              font-size: 9pt;
              color: #666;
            }
            .print-logo-section {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 15px;
            }
            .print-logo {
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .print-company-name {
              font-size: 16pt;
              font-weight: bold;
              color: #000;
            }
            .print-title-section {
              text-align: center;
              margin: 20px 0;
              padding-bottom: 15px;
              border-bottom: 3px solid #000;
            }
            .print-main-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 0;
              letter-spacing: 1px;
            }
            .print-subtitle {
              font-size: 9pt;
              color: #666;
              margin: 4px 0 0 0;
            }
            .print-info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .print-label-orange {
              color: #d97706;
              font-weight: bold;
              font-size: 9pt;
              text-transform: uppercase;
            }
            .print-value-right {
              text-align: right;
              font-weight: 600;
              color: #000;
            }
            .print-section-title-orange {
              color: #d97706;
              font-weight: bold;
              font-size: 10pt;
              text-transform: uppercase;
              margin: 15px 0 8px 0;
            }
            .print-two-columns {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 15px 0;
            }
            .print-field {
              margin-bottom: 6px;
            }
            .print-field-label {
              font-size: 9pt;
              color: #666;
            }
            .print-field-value {
              font-weight: 600;
              color: #000;
            }
            .print-address-block {
              margin: 15px 0;
            }
            .print-address-main {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .print-checkbox-section {
              margin: 20px 0;
            }
            .print-checkbox-item {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 8px 0;
            }
            .print-checkbox {
              width: 16px;
              height: 16px;
              border: 2px solid #000;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .print-checkbox-checked {
              background-color: #000;
            }
            .print-checkbox-text {
              font-size: 10pt;
              font-weight: 600;
            }
            .print-valor-destaque {
              border: 2px solid #000;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .print-valor-destaque-text {
              font-size: 16pt;
              font-weight: bold;
            }
            .print-footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
          }
        `}</style>
        {!isLoading && !error && romaneio && (
          <div className="print-page">
            {/* Todo o conteúdo de impressão aqui */}
            <div className="print-header-top">
              <span>{format(new Date(), "dd/MM/yyyy, HH:mm")}</span>
              <span>Formédica Entregas</span>
            </div>

            <div className="print-logo-section">
              <div className="print-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div className="print-company-name">Formédica Entregas</div>
            </div>

            <div className="print-title-section">
              <h1 className="print-main-title">ROMANEIO DE ENTREGA</h1>
              <p className="print-subtitle">Sistema de Gestão de Entregas</p>
            </div>

            <div className="print-info-row">
              <span className="print-label-orange">Nº Requisição:</span>
              <span className="print-value-right"># {romaneio.requisicao}</span>
            </div>
            <div className="print-info-row">
              <span className="print-label-orange">Entrega de Dados:</span>
              <span className="print-value-right">
                {romaneio.data_entrega && format(parseISO(romaneio.data_entrega), "dd/MM/yyyy")}
                {romaneio.periodo_entrega && ` - ${romaneio.periodo_entrega}`}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-label-orange">Status:</span>
              <span className="print-value-right">{romaneio.status}</span>
            </div>

            <div className="print-two-columns">
              <div>
                <div className="print-section-title-orange">CLIENTE</div>
                <div className="print-field">
                  <span className="print-field-label">Nome: </span>
                  <span className="print-field-value">{romaneio.cliente?.nome || romaneio.cliente_nome}</span>
                </div>
                <div className="print-field">
                  <span className="print-field-label">Telefone: </span>
                  <span className="print-field-value">{romaneio.cliente?.telefone || romaneio.cliente_telefone}</span>
                </div>
              </div>

              <div>
                <div className="print-section-title-orange">RESPONSÁVEIS</div>
                <div className="print-field">
                  <span className="print-field-label">Convidado: </span>
                  <span className="print-field-value">{romaneio.cliente?.email || '-'}</span>
                </div>
                {romaneio.motoboy?.nome && (
                  <div className="print-field">
                    <span className="print-field-label">Motoboy: </span>
                    <span className="print-field-value">{romaneio.motoboy.nome}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="print-address-block">
              <div className="print-section-title-orange">ENDEREÇO DE ENTREGA</div>
              {romaneio.endereco ? (
                <>
                  <div className="print-address-main">
                    {romaneio.endereco.logradouro}, {romaneio.endereco.numero}
                  </div>
                  <div>{romaneio.endereco.bairro} - {romaneio.endereco.cidade}</div>
                  {romaneio.endereco.complemento && (
                    <div>Compl: {romaneio.endereco.complemento}</div>
                  )}
                  {romaneio.endereco.ponto_referencia && (
                    <div>Ref.: {romaneio.endereco.ponto_referencia}</div>
                  )}
                  {romaneio.endereco.aos_cuidados_de && (
                    <div>A/C: {romaneio.endereco.aos_cuidados_de}</div>
                  )}
                </>
              ) : (
                <div>{romaneio.endereco_completo || 'Não informado'}</div>
              )}
            </div>

            <div>
              <div className="print-section-title-orange">PAGAMENTO</div>
              <div className="print-info-row" style={{ border: 'none' }}>
                <span className="print-field-label">Forma:</span>
                <span className="print-value-right">{romaneio.forma_pagamento || 'Não informado'}</span>
              </div>
            </div>

            <div className="print-checkbox-section">
              <div className="print-checkbox-item">
                <div className={`print-checkbox ${romaneio.item_geladeira ? 'print-checkbox-checked' : ''}`}>
                  {romaneio.item_geladeira && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <circle cx="6" cy="6" r="3" />
                    </svg>
                  )}
                </div>
                <span className="print-checkbox-text">ITEM DE GELADEIRA - MANTER REFRIGERADO</span>
              </div>
              <div className="print-checkbox-item">
                <div className={`print-checkbox ${romaneio.buscar_receita ? 'print-checkbox-checked' : ''}`}>
                  {romaneio.buscar_receita && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <circle cx="6" cy="6" r="3" />
                    </svg>
                  )}
                </div>
                <span className="print-checkbox-text">BUSCAR RECEITA</span>
              </div>
            </div>

            {romaneio.observacoes && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #d97706' }}>
                <div className="print-label-orange" style={{ marginBottom: '5px' }}>OBSERVAÇÕES:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{romaneio.observacoes}</div>
              </div>
            )}

            {romaneio.valor && (
              <div className="print-valor-destaque">
                <div className="print-valor-destaque-text">
                  💰 COBRAR NA ENTREGA: R$ {romaneio.valor.toFixed(2)}
                </div>
                {romaneio.valor_troco && (
                  <div style={{ fontSize: '10pt', marginTop: '5px', color: '#666' }}>
                    Troco para: R$ {romaneio.valor_troco.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            <div className="print-footer">
              <div>Código de Rastreamento: {romaneio.codigo_rastreio || romaneio.id}</div>
              <div>Impresso em: {format(new Date(), "dd/MM/yyyy, HH:mm:ss")}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header - não imprime */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Romaneio #{romaneio.requisicao}</h1>
              <p className="text-slate-600 mt-1">Detalhes da entrega</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/editar-romaneio?id=${romaneio.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Card Principal com Gradiente */}
        <Card className="border-none shadow-lg overflow-hidden print:hidden">
          <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">#{romaneio.requisicao}</CardTitle>
                <p className="text-sm opacity-90">
                  {romaneio.data_entrega && format(parseISO(romaneio.data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <StatusBadge status={romaneio.status} />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#457bba] mb-3">
                  <User className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Cliente</h3>
                </div>
                <div className="space-y-2 pl-7">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium text-slate-900">{romaneio.cliente?.nome || romaneio.cliente_nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-700">{romaneio.cliente?.telefone || romaneio.cliente_telefone}</p>
                  </div>
                  {romaneio.cliente?.cpf && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-700">{romaneio.cliente.cpf}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#f59e0b] mb-3">
                  <MapPin className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Endereço de Entrega</h3>
                </div>
                <div className="space-y-2 pl-7">
                  {romaneio.endereco ? (
                    <>
                      <p className="font-medium text-slate-900">
                        {romaneio.endereco.logradouro}, {romaneio.endereco.numero}
                      </p>
                      {romaneio.endereco.complemento && (
                        <p className="text-slate-600">{romaneio.endereco.complemento}</p>
                      )}
                      <p className="text-slate-600">
                        {romaneio.endereco.bairro && `${romaneio.endereco.bairro} - `}
                        {romaneio.endereco.cidade}
                      </p>
                      {romaneio.endereco.cep && (
                        <p className="text-slate-600">CEP: {romaneio.endereco.cep}</p>
                      )}
                      {romaneio.endereco.regiao && (
                        <Badge variant="outline" className="mt-2">{romaneio.endereco.regiao}</Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-600">{romaneio.endereco_completo || 'Endereço não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Detalhes da Entrega */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Motoboy */}
              {romaneio.motoboy?.nome && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Motoboy</p>
                  <p className="font-semibold text-blue-900">{romaneio.motoboy.nome}</p>
                </div>
              )}

              {/* Data de Entrega */}
              {romaneio.data_entrega && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm">Data de Entrega</p>
                  </div>
                  <p className="font-semibold text-purple-900">
                    {format(parseISO(romaneio.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Região */}
              {romaneio.regiao && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <p className="text-sm">Região</p>
                  </div>
                  <p className="font-semibold text-amber-900">{romaneio.regiao}</p>
                </div>
              )}
            </div>

            {/* Pagamento */}
            {romaneio.forma_pagamento && (
              <>
                <div className="border-t pt-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Pagamento</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-slate-500">Forma de Pagamento</p>
                      <p className="font-medium text-slate-900">{romaneio.forma_pagamento}</p>
                    </div>
                    {romaneio.valor && (
                      <div>
                        <p className="text-sm text-slate-500">Valor</p>
                        <p className="font-medium text-slate-900">R$ {romaneio.valor.toFixed(2)}</p>
                      </div>
                    )}
                    {romaneio.valor_troco && (
                      <div>
                        <p className="text-sm text-slate-500">Troco para</p>
                        <p className="font-medium text-slate-900">R$ {romaneio.valor_troco.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Observações */}
            {romaneio.observacoes && (
              <>
                <div className="border-t pt-6" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Observações</h3>
                  </div>
                  <div className="pl-7 p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">{romaneio.observacoes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Informações Adicionais */}
            <div className="border-t pt-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {romaneio.item_geladeira && (
                <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
                  <Snowflake className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-900">Item Geladeira</span>
                </div>
              )}
              {romaneio.buscar_receita && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">Buscar Receita</span>
                </div>
              )}
              {romaneio.created_at && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg col-span-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Criado em</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(parseISO(romaneio.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Versão para impressão */}
        <div className="hidden print:block print-wrapper">
          <style>{`
            @media print {
              @page { margin: 0; size: A4; }

              /* Esconder TUDO */
              * {
                visibility: hidden !important;
              }

              /* Mostrar APENAS print-wrapper e filhos */
              .print-wrapper,
              .print-wrapper *,
              .print-page,
              .print-page * {
                visibility: visible !important;
              }

              .print-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
              }

              .print-page {
                width: 210mm;
                padding: 15mm;
                font-family: Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.4;
              }
              .print-header-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-size: 9pt;
                color: #666;
              }
              .print-logo-section {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
              }
              .print-logo {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .print-company-name {
                font-size: 16pt;
                font-weight: bold;
                color: #000;
              }
              .print-title-section {
                text-align: center;
                margin: 20px 0;
                padding-bottom: 15px;
                border-bottom: 3px solid #000;
              }
              .print-main-title {
                font-size: 14pt;
                font-weight: bold;
                margin: 0;
                letter-spacing: 1px;
              }
              .print-subtitle {
                font-size: 9pt;
                color: #666;
                margin: 4px 0 0 0;
              }
              .print-info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
              }
              .print-label-orange {
                color: #d97706;
                font-weight: bold;
                font-size: 9pt;
                text-transform: uppercase;
              }
              .print-value-right {
                text-align: right;
                font-weight: 600;
                color: #000;
              }
              .print-section-title-orange {
                color: #d97706;
                font-weight: bold;
                font-size: 10pt;
                text-transform: uppercase;
                margin: 15px 0 8px 0;
              }
              .print-two-columns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 15px 0;
              }
              .print-field {
                margin-bottom: 6px;
              }
              .print-field-label {
                font-size: 9pt;
                color: #666;
              }
              .print-field-value {
                font-weight: 600;
                color: #000;
              }
              .print-address-block {
                margin: 15px 0;
              }
              .print-address-main {
                font-size: 12pt;
                font-weight: bold;
                margin-bottom: 4px;
              }
              .print-checkbox-section {
                margin: 20px 0;
              }
              .print-checkbox-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 8px 0;
              }
              .print-checkbox {
                width: 16px;
                height: 16px;
                border: 2px solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              .print-checkbox-checked {
                background-color: #000;
              }
              .print-checkbox-text {
                font-size: 10pt;
                font-weight: 600;
              }
              .print-valor-destaque {
                border: 2px solid #000;
                padding: 15px;
                text-align: center;
                margin: 20px 0;
              }
              .print-valor-destaque-text {
                font-size: 16pt;
                font-weight: bold;
              }
              .print-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                font-size: 9pt;
                color: #666;
              }
            }
          `}</style>
          <div className="print-page">
            {/* Cabeçalho com data e nome */}
            <div className="print-header-top">
              <span>{format(new Date(), "dd/MM/yyyy, HH:mm")}</span>
              <span>Formédica Entregas</span>
            </div>

            {/* Logo e Nome da Empresa */}
            <div className="print-logo-section">
              <div className="print-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div className="print-company-name">Formédica Entregas</div>
            </div>

            {/* Título Principal */}
            <div className="print-title-section">
              <h1 className="print-main-title">ROMANEIO DE ENTREGA</h1>
              <p className="print-subtitle">Sistema de Gestão de Entregas</p>
            </div>

            {/* Informações da Requisição */}
            <div className="print-info-row">
              <span className="print-label-orange">Nº Requisição:</span>
              <span className="print-value-right"># {romaneio.requisicao}</span>
            </div>
            <div className="print-info-row">
              <span className="print-label-orange">Entrega de Dados:</span>
              <span className="print-value-right">
                {romaneio.data_entrega && format(parseISO(romaneio.data_entrega), "dd/MM/yyyy")}
                {romaneio.periodo_entrega && ` - ${romaneio.periodo_entrega}`}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-label-orange">Status:</span>
              <span className="print-value-right">{romaneio.status}</span>
            </div>

            {/* Cliente e Responsáveis em 2 colunas */}
            <div className="print-two-columns">
              {/* Cliente */}
              <div>
                <div className="print-section-title-orange">CLIENTE</div>
                <div className="print-field">
                  <span className="print-field-label">Nome: </span>
                  <span className="print-field-value">{romaneio.cliente?.nome || romaneio.cliente_nome}</span>
                </div>
                <div className="print-field">
                  <span className="print-field-label">Telefone: </span>
                  <span className="print-field-value">{romaneio.cliente?.telefone || romaneio.cliente_telefone}</span>
                </div>
              </div>

              {/* Responsáveis */}
              <div>
                <div className="print-section-title-orange">RESPONSÁVEIS</div>
                <div className="print-field">
                  <span className="print-field-label">Convidado: </span>
                  <span className="print-field-value">{romaneio.cliente?.email || '-'}</span>
                </div>
                {romaneio.motoboy?.nome && (
                  <div className="print-field">
                    <span className="print-field-label">Motoboy: </span>
                    <span className="print-field-value">{romaneio.motoboy.nome}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div className="print-address-block">
              <div className="print-section-title-orange">ENDEREÇO DE ENTREGA</div>
              {romaneio.endereco ? (
                <>
                  <div className="print-address-main">
                    {romaneio.endereco.logradouro}, {romaneio.endereco.numero}
                  </div>
                  <div>{romaneio.endereco.bairro} - {romaneio.endereco.cidade}</div>
                  {romaneio.endereco.complemento && (
                    <div>Compl: {romaneio.endereco.complemento}</div>
                  )}
                  {romaneio.endereco.ponto_referencia && (
                    <div>Ref.: {romaneio.endereco.ponto_referencia}</div>
                  )}
                  {romaneio.endereco.aos_cuidados_de && (
                    <div>A/C: {romaneio.endereco.aos_cuidados_de}</div>
                  )}
                </>
              ) : (
                <div>{romaneio.endereco_completo || 'Não informado'}</div>
              )}
            </div>

            {/* Pagamento */}
            <div>
              <div className="print-section-title-orange">PAGAMENTO</div>
              <div className="print-info-row" style={{ border: 'none' }}>
                <span className="print-field-label">Forma:</span>
                <span className="print-value-right">{romaneio.forma_pagamento || 'Não informado'}</span>
              </div>
            </div>

            {/* Checkboxes - Item de Geladeira e Buscar Receita */}
            <div className="print-checkbox-section">
              <div className="print-checkbox-item">
                <div className={`print-checkbox ${romaneio.item_geladeira ? 'print-checkbox-checked' : ''}`}>
                  {romaneio.item_geladeira && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <circle cx="6" cy="6" r="3" />
                    </svg>
                  )}
                </div>
                <span className="print-checkbox-text">ITEM DE GELADEIRA - MANTER REFRIGERADO</span>
              </div>
              <div className="print-checkbox-item">
                <div className={`print-checkbox ${romaneio.buscar_receita ? 'print-checkbox-checked' : ''}`}>
                  {romaneio.buscar_receita && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <circle cx="6" cy="6" r="3" />
                    </svg>
                  )}
                </div>
                <span className="print-checkbox-text">BUSCAR RECEITA</span>
              </div>
            </div>

            {/* Observações (se houver) */}
            {romaneio.observacoes && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #d97706' }}>
                <div className="print-label-orange" style={{ marginBottom: '5px' }}>OBSERVAÇÕES:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{romaneio.observacoes}</div>
              </div>
            )}

            {/* Valor a Cobrar */}
            {romaneio.valor && (
              <div className="print-valor-destaque">
                <div className="print-valor-destaque-text">
                  💰 COBRAR NA ENTREGA: R$ {romaneio.valor.toFixed(2)}
                </div>
                {romaneio.valor_troco && (
                  <div style={{ fontSize: '10pt', marginTop: '5px', color: '#666' }}>
                    Troco para: R$ {romaneio.valor_troco.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Rodapé */}
            <div className="print-footer">
              <div>Código de Rastreamento: {romaneio.codigo_rastreio || romaneio.id}</div>
              <div>Impresso em: {format(new Date(), "dd/MM/yyyy, HH:mm:ss")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
