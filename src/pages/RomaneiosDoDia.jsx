import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { CustomDropdown } from '@/components/CustomDropdown';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import {
  ChevronLeft,
  Printer,
  Search,
  Calendar,
  Filter,
  X,
  FileText
} from 'lucide-react';

// Componente de impressão individual do romaneio (versão para tela)
function RomaneioCard({ romaneio }) {
  if (!romaneio) return null;

  const formatarData = (data) => {
    if (!data) return '-';
    const d = new Date(data + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const isPago = romaneio.forma_pagamento && ['Pago', 'Só Entregar'].includes(romaneio.forma_pagamento);

  return (
    <div className="romaneio-card" style={{ position: 'relative' }}>
      {/* Carimbo PAGO */}
      {isPago && (
        <div className="carimbo-pago" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          fontSize: '50px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: '#000',
          border: '5px solid #000',
          padding: '5px 25px',
          opacity: 0.2,
          pointerEvents: 'none',
          zIndex: 10,
          letterSpacing: '5px'
        }}>
          PAGO
        </div>
      )}

      {/* Logo e Titulo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
        <img src="/logo-formedica.png" alt="Formédica" style={{ width: '100px', height: 'auto', marginBottom: '5px' }} />
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>ROMANEIO DE ENTREGA</h2>
      </div>

      {/* Info Principal e Cliente */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, border: '1px solid #000', padding: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>DADOS DA ENTREGA</div>
          <div style={{ fontSize: '9px', marginBottom: '3px' }}>
            <span>N. Requisição: </span>
            <span style={{ fontWeight: 'bold' }}>#{romaneio.requisicao || '0000'}</span>
          </div>
          <div style={{ fontSize: '9px', marginBottom: '3px' }}>
            <span>Data: </span>
            <span>{formatarData(romaneio.data_entrega)} - {romaneio.periodo || '-'}</span>
          </div>
          <div style={{ fontSize: '9px', marginBottom: '3px' }}>
            <span>Motoboy: </span>
            <span>{romaneio.motoboy?.nome || '-'}</span>
          </div>
          <div style={{ fontSize: '9px' }}>
            <span>Atendente: </span>
            <span>{romaneio.atendente?.nome || romaneio.atendente?.email || '-'}</span>
          </div>
        </div>

        <div style={{ flex: 1, border: '1px solid #000', padding: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>CLIENTE</div>
          <div style={{ fontSize: '9px', marginBottom: '3px' }}>
            <span>Nome: </span>
            <span>{romaneio.cliente?.nome || '-'}</span>
          </div>
          <div style={{ fontSize: '9px' }}>
            <span>Telefone: </span>
            <span>{romaneio.cliente?.telefone || '-'}</span>
          </div>
        </div>
      </div>

      {/* Endereco e Pagamento */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, border: '1px solid #000', padding: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>ENDERECO DE ENTREGA</div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
            {romaneio.endereco?.logradouro || '-'}, {romaneio.endereco?.numero || 'S/N'}
          </div>
          <div style={{ fontSize: '9px', marginBottom: '2px' }}>
            {romaneio.endereco?.bairro || '-'} - {romaneio.endereco?.cidade || romaneio.regiao || '-'}
          </div>
          {romaneio.endereco?.complemento && (
            <div style={{ fontSize: '9px' }}>Compl.: {romaneio.endereco.complemento}</div>
          )}
        </div>

        <div style={{ flex: 1, border: '1px solid #000', padding: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>PAGAMENTO</div>
          <div style={{ fontSize: '9px' }}>
            <span>Forma de Pagamento: </span>
            <span>{romaneio.forma_pagamento || '-'}</span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {romaneio.observacoes && (
        <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>OBSERVAÇÕES</div>
          <div style={{ fontSize: '9px' }}>{romaneio.observacoes}</div>
        </div>
      )}

      {/* Item Geladeira e Reter Receita */}
      {(romaneio.item_geladeira || romaneio.buscar_receita) && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {romaneio.item_geladeira && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: '2px solid #000',
              background: '#fff'
            }}>
              <span>❄</span>
              <span>ITEM DE GELADEIRA</span>
              <span>❄</span>
            </div>
          )}
          {romaneio.buscar_receita && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: '2px solid #000',
              background: '#fff'
            }}>
              <FileText size={14} />
              <span>RETER RECEITA</span>
              <FileText size={14} />
            </div>
          )}
        </div>
      )}

      {/* Valor a Cobrar e Troco */}
      {((romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento)) || (romaneio.precisa_troco && romaneio.valor_troco > 0)) && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento) && (
            <div style={{
              flex: 1,
              background: '#fff',
              border: '2px solid #000',
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              $ COBRAR NA ENTREGA: R$ {romaneio.valor_venda.toFixed(2).replace('.', ',')}
            </div>
          )}
          {romaneio.precisa_troco && romaneio.valor_troco > 0 && (
            <div style={{
              flex: 1,
              background: '#fff',
              border: '2px solid #000',
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              TROCO: R$ {romaneio.valor_troco.toFixed(2).replace('.', ',')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RomaneiosDoDia() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataParam = searchParams.get('data');

  const [selectedDate, setSelectedDate] = useState(dataParam || new Date().toISOString().split('T')[0]);
  const [romaneios, setRomaneios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busca: '',
    motoboy: '',
    periodo: '',
    status: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);

  // Carregar romaneios do dia
  const loadRomaneios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .eq('tipo', 'moto')
        .eq('data_entrega', selectedDate)
        .order('periodo', { ascending: true });

      if (error) throw error;

      // Processar dados
      const romaneiosProcessados = await Promise.all(
        (data || []).map(async (entrega) => {
          // Priorizar snapshot de endereço
          const enderecoDisplay = entrega.endereco_logradouro
            ? {
                id: entrega.endereco_id,
                logradouro: entrega.endereco_logradouro,
                numero: entrega.endereco_numero,
                complemento: entrega.endereco_complemento,
                bairro: entrega.endereco_bairro,
                cidade: entrega.endereco_cidade
              }
            : entrega.endereco;

          // Buscar atendente
          let atendente = null;
          if (entrega.atendente_id) {
            const { data: atendenteData } = await supabase
              .from('usuarios')
              .select('id, nome, email')
              .eq('id', entrega.atendente_id)
              .single();
            atendente = atendenteData;
          }

          return {
            ...entrega,
            endereco: enderecoDisplay,
            atendente
          };
        })
      );

      setRomaneios(romaneiosProcessados);
    } catch (error) {
      console.error('Erro ao carregar romaneios:', error);
      toast.error('Erro ao carregar romaneios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRomaneios();
  }, [selectedDate]);

  // Filtrar romaneios
  const romaneiosFiltrados = romaneios.filter(romaneio => {
    // Busca geral
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchCliente = romaneio.cliente?.nome?.toLowerCase().includes(busca);
      const matchRequisicao = romaneio.requisicao?.toLowerCase().includes(busca);
      const matchEndereco = romaneio.endereco?.logradouro?.toLowerCase().includes(busca) ||
                           romaneio.endereco?.bairro?.toLowerCase().includes(busca);
      const matchMotoboy = romaneio.motoboy?.nome?.toLowerCase().includes(busca);

      if (!matchCliente && !matchRequisicao && !matchEndereco && !matchMotoboy) {
        return false;
      }
    }

    // Filtro motoboy
    if (filtros.motoboy && romaneio.motoboy?.nome !== filtros.motoboy) {
      return false;
    }

    // Filtro período
    if (filtros.periodo && romaneio.periodo !== filtros.periodo) {
      return false;
    }

    // Filtro status
    if (filtros.status && romaneio.status !== filtros.status) {
      return false;
    }

    return true;
  });

  // Obter lista única de motoboys
  const motoboys = [...new Set(romaneios.map(r => r.motoboy?.nome).filter(Boolean))];

  // Imprimir todos
  const handlePrintAll = () => {
    window.print();
  };

  // Formatar data para exibição
  const formatarDataExibicao = (data) => {
    const d = new Date(data + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <>
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
          }
          .romaneio-card {
            page-break-inside: avoid;
            border: 1px solid #000 !important;
            margin-bottom: 10px !important;
            padding: 10px !important;
          }
          .romaneios-grid {
            display: block !important;
          }
          .romaneios-grid > div {
            break-inside: avoid;
          }
        }

        @media screen {
          .romaneio-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="no-print py-8 shadow-sm" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Romaneios do Dia</h1>
                  <p className="text-white/80 text-sm mt-1">{formatarDataExibicao(selectedDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintAll}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                  style={{ color: '#890d5d' }}
                >
                  <Printer size={18} />
                  Imprimir Todos ({romaneiosFiltrados.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="no-print max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Seletor de Data */}
              <div className="flex items-center gap-2">
                <CustomDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Selecione a data"
                />
              </div>

              {/* Busca */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  placeholder="Buscar por cliente, requisição, endereço, motoboy..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Botão Filtros */}
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <Filter size={18} />
                Filtros
                {(filtros.motoboy || filtros.periodo || filtros.status) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>

              {/* Limpar Filtros */}
              {(filtros.busca || filtros.motoboy || filtros.periodo || filtros.status) && (
                <button
                  onClick={() => setFiltros({ busca: '', motoboy: '', periodo: '', status: '' })}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <X size={16} />
                  Limpar
                </button>
              )}
            </div>

            {/* Filtros Expandidos */}
            {showFiltros && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                <CustomDropdown
                  options={[
                    { value: '', label: 'Todos Motoboys' },
                    ...motoboys.map(m => ({ value: m, label: m }))
                  ]}
                  value={filtros.motoboy}
                  onChange={(value) => setFiltros({ ...filtros, motoboy: value })}
                  placeholder="Todos Motoboys"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Todos Períodos' },
                    { value: 'Manhã', label: 'Manhã' },
                    { value: 'Tarde', label: 'Tarde' }
                  ]}
                  value={filtros.periodo}
                  onChange={(value) => setFiltros({ ...filtros, periodo: value })}
                  placeholder="Todos Períodos"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Todos Status' },
                    { value: 'Produzindo no Laboratório', label: 'Produção' },
                    { value: 'A Caminho', label: 'A Caminho' },
                    { value: 'Entregue', label: 'Entregue' }
                  ]}
                  value={filtros.status}
                  onChange={(value) => setFiltros({ ...filtros, status: value })}
                  placeholder="Todos Status"
                />
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="print-container max-w-7xl mx-auto px-6 pb-8">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Carregando romaneios...</p>
            </div>
          ) : romaneiosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum romaneio encontrado</h3>
              <p className="text-slate-600">
                {filtros.busca || filtros.motoboy || filtros.periodo || filtros.status
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há romaneios para esta data'}
              </p>
            </div>
          ) : (
            <>
              {/* Contador */}
              <div className="no-print mb-4 text-sm text-slate-600">
                Mostrando {romaneiosFiltrados.length} romaneio(s)
              </div>

              {/* Grid de Romaneios - 2 por linha */}
              <div className="romaneios-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                {romaneiosFiltrados.map((romaneio) => (
                  <RomaneioCard key={romaneio.id} romaneio={romaneio} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
