import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Receitas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TODOS os useState juntos (regra dos hooks)
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [verTodas, setVerTodas] = useState(true);
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

    // Filtro de status (pendente = sem anexo, recebida = com anexo)
    if (filtroStatus === "pendentes" && e.receita_anexo) return false;
    if (filtroStatus === "recebidas" && !e.receita_anexo) return false;

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

  // Contar por status
  const pendentes = entregas.filter(e => !e.receita_anexo).length;
  const recebidas = entregas.filter(e => e.receita_anexo).length;

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
    setVerTodas(false);
  };

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Receitas</h1>
          <p className="text-slate-600 mt-1">Gerenciamento de receitas retidas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filtros */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-lg" key={`filter-${verTodas}-${dataSelecionada?.getTime() || 'all'}`}>
              <CardHeader>
                <CardTitle className="text-lg">Filtrar por dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checkbox Ver Todas */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ver-todas"
                    checked={verTodas}
                    onCheckedChange={(checked) => {
                      setVerTodas(checked);
                      if (checked) setDataSelecionada(null);
                    }}
                  />
                  <label
                    htmlFor="ver-todas"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Ver todas as receitas
                  </label>
                </div>

                {/* Calendário */}
                <div className="border rounded-lg p-3" key={format(mesAtual, 'yyyy-MM')}>
                  {/* Header do Calendário */}
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={mesAnterior}
                      className="h-7 w-7"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-semibold">
                      {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={proximoMes}
                      className="h-7 w-7"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((dia) => (
                      <div key={dia} className="text-center text-xs font-medium text-slate-600">
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
                          disabled={verTodas}
                          className={`
                            aspect-square rounded-md text-sm flex flex-col items-center justify-center relative
                            transition-all
                            ${estaSelecionado ? 'bg-[#457bba] text-white font-bold shadow-md' : ''}
                            ${!estaSelecionado && ehHoje ? 'bg-slate-200 font-semibold ring-2 ring-slate-400' : ''}
                            ${!estaSelecionado && !ehHoje && temReceitas ? 'bg-orange-50 font-semibold text-orange-900 hover:bg-orange-100 ring-2 ring-orange-200' : ''}
                            ${!estaSelecionado && !ehHoje && !temReceitas ? 'hover:bg-slate-100 text-slate-600' : ''}
                            ${verTodas ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <span>{format(dia, 'd')}</span>
                          {temReceitas && !estaSelecionado && (
                            <span className="text-[10px] font-bold text-orange-600">
                              {qtdReceitas}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info da data selecionada */}
                <div className="text-center text-sm">
                  {dataSelecionada && !verTodas && (
                    <p className="font-medium">{format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}</p>
                  )}
                  <p className="text-slate-500">
                    {receitasFiltradas.length} receita{receitasFiltradas.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Busca */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, nome, telefone ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cards de Status - Clicáveis */}
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer hover:shadow-xl transition-all ${
                  filtroStatus === "pendentes" ? "ring-2 ring-red-500" : ""
                }`}
                onClick={() => setFiltroStatus(filtroStatus === "pendentes" ? "todos" : "pendentes")}
              >
                <CardContent className="p-6 text-center bg-red-50">
                  <p className="text-5xl font-bold text-red-600 mb-2">{pendentes}</p>
                  <p className="text-sm text-red-700 font-medium">Pendentes</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer hover:shadow-xl transition-all ${
                  filtroStatus === "recebidas" ? "ring-2 ring-green-500" : ""
                }`}
                onClick={() => setFiltroStatus(filtroStatus === "recebidas" ? "todos" : "recebidas")}
              >
                <CardContent className="p-6 text-center bg-green-50">
                  <p className="text-5xl font-bold text-green-600 mb-2">{recebidas}</p>
                  <p className="text-sm text-green-700 font-medium">Recebidas</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Receitas */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
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
                  <div className="text-center py-12 text-slate-500">
                    Carregando receitas...
                  </div>
                ) : receitasFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhuma receita</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receitasFiltradas.map((receita) => (
                      <div
                        key={receita.id}
                        onClick={() => navigate(`/detalhes-romaneio?id=${receita.id}`)}
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Link
                                to={`/detalhes-romaneio?id=${receita.id}`}
                                className="text-base font-semibold text-slate-900 hover:text-[#457bba]"
                              >
                                # {receita.requisicao}
                              </Link>
                              <Badge className={receita.receita_anexo ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                {receita.receita_anexo ? "Recebida" : "Pendente"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(receita.receita_anexo, '_blank');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Receita
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalUpload(receita);
                                }}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Anexar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                className="cursor-pointer"
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
              style={{ background: uploading ? '#94a3b8' : '#457bba' }}
            >
              {uploading ? 'Enviando...' : 'Enviar Anexo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
