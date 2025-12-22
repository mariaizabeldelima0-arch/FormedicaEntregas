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
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';

export default function SedexDisktenha() {
  const navigate = useNavigate();
  const [visualizacao, setVisualizacao] = useState('dia'); // 'dia' ou 'todas'
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
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
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sedex / Disktenha</h1>
            <p className="text-slate-600 mt-1">Gerenciamento de entregas via correios</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setVisualizacao(visualizacao === 'dia' ? 'todas' : 'dia')}
            >
              {visualizacao === 'dia' ? 'Mostrar todas' : 'Mostrar dia'}
            </Button>
            <Button
              onClick={() => setShowNovaEntrega(true)}
              style={{ background: '#457bba' }}
              className="text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Entrega
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com Calendário */}
          <div className="lg:col-span-1 space-y-4">
            {/* Toggle Dia/Todas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Button
                    variant={visualizacao === 'dia' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setVisualizacao('dia')}
                    style={visualizacao === 'dia' ? { background: '#457bba' } : {}}
                  >
                    Dia
                  </Button>
                  <Button
                    variant={visualizacao === 'todas' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setVisualizacao('todas')}
                    style={visualizacao === 'todas' ? { background: '#457bba' } : {}}
                  >
                    Todas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calendário */}
            {visualizacao === 'dia' && (
              <Card>
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={(date) => date && setDataSelecionada(date)}
                    locale={ptBR}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cards de Estatísticas - Clicáveis */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Total - com borda */}
              <Card
                className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                  filtroTipo === 'todos' ? 'border-blue-500 shadow-md' : 'border-slate-200'
                }`}
                onClick={() => setFiltroTipo('todos')}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Total</p>
                  <p className="text-4xl font-bold text-slate-900">{total}</p>
                </CardContent>
              </Card>

              {/* Sedex - texto vermelho */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  filtroTipo === 'SEDEX' ? 'border-2 border-red-500 shadow-md' : ''
                }`}
                onClick={() => setFiltroTipo('SEDEX')}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Sedex</p>
                  <p className="text-4xl font-bold text-red-600">{sedex}</p>
                </CardContent>
              </Card>

              {/* PAC - texto azul */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  filtroTipo === 'PAC' ? 'border-2 border-blue-500 shadow-md' : ''
                }`}
                onClick={() => setFiltroTipo('PAC')}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">PAC</p>
                  <p className="text-4xl font-bold text-blue-600">{pac}</p>
                </CardContent>
              </Card>

              {/* Diskenha - texto roxo */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  filtroTipo === 'DISKTENHA' ? 'border-2 border-purple-500 shadow-md' : ''
                }`}
                onClick={() => setFiltroTipo('DISKTENHA')}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Diskenha</p>
                  <p className="text-4xl font-bold text-purple-600">{diskenha}</p>
                </CardContent>
              </Card>

              {/* Total Disktenha - fundo verde */}
              <Card className="bg-green-100">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-green-800 mb-2">Total Disktenha</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {valorTotalDisktenha.toFixed(2)}
                  </p>
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
