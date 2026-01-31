import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDropdown } from '@/components/CustomDropdown';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  FileSpreadsheet,
  Plus,
  Search,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  ClipboardList,
  Send,
  Truck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';

export default function SedexDisktenha() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visualizacao, setVisualizacao] = useState('dia'); // 'dia' ou 'todas'
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [showNovaEntrega, setShowNovaEntrega] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'SEDEX', 'PAC', 'DISKTENHA'
  const [novaEntrega, setNovaEntrega] = useState({
    tipo: 'SEDEX',
    cliente: '',
    remetente: '',
    numero_requisicao: '',
    codigo_rastreio: '',
    valor: '',
    forma_pagamento: 'Aguardando',
    observacoes: '',
    data_saida: format(new Date(), 'yyyy-MM-dd'),
  });

  // Função para gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        isSelected: i === dataSelecionada.getDate() &&
                   month === dataSelecionada.getMonth() &&
                   year === dataSelecionada.getFullYear(),
        date: dayDate
      });
    }

    return days;
  };

  // Buscar entregas Sedex/Disktenha
  const { data: entregas = [], isLoading, refetch } = useQuery({
    queryKey: ['sedex-disktenha', visualizacao, dataSelecionada],
    queryFn: async () => {
      let query = supabase
        .from('sedex_disktenha')
        .select('*')
        .order('data_saida', { ascending: false });

      // Filtrar por data se visualização for 'dia'
      if (visualizacao === 'dia') {
        const dataStr = format(dataSelecionada, 'yyyy-MM-dd');
        query = query.eq('data_saida', dataStr);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calcular estatísticas por tipo
  const total = entregas.length;
  const sedex = entregas.filter(e => e.tipo === 'SEDEX').length;
  const pac = entregas.filter(e => e.tipo === 'PAC').length;
  const diskenha = entregas.filter(e => e.tipo === 'DISKTENHA').length;
  const valorTotalDisktenha = entregas
    .filter(e => e.tipo === 'DISKTENHA')
    .reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0);

  // Filtrar entregas pela busca e tipo
  const entregasFiltradas = entregas.filter(e => {
    const matchBusca = e.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      e.codigo_rastreio?.toLowerCase().includes(busca.toLowerCase()) ||
      e.remetente?.toLowerCase().includes(busca.toLowerCase()) ||
      e.numero_requisicao?.toLowerCase().includes(busca.toLowerCase());

    const matchTipo = filtroTipo === 'todos' || e.tipo === filtroTipo;

    return matchBusca && matchTipo;
  });

  const handleCriarEntrega = async () => {
    if (!novaEntrega.cliente || !novaEntrega.numero_requisicao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (novaEntrega.tipo === 'DISKTENHA' && (!novaEntrega.valor || parseFloat(novaEntrega.valor) <= 0)) {
      toast.error('Informe o valor da entrega para Disktenha');
      return;
    }

    try {
      const { error } = await supabase
        .from('sedex_disktenha')
        .insert([{
          ...novaEntrega,
          codigo_rastreio: novaEntrega.codigo_rastreio || `PENDING-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          valor: parseFloat(novaEntrega.valor) || 0,
          status: 'Pendente',
          atendente: user?.usuario || '',
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success('Entrega criada com sucesso!');
      setShowNovaEntrega(false);
      setNovaEntrega({
        tipo: 'SEDEX',
        cliente: '',
        remetente: '',
        numero_requisicao: '',
        codigo_rastreio: '',
        valor: '',
        forma_pagamento: 'Aguardando',
        observacoes: '',
        data_saida: format(new Date(), 'yyyy-MM-dd'),
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      toast.error('Erro ao criar entrega');
    }
  };

  const handleExportarExcel = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header com gradiente */}
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
              <h1 className="text-4xl font-bold text-white">Sedex / Disktenha</h1>
              <p className="text-base text-white opacity-90 mt-1">Gerencie entregas via Sedex, PAC e Disktenha</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Esquerda - Calendário */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            {/* Botão Nova Entrega */}
            <Button
              onClick={() => setShowNovaEntrega(true)}
              className="w-full mb-4 py-6 text-base font-bold uppercase"
              style={{ background: '#890d5d' }}
            >
              <Plus className="w-5 h-5 mr-2 font-bold" strokeWidth={4} />
              NOVA ENTREGA
            </Button>

            {/* Botões Por Dia / Todos */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setVisualizacao('dia')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: visualizacao === 'dia' ? '#376295' : 'white',
                  color: visualizacao === 'dia' ? 'white' : '#64748b',
                  border: visualizacao === 'dia' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <CalendarIcon className="w-4 h-4" />
                Por Dia
              </button>

              <button
                onClick={() => {
                  setVisualizacao('todas');
                  setFiltroTipo('todos');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: visualizacao === 'todas' ? '#376295' : 'white',
                  color: visualizacao === 'todas' ? 'white' : '#64748b',
                  border: visualizacao === 'todas' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <ClipboardList className="w-4 h-4" />
                Todos
              </button>
            </div>

            {/* Calendário com borda */}
            <div className="border rounded-xl p-3 mb-4">
              {/* Navegação do Calendário */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>

                <span className="text-sm font-semibold text-slate-700">
                  {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </span>

                <button
                  onClick={() => {
                    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-1">
                {/* Dias da Semana */}
                {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((dia) => (
                  <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-2">
                    {dia}
                  </div>
                ))}

                {/* Dias do Mês */}
                {getDaysInMonth(currentMonthDate).map((dayInfo, index) => {
                  if (!dayInfo.isCurrentMonth) {
                    return <div key={index} className="aspect-square" />;
                  }

                  const isSelected = dayInfo.isSelected;
                  const isToday = dayInfo.date?.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setDataSelecionada(dayInfo.date);
                        setVisualizacao('dia');
                      }}
                      className="aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center hover:bg-blue-50"
                      style={{
                        backgroundColor: isSelected ? '#376295' : 'transparent',
                        color: isSelected ? 'white' : isToday ? '#376295' : '#1e293b',
                        fontWeight: isToday || isSelected ? 'bold' : 'normal'
                      }}
                    >
                      {dayInfo.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data Selecionada */}
            <div className="text-center pt-4 border-t border-slate-200">
              <div className="text-base font-semibold text-slate-700">
                {dataSelecionada.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </div>
              <div className="text-sm text-slate-500">
                {total} entregas
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {/* Total */}
              <Card
                className="cursor-pointer transition-all hover:shadow-md bg-white rounded-xl shadow-sm"
                style={{
                  border: filtroTipo === 'todos' ? '2px solid #376295' : '2px solid transparent'
                }}
                onClick={() => setFiltroTipo('todos')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                      <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Total</span>
                  </div>
                  <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
                    {total}
                  </div>
                </CardContent>
              </Card>

              {/* Sedex */}
              <Card
                className="cursor-pointer transition-all hover:shadow-md bg-white rounded-xl shadow-sm"
                style={{
                  border: filtroTipo === 'SEDEX' ? '2px solid #890d5d' : '2px solid transparent'
                }}
                onClick={() => setFiltroTipo(filtroTipo === 'SEDEX' ? 'todos' : 'SEDEX')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                      <Send className="w-6 h-6" style={{ color: '#890d5d' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Sedex</span>
                  </div>
                  <div className="text-4xl font-bold text-center" style={{ color: '#890d5d' }}>
                    {sedex}
                  </div>
                </CardContent>
              </Card>

              {/* PAC */}
              <Card
                className="cursor-pointer transition-all hover:shadow-md bg-white rounded-xl shadow-sm"
                style={{
                  border: filtroTipo === 'PAC' ? '2px solid #f97316' : '2px solid transparent'
                }}
                onClick={() => setFiltroTipo(filtroTipo === 'PAC' ? 'todos' : 'PAC')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                      <Package className="w-6 h-6" style={{ color: '#f97316' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">PAC</span>
                  </div>
                  <div className="text-4xl font-bold text-center" style={{ color: '#f97316' }}>
                    {pac}
                  </div>
                </CardContent>
              </Card>

              {/* Disktenha */}
              <Card
                className="cursor-pointer transition-all hover:shadow-md bg-white rounded-xl shadow-sm"
                style={{
                  border: filtroTipo === 'DISKTENHA' ? '2px solid #3dac38' : '2px solid transparent'
                }}
                onClick={() => setFiltroTipo(filtroTipo === 'DISKTENHA' ? 'todos' : 'DISKTENHA')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                      <Truck className="w-6 h-6" style={{ color: '#3dac38' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Disktenha</span>
                  </div>
                  <div className="text-4xl font-bold text-center" style={{ color: '#3dac38' }}>
                    {diskenha}
                  </div>
                </CardContent>
              </Card>

              {/* Total Disktenha */}
              <Card className="cursor-pointer transition-all hover:shadow-md rounded-xl shadow-sm" style={{ backgroundColor: '#E8F5E8', border: '3px solid #3dac38' }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#d1f0d1' }}>
                      <DollarSign className="w-6 h-6" style={{ color: '#3dac38' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Total Disktenha</span>
                  </div>
                  <div className="text-3xl font-bold text-center" style={{ color: '#3dac38' }}>
                    R$ {valorTotalDisktenha.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Busca e Filtro */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, código, remetente..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Entregas */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {visualizacao === 'dia'
                    ? `Entregas de ${format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}`
                    : 'Todas as Entregas'
                  }
                </h3>

                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Carregando...</div>
                ) : entregasFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhuma entrega encontrada</p>
                  </div>
                ) : (
                  <div>
                    {entregasFiltradas.map((entrega) => (
                      <div
                        key={entrega.id}
                        onClick={() => navigate(`/sedex-detalhes?id=${entrega.id}`)}
                        className="p-5 mb-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer hover:shadow-md last:mb-0"
                      >
                        <div className="flex items-center justify-between gap-6">
                          {/* Lado Esquerdo - Informações */}
                          <div className="flex-1">
                            {/* Linha 1: Requisição + Atendente + Tipo + Status */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-base font-semibold" style={{ color: '#376295' }}>
                                #{entrega.numero_requisicao || '-'}
                              </span>
                              {entrega.atendente && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {entrega.atendente}
                                  </span>
                                </>
                              )}
                              <span className="text-slate-400">•</span>
                              <span
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    entrega.tipo === 'SEDEX' ? '#F5E8F5' :
                                    entrega.tipo === 'PAC' ? '#FEF3E8' : '#E8F5E8',
                                  color:
                                    entrega.tipo === 'SEDEX' ? '#890d5d' :
                                    entrega.tipo === 'PAC' ? '#f97316' : '#3dac38'
                                }}
                              >
                                {entrega.tipo}
                              </span>
                              <span
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    entrega.status === 'Entregue' ? '#E8F5E8' :
                                    entrega.status === 'Saiu' ? '#FEF3E8' : '#F5E8F5',
                                  color:
                                    entrega.status === 'Entregue' ? '#3dac38' :
                                    entrega.status === 'Saiu' ? '#f97316' : '#890d5d'
                                }}
                              >
                                {entrega.status}
                              </span>
                            </div>

                            {/* Linha 2: Nome do Cliente */}
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                              {entrega.cliente}
                            </h3>

                            {/* Linha 3: Informações adicionais */}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                              {entrega.codigo_rastreio && !entrega.codigo_rastreio.startsWith('PENDING-') && (
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-4 h-4" style={{ color: '#1e293b' }} />
                                  <span>{entrega.codigo_rastreio}</span>
                                </div>
                              )}
                              {entrega.remetente && (
                                <div className="flex items-center gap-1.5">
                                  <Send className="w-4 h-4" style={{ color: '#1e293b' }} />
                                  <span>{entrega.remetente}</span>
                                </div>
                              )}
                            </div>

                            {/* Observações */}
                            {entrega.observacoes && (
                              <p className="text-sm text-slate-500 mt-2">{entrega.observacoes}</p>
                            )}
                          </div>

                          {/* Lado Direito - Valor e Data */}
                          <div className="text-right">
                            {entrega.tipo === 'DISKTENHA' && (
                              <div className="mb-2">
                                <p className="text-xs text-slate-500">{entrega.forma_pagamento}</p>
                                <p className="text-xl font-bold" style={{ color: '#3dac38' }}>
                                  R$ {parseFloat(entrega.valor || 0).toFixed(2)}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-slate-500">
                              {format(parseISO(entrega.data_saida), 'dd/MM/yyyy')}
                            </p>
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

      {/* Dialog Nova Entrega */}
      <Dialog open={showNovaEntrega} onOpenChange={setShowNovaEntrega}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <CustomDatePicker
                  label="Data e Horário *"
                  value={novaEntrega.data_saida}
                  onChange={(value) => setNovaEntrega({ ...novaEntrega, data_saida: value })}
                  placeholder="Selecione a data"
                />
              </div>
              <CustomDropdown
                label="Tipo de Entrega *"
                options={[
                  { value: 'SEDEX', label: 'SEDEX' },
                  { value: 'PAC', label: 'PAC' },
                  { value: 'DISKTENHA', label: 'DISKTENHA' }
                ]}
                value={novaEntrega.tipo}
                onChange={(value) => setNovaEntrega({ ...novaEntrega, tipo: value })}
                placeholder="Selecione o tipo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={novaEntrega.cliente}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, cliente: e.target.value })}
                />
              </div>
              <div>
                <Label>Destinatário</Label>
                <Input
                  placeholder="Nome do destinatário"
                  value={novaEntrega.remetente}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, remetente: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número da Requisição *</Label>
                <Input
                  placeholder="Ex: 123456"
                  value={novaEntrega.numero_requisicao}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, numero_requisicao: e.target.value })}
                />
              </div>
              <div>
                <Label>Código de Rastreio</Label>
                <Input
                  placeholder="Ex: BR123456789BR"
                  value={novaEntrega.codigo_rastreio}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, codigo_rastreio: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais sobre a entrega"
                value={novaEntrega.observacoes}
                onChange={(e) => setNovaEntrega({ ...novaEntrega, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className={novaEntrega.tipo === 'DISKTENHA' ? "grid grid-cols-2 gap-4" : ""}>
              {novaEntrega.tipo === 'DISKTENHA' && (
                <div>
                  <Label>Valor da Entrega</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novaEntrega.valor}
                    onChange={(e) => setNovaEntrega({ ...novaEntrega, valor: e.target.value })}
                  />
                </div>
              )}
              <CustomDropdown
                label="Status do Pagamento"
                options={[
                  { value: 'Aguardando', label: 'Aguardando' },
                  { value: 'Pago', label: 'Pago' }
                ]}
                value={novaEntrega.forma_pagamento}
                onChange={(value) => setNovaEntrega({ ...novaEntrega, forma_pagamento: value })}
                placeholder="Selecione..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNovaEntrega(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriarEntrega}
              style={{ background: 'linear-gradient(to right, #457bba, #890d5d)' }}
              className="text-white"
            >
              Cadastrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
