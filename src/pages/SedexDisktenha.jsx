import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';

export default function SedexDisktenha() {
  const navigate = useNavigate();
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
    codigo_rastreio: '',
    valor: '',
    forma_pagamento: 'Pago',
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
      e.remetente?.toLowerCase().includes(busca.toLowerCase());

    const matchTipo = filtroTipo === 'todos' || e.tipo === filtroTipo;

    return matchBusca && matchTipo;
  });

  const handleCriarEntrega = async () => {
    if (!novaEntrega.cliente || !novaEntrega.codigo_rastreio) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('sedex_disktenha')
        .insert([{
          ...novaEntrega,
          valor: parseFloat(novaEntrega.valor) || 0,
          status: 'Pendente',
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success('Entrega criada com sucesso!');
      setShowNovaEntrega(false);
      setNovaEntrega({
        tipo: 'SEDEX',
        cliente: '',
        remetente: '',
        codigo_rastreio: '',
        valor: '',
        forma_pagamento: 'Pago',
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
          <h1 className="text-4xl font-bold text-white">Sedex / Disktenha</h1>
          <p className="text-base text-white opacity-90 mt-1">Gerencie entregas via Sedex, PAC e Disktenha</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Esquerda - Calendário */}
        <div className="w-80 flex-shrink-0">
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

            {/* Navegação do Calendário */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(currentMonthDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonthDate(newDate);
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
                  const newDate = new Date(currentMonthDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonthDate(newDate);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-1 mb-4">
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
          <div className="grid grid-cols-5 gap-4 mb-6">
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
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
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
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
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
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
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
                  border: filtroTipo === 'DISKTENHA' ? '2px solid #22c55e' : '2px solid transparent'
                }}
                onClick={() => setFiltroTipo(filtroTipo === 'DISKTENHA' ? 'todos' : 'DISKTENHA')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                      <Truck className="w-6 h-6" style={{ color: '#22c55e' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Disktenha</span>
                  </div>
                  <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>
                    {diskenha}
                  </div>
                </CardContent>
              </Card>

              {/* Total Disktenha */}
              <Card className="cursor-pointer transition-all hover:shadow-md rounded-xl shadow-sm" style={{ backgroundColor: '#E8F5E8', border: '3px solid #22c55e' }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#d1f0d1' }}>
                      <DollarSign className="w-6 h-6" style={{ color: '#22c55e' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Total Disktenha</span>
                  </div>
                  <div className="text-3xl font-bold text-center" style={{ color: '#22c55e' }}>
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
                  <div className="space-y-3">
                    {entregasFiltradas.map((entrega) => (
                      <button
                        key={entrega.id}
                        onClick={() => navigate(`/sedex-detalhes?id=${entrega.id}`)}
                        className="w-full p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 text-xs font-medium rounded" style={{
                                background: entrega.tipo === 'SEDEX' ? '#e0f2fe' : '#fef3c7',
                                color: entrega.tipo === 'SEDEX' ? '#0369a1' : '#92400e'
                              }}>
                                {entrega.tipo}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium rounded" style={{
                                background: entrega.status === 'Entregue' ? '#dcfce7' :
                                           entrega.status === 'Saiu' ? '#fef3c7' : '#f1f5f9',
                                color: entrega.status === 'Entregue' ? '#166534' :
                                       entrega.status === 'Saiu' ? '#92400e' : '#475569'
                              }}>
                                {entrega.status}
                              </span>
                            </div>
                            <p className="font-medium text-slate-900">{entrega.cliente}</p>
                            <p className="text-sm text-slate-600">Código: {entrega.codigo_rastreio}</p>
                            {entrega.remetente && (
                              <p className="text-sm text-slate-500">Remetente: {entrega.remetente}</p>
                            )}
                            {entrega.observacoes && (
                              <p className="text-sm text-slate-500 mt-1">{entrega.observacoes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              R$ {parseFloat(entrega.valor).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">{entrega.forma_pagamento}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {format(parseISO(entrega.data_saida), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      </button>
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
                <Label>Data e Horário *</Label>
                <Input
                  type="date"
                  value={novaEntrega.data_saida}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, data_saida: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de Entrega *</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={novaEntrega.tipo}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, tipo: e.target.value })}
                >
                  <option value="SEDEX">SEDEX</option>
                  <option value="PAC">PAC</option>
                  <option value="DISKTENHA">DISKTENHA</option>
                </select>
              </div>
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
                <Label>Remetente</Label>
                <Input
                  placeholder="Nome do remetente"
                  value={novaEntrega.remetente}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, remetente: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Código de Rastreio *</Label>
              <Input
                placeholder="Ex: BR123456789BR"
                value={novaEntrega.codigo_rastreio}
                onChange={(e) => setNovaEntrega({ ...novaEntrega, codigo_rastreio: e.target.value })}
              />
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Forma de Pagamento</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={novaEntrega.forma_pagamento}
                  onChange={(e) => setNovaEntrega({ ...novaEntrega, forma_pagamento: e.target.value })}
                >
                  <option value="Pago">Pago</option>
                  <option value="A Pagar">A Pagar</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                </select>
              </div>
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
