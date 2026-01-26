import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  FileText,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  ClipboardList,
  Paperclip,
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Receitas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TODOS os useState juntos (regra dos hooks)
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [verTodas, setVerTodas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [tipoAnexo, setTipoAnexo] = useState("");
  const [descricaoAnexo, setDescricaoAnexo] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Buscar entregas com buscar_receita = true
  const { data: entregas = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['receitas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone, cpf),
          endereco:enderecos(cidade, regiao),
          motoboy:motoboys(nome)
        `)
        .eq('buscar_receita', true)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    retryDelay: 1000,
  });

  // Invalidar cache quando componente montar
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['receitas'] });
  }, [queryClient]);

  // Mostrar erro se houver
  useEffect(() => {
    if (queryError) {
      toast.error('Erro ao carregar receitas: ' + queryError.message);
    }
  }, [queryError]);

  // Early return para loading inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-[#457bba] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando receitas...</p>
        </div>
      </div>
    );
  }

  // Função para fazer upload do anexo
  const handleUploadAnexo = async () => {
    if (!arquivoSelecionado || !tipoAnexo || !receitaSelecionada) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);
    try {
      // Upload do arquivo para Supabase Storage
      const fileExt = arquivoSelecionado.name.split('.').pop();
      const fileName = `${receitaSelecionada.id}_${tipoAnexo}_${Date.now()}.${fileExt}`;
      const filePath = `anexos/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('entregas-anexos')
        .upload(filePath, arquivoSelecionado);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('entregas-anexos')
        .getPublicUrl(filePath);

      // Atualizar o registro no banco de dados
      const updateData = {
        [`${tipoAnexo.toLowerCase()}_anexo`]: publicUrl,
        [`${tipoAnexo.toLowerCase()}_descricao`]: descricaoAnexo || null,
      };

      const { error: updateError } = await supabase
        .from('entregas')
        .update(updateData)
        .eq('id', receitaSelecionada.id);

      if (updateError) throw updateError;

      toast.success('Anexo enviado com sucesso!');

      // Refetch das receitas
      queryClient.invalidateQueries(['receitas']);

      // Resetar modal
      setUploadModalOpen(false);
      setTipoAnexo("");
      setDescricaoAnexo("");
      setArquivoSelecionado(null);
      setReceitaSelecionada(null);

      // Redirecionar baseado no tipo
      if (tipoAnexo === 'Receita') {
        // Já está na página de receitas, apenas fecha o modal
      } else if (tipoAnexo === 'Pagamento') {
        navigate('/pagamentos');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar anexo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const abrirModalUpload = (receita) => {
    setReceitaSelecionada(receita);
    setUploadModalOpen(true);
  };

  // Filtrar receitas
  const receitasFiltradas = entregas.filter(e => {
    // Filtro de data
    if (!verTodas && dataSelecionada && e.data_entrega) {
      const dataEntrega = parseISO(e.data_entrega);
      if (!isSameDay(dataEntrega, dataSelecionada)) return false;
    }

    // Filtro de status (pendente = não recebida, recebida = marcada como recebida)
    if (filtroStatus === "pendentes" && e.receita_recebida) return false;
    if (filtroStatus === "recebidas" && !e.receita_recebida) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        e.requisicao?.toLowerCase().includes(termo) ||
        e.cliente?.nome?.toLowerCase().includes(termo) ||
        e.cliente?.telefone?.toLowerCase().includes(termo) ||
        e.cliente?.cpf?.toLowerCase().includes(termo) ||
        e.cliente_nome?.toLowerCase().includes(termo) ||
        e.cliente_telefone?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Filtrar por data primeiro (para os cards refletirem o filtro de dia)
  const entregasPorData = entregas.filter(e => {
    if (!verTodas && dataSelecionada && e.data_entrega) {
      const dataEntrega = parseISO(e.data_entrega);
      if (!isSameDay(dataEntrega, dataSelecionada)) return false;
    }
    return true;
  });

  // Contar por status (baseado no filtro de data)
  const pendentes = entregasPorData.filter(e => !e.receita_recebida).length;
  const recebidas = entregasPorData.filter(e => e.receita_recebida).length;

  // Contar receitas por dia - garantir que está pegando o mês atual
  const receitasPorDia = entregas.reduce((acc, e) => {
    if (e.data_entrega) {
      try {
        const dataEntrega = parseISO(e.data_entrega);
        const data = format(dataEntrega, 'yyyy-MM-dd');
        acc[data] = (acc[data] || 0) + 1;
      } catch (error) {
        console.error('Erro ao processar data:', e.data_entrega);
      }
    }
    return acc;
  }, {});

  // Gerar dias do calendário
  const primeiroDia = startOfMonth(mesAtual);
  const ultimoDia = endOfMonth(mesAtual);
  const diasDoMes = eachDayOfInterval({ start: primeiroDia, end: ultimoDia });

  // Preencher dias vazios no início
  const diaSemanaInicio = primeiroDia.getDay();
  const diasVaziosInicio = Array(diaSemanaInicio).fill(null);

  // Combinar dias vazios + dias do mês
  const todosDias = [...diasVaziosInicio, ...diasDoMes];

  const handleDiaClick = (dia) => {
    setDataSelecionada(dia);
    if (verTodas) {
      setVerTodas(false);
    }
  };

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Customizado */}
      <div className="py-8 shadow-sm" style={{
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
              <h1 className="text-4xl font-bold text-white">Receitas</h1>
              <p className="text-base text-white opacity-90 mt-1">Gerenciamento de receitas retidas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6" key={`filter-${verTodas}-${dataSelecionada?.getTime() || 'all'}`}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Filtrar por dados</h3>

              {/* Botões Por Dia / Todos */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setVerTodas(false);
                    if (!dataSelecionada) {
                      setDataSelecionada(new Date());
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: !verTodas ? '#376295' : 'white',
                    color: !verTodas ? 'white' : '#64748b',
                    border: !verTodas ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Por Dia
                </button>

                <button
                  onClick={() => {
                    setVerTodas(true);
                    setDataSelecionada(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: verTodas ? '#376295' : 'white',
                    color: verTodas ? 'white' : '#64748b',
                    border: verTodas ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <ClipboardList className="w-4 h-4" />
                  Todos
                </button>
              </div>

              {/* Calendário */}
              <div className="border rounded-xl p-3 mb-4" key={format(mesAtual, 'yyyy-MM')}>
                {/* Header do Calendário */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={mesAnterior}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>
                  <div className="text-sm font-semibold text-slate-700">
                    {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <button
                    onClick={proximoMes}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((dia) => (
                    <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-2">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Dias do mês */}
                <div className="grid grid-cols-7 gap-1">
                  {todosDias.map((dia, index) => {
                    if (!dia) {
                      return <div key={`vazio-${index}`} className="aspect-square" />;
                    }

                    const dataKey = format(dia, 'yyyy-MM-dd');
                    const qtdReceitas = receitasPorDia[dataKey] || 0;
                    const temReceitas = qtdReceitas > 0;
                    const estaSelecionado = dataSelecionada && isSameDay(dia, dataSelecionada);
                    const ehHoje = isSameDay(dia, new Date());

                    return (
                      <button
                        key={dataKey}
                        onClick={() => handleDiaClick(dia)}
                        className={`
                          aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative
                          transition-all hover:bg-blue-50
                        `}
                        style={{
                          backgroundColor: estaSelecionado ? '#376295' :
                            !estaSelecionado && ehHoje ? '#e2e8f0' :
                            !estaSelecionado && !ehHoje && temReceitas ? '#F5E8F5' : 'transparent',
                          color: estaSelecionado ? 'white' :
                            estaSelecionado === false && ehHoje ? '#376295' :
                            !estaSelecionado && !ehHoje && temReceitas ? '#890d5d' : '#1e293b',
                          fontWeight: estaSelecionado || ehHoje || temReceitas ? 'bold' : 'normal',
                          boxShadow: estaSelecionado ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                        }}
                      >
                        <span>{format(dia, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info da data selecionada */}
              <div className="text-center pt-4 border-t border-slate-200">
                {dataSelecionada && !verTodas && (
                  <div className="text-base font-semibold text-slate-700">
                    {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  {receitasFiltradas.length} receita{receitasFiltradas.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Busca */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Buscar</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número, nome, telefone ou CPF..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Cards de Status - Clicáveis */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setFiltroStatus(filtroStatus === "pendentes" ? "todos" : "pendentes")}
                className="rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md text-center"
                style={{
                  backgroundColor: "#E8F0F8",
                  padding: "1.5rem",
                  border: filtroStatus === "pendentes" ? "2px solid #376295" : "2px solid transparent"
                }}
              >
                <p className="text-5xl font-bold mb-2" style={{ color: "#376295" }}>{pendentes}</p>
                <p className="text-sm font-medium" style={{ color: "#376295" }}>Pendentes</p>
              </div>

              <div
                onClick={() => setFiltroStatus(filtroStatus === "recebidas" ? "todos" : "recebidas")}
                className="rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md text-center"
                style={{
                  backgroundColor: "#F5E8F5",
                  padding: "1.5rem",
                  border: filtroStatus === "recebidas" ? "2px solid #890d5d" : "2px solid transparent"
                }}
              >
                <p className="text-5xl font-bold mb-2" style={{ color: "#890d5d" }}>{recebidas}</p>
                <p className="text-sm font-medium" style={{ color: "#890d5d" }}>Recebidas</p>
              </div>
            </div>

            {/* Lista de Receitas */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {queryError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 font-semibold mb-2">Erro ao carregar receitas</p>
                  <p className="text-slate-500 text-sm mb-4">{queryError.message}</p>
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-4 rounded-full animate-spin mb-4"
                    style={{ borderTopColor: '#376295' }}
                  />
                  <p className="text-slate-600">Carregando receitas...</p>
                </div>
              ) : receitasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhuma receita encontrada
                  </h3>
                  <p className="text-sm text-slate-600">
                    {searchTerm || filtroStatus !== "todos"
                      ? 'Tente ajustar os filtros de busca'
                      : 'Não há receitas cadastradas'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receitasFiltradas.map((receita) => (
                    <div
                      key={receita.id}
                      onClick={() => navigate(`/detalhes-romaneio?id=${receita.id}`)}
                      className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-base font-semibold" style={{ color: '#376295' }}>
                              #{receita.requisicao}
                            </span>
                            <span
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: receita.receita_recebida ? "#F5E8F5" : "#E8F0F8",
                                color: receita.receita_recebida ? "#890d5d" : "#376295"
                              }}
                            >
                              {receita.receita_recebida ? "Recebida" : "Pendente"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                            <div>
                              <span className="font-medium">Cliente:</span> {receita.cliente?.nome || receita.cliente_nome}
                            </div>
                            <div>
                              <span className="font-medium">Telefone:</span> {receita.cliente?.telefone || receita.cliente_telefone}
                            </div>
                            {receita.cliente?.cpf && (
                              <div>
                                <span className="font-medium">CPF:</span> {receita.cliente.cpf}
                              </div>
                            )}
                            {receita.data_entrega && (
                              <div>
                                <span className="font-medium">Data:</span>{' '}
                                {format(parseISO(receita.data_entrega), "dd/MM/yyyy")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {receita.receita_anexo ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(receita.receita_anexo, '_blank');
                              }}
                              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Receita
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalUpload(receita);
                              }}
                              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-white"
                              style={{ backgroundColor: '#376295' }}
                            >
                              <Upload className="w-4 h-4" />
                              Anexar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Upload */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Anexo</DialogTitle>
            <DialogDescription>
              Envie fotos ou documentos relacionados a esta entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de Anexo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Anexo *</label>
              <Select value={tipoAnexo} onValueChange={setTipoAnexo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Pagamento">Pagamento</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload de Arquivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {arquivoSelecionado && (
                <p className="text-xs text-slate-500">
                  Arquivo selecionado: {arquivoSelecionado.name}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Adicione informações adicionais sobre este anexo..."
                value={descricaoAnexo}
                onChange={(e) => setDescricaoAnexo(e.target.value)}
                rows={3}
              />
            </div>

            {/* Informações da Entrega */}
            {receitaSelecionada && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p className="font-medium text-slate-900">
                  Entrega: #{receitaSelecionada.requisicao}
                </p>
                <p className="text-slate-600">
                  Cliente: {receitaSelecionada.cliente?.nome || receitaSelecionada.cliente_nome}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setTipoAnexo("");
                setDescricaoAnexo("");
                setArquivoSelecionado(null);
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadAnexo}
              disabled={uploading || !arquivoSelecionado || !tipoAnexo}
              style={{ background: uploading ? '#94a3b8' : '#376295' }}
              className="text-white"
            >
              {uploading ? 'Enviando...' : 'Enviar Anexo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
