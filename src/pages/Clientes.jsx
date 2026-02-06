import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDropdown } from "@/components/CustomDropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  User,
  Phone,
  MapPin,
  Trash2,
  Edit,
  ArrowLeft,
  CreditCard,
  Mail,
  FileText,
  Package,
  Calendar,
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  Truck,
  ClipboardList,
  Check,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { buscarCep, formatarCep } from "@/utils/buscarCep";

// Mapeamento de regiões
const REGIOES = [
  { value: "BC", label: "Balneário Camboriú (BC)" },
  { value: "NOVA ESPERANÇA", label: "Nova Esperança" },
  { value: "CAMBORIÚ", label: "Camboriú" },
  { value: "BARRA", label: "Barra" },
  { value: "ESTALEIRO", label: "Estaleiro" },
  { value: "TAQUARAS", label: "Taquaras" },
  { value: "LARANJEIRAS", label: "Laranjeiras" },
  { value: "PRAIA DOS AMORES", label: "Praia dos Amores" },
  { value: "PRAIA BRAVA", label: "Praia Brava" },
  { value: "ITAJAI", label: "Itajaí" },
  { value: "ITAPEMA", label: "Itapema" },
  { value: "NAVEGANTES", label: "Navegantes" },
  { value: "PENHA", label: "Penha" },
  { value: "PORTO BELO", label: "Porto Belo" },
  { value: "TIJUCAS", label: "Tijucas" },
  { value: "PIÇARRAS", label: "Piçarras" },
  { value: "BOMBINHAS", label: "Bombinhas" },
  { value: "OUTRO", label: "Outro" }
];

const ClienteForm = ({ cliente, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(cliente || {
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    enderecos: [{
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      cep: "",
      regiao: "",
      ponto_referencia: "",
      observacoes: "",
      is_principal: true
    }]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    if (!formData.enderecos.some(end => end.logradouro && end.numero && end.cidade)) {
      toast.error('Preencha pelo menos um endereço completo');
      return;
    }

    setSaving(true);
    const toastId = toast.loading(cliente?.id ? 'Atualizando cliente...' : 'Cadastrando cliente...');

    try {
      // Verificar se já existe cliente com o mesmo nome (apenas para novos cadastros)
      if (!cliente?.id) {
        const { data: clienteExistente } = await supabase
          .from('clientes')
          .select('id, nome')
          .ilike('nome', formData.nome.trim())
          .limit(1);

        if (clienteExistente && clienteExistente.length > 0) {
          toast.error(`Já existe um cliente cadastrado com o nome "${clienteExistente[0].nome}"`, { id: toastId });
          setSaving(false);
          return;
        }
      }

      // 1. Criar ou atualizar cliente
      let clienteId;

      if (cliente?.id) {
        // Atualizar cliente existente
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            nome: formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone,
            email: formData.email || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', cliente.id);

        if (updateError) throw updateError;
        clienteId = cliente.id;

        // Deletar endereços antigos
        await supabase
          .from('enderecos')
          .delete()
          .eq('cliente_id', clienteId);
      } else {
        // Criar novo cliente
        const { data: novoCliente, error: createError } = await supabase
          .from('clientes')
          .insert([{
            nome: formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone,
            email: formData.email || null
          }])
          .select()
          .single();

        if (createError) throw createError;
        clienteId = novoCliente.id;
      }

      // 2. Criar endereços
      const enderecosParaInserir = formData.enderecos
        .filter(end => end.logradouro && end.numero && end.cidade)
        .map((end, index) => ({
          cliente_id: clienteId,
          logradouro: end.logradouro,
          numero: end.numero,
          complemento: end.complemento || null,
          bairro: end.bairro || null,
          cidade: end.cidade,
          cep: end.cep || null,
          regiao: end.regiao || null,
          ponto_referencia: end.ponto_referencia || null,
          observacoes: end.observacoes || null,
          is_principal: index === 0 // Primeiro endereço é o principal
        }));

      if (enderecosParaInserir.length > 0) {
        const { error: enderecoError } = await supabase
          .from('enderecos')
          .insert(enderecosParaInserir);

        if (enderecoError) throw enderecoError;
      }

      toast.success(cliente?.id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', { id: toastId });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente: ' + error.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const addEndereco = () => {
    setFormData({
      ...formData,
      enderecos: [
        ...formData.enderecos,
        {
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          cep: "",
          regiao: "",
          ponto_referencia: "",
          observacoes: "",
          is_principal: false
        }
      ]
    });
  };

  const removeEndereco = (index) => {
    if (formData.enderecos.length === 1) {
      toast.error('É necessário pelo menos um endereço');
      return;
    }
    setFormData({
      ...formData,
      enderecos: formData.enderecos.filter((_, i) => i !== index)
    });
  };

  // Mapeamento de bairro/cidade para região
  const detectarRegiao = (bairro, cidade) => {
    const bairroNorm = (bairro || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cidadeNorm = (cidade || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Verificar bairro primeiro (mais específico)
    const mapaBairro = {
      'nova esperanca': 'NOVA ESPERANÇA',
      'barra': 'BARRA',
      'estaleiro': 'ESTALEIRO',
      'taquaras': 'TAQUARAS',
      'laranjeiras': 'LARANJEIRAS',
      'praia dos amores': 'PRAIA DOS AMORES',
      'praia brava': 'PRAIA BRAVA',
      'tabuleiro': 'TABULEIRO',
      'monte alegre': 'MONTE ALEGRE',
      'espinheiros': 'ESPINHEIROS',
      'centro': null, // centro depende da cidade
    };

    for (const [chave, regiao] of Object.entries(mapaBairro)) {
      if (bairroNorm === chave && regiao) return regiao;
    }

    // Verificar cidade
    const mapaCidade = {
      'balneario camboriu': 'BC',
      'bal. camboriu': 'BC',
      'bal camboriu': 'BC',
      'bc': 'BC',
      'camboriu': 'CAMBORIÚ',
      'itajai': 'ITAJAI',
      'itapema': 'ITAPEMA',
      'navegantes': 'NAVEGANTES',
      'penha': 'PENHA',
      'porto belo': 'PORTO BELO',
      'tijucas': 'TIJUCAS',
      'picarras': 'PIÇARRAS',
      'bombinhas': 'BOMBINHAS',
    };

    for (const [chave, regiao] of Object.entries(mapaCidade)) {
      if (cidadeNorm === chave) return regiao;
    }

    return null;
  };

  const updateEndereco = (index, field, value) => {
    const newEnderecos = [...formData.enderecos];
    newEnderecos[index] = { ...newEnderecos[index], [field]: value };

    // Auto-detectar região quando bairro ou cidade mudar
    if (field === 'bairro' || field === 'cidade') {
      const bairro = field === 'bairro' ? value : newEnderecos[index].bairro;
      const cidade = field === 'cidade' ? value : newEnderecos[index].cidade;
      const regiaoDetectada = detectarRegiao(bairro, cidade);
      if (regiaoDetectada) {
        newEnderecos[index].regiao = regiaoDetectada;
      }
    }

    setFormData({ ...formData, enderecos: newEnderecos });
  };

  const handleCepChange = async (index, value) => {
    const cepFormatado = formatarCep(value);
    updateEndereco(index, 'cep', cepFormatado);

    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      const enderecoCep = await buscarCep(cepLimpo);
      if (enderecoCep) {
        setFormData(prev => {
          const newEnderecos = [...prev.enderecos];
          newEnderecos[index] = {
            ...newEnderecos[index],
            cep: cepFormatado,
            logradouro: enderecoCep.logradouro || newEnderecos[index].logradouro,
            bairro: enderecoCep.bairro || newEnderecos[index].bairro,
            cidade: enderecoCep.cidade || newEnderecos[index].cidade,

          };
          const regiaoDetectada = detectarRegiao(newEnderecos[index].bairro, newEnderecos[index].cidade);
          if (regiaoDetectada) {
            newEnderecos[index].regiao = regiaoDetectada;
          }
          return { ...prev, enderecos: newEnderecos };
        });
        toast.success('Endereço preenchido pelo CEP');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Digite o nome completo"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Telefone *
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            E-mail
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="cliente@email.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Seção de Endereços */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex justify-between items-center pt-2">
          <h3 className="text-sm font-semibold text-slate-700">Endereços</h3>
          <button
            type="button"
            onClick={addEndereco}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Endereço
          </button>
        </div>

        {formData.enderecos.map((endereco, index) => (
          <div key={`endereco-${index}`} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Endereço {index + 1} {index === 0 && "(Principal)"}
              </h4>
              {formData.enderecos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEndereco(index)}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={endereco.cep || ""}
                    onChange={(e) => handleCepChange(index, e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <CustomDropdown
                    label="Região"
                    options={[
                      { value: '', label: 'Selecione a região' },
                      ...REGIOES.map(regiao => ({ value: regiao.value, label: regiao.label }))
                    ]}
                    value={endereco.regiao || ""}
                    onChange={(value) => updateEndereco(index, 'regiao', value)}
                    placeholder="Selecione a região"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rua/Logradouro *
                  </label>
                  <input
                    type="text"
                    value={endereco.logradouro}
                    onChange={(e) => updateEndereco(index, 'logradouro', e.target.value)}
                    placeholder="Nome da rua"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={endereco.numero}
                    onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={endereco.bairro}
                    onChange={(e) => updateEndereco(index, 'bairro', e.target.value)}
                    placeholder="Nome do bairro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={endereco.cidade}
                    onChange={(e) => updateEndereco(index, 'cidade', e.target.value)}
                    placeholder="Ex: Balneário Camboriú"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={endereco.complemento}
                  onChange={(e) => updateEndereco(index, 'complemento', e.target.value)}
                  placeholder="Apto, Bloco, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  value={endereco.ponto_referencia}
                  onChange={(e) => updateEndereco(index, 'ponto_referencia', e.target.value)}
                  placeholder="Próximo a..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={endereco.observacoes}
                  onChange={(e) => updateEndereco(index, 'observacoes', e.target.value)}
                  placeholder="Observações importantes"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-vertical"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
          style={{ backgroundColor: saving ? '#94a3b8' : '#376295', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Salvando...' : (cliente?.id ? 'Atualizar' : 'Cadastrar')}
        </button>
      </div>
    </form>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
    "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
    "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
    "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
    "Não Entregue": { color: "bg-red-100 text-red-700", icon: Clock },
    "Cancelado": { color: "bg-gray-100 text-gray-700", icon: Clock },
    "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
    "Voltou": { color: "bg-orange-100 text-orange-700", icon: Clock },
  };
  const { color, icon: Icon } = configs[status] || configs["Pendente"];
  return (
    <Badge className={color}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

export default function Clientes() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // Estados para ficha do cliente (master-detail)
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [entregasCliente, setEntregasCliente] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const [buscaEntregas, setBuscaEntregas] = useState("");

  const loadClientes = async () => {
    setLoading(true);
    try {
      // Buscar clientes com seus endereços
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          enderecos (*)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);

      // Selecionar o primeiro cliente automaticamente se não houver nenhum selecionado
      if (data && data.length > 0 && !clienteSelecionado) {
        handleSelectCliente(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm) ||
    c.cpf?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (cliente, e) => {
    e?.stopPropagation();
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setEditingCliente(null);
    }, 100);
  };

  const handleSuccess = () => {
    handleClose();
    loadClientes();
  };

  // Selecionar cliente e carregar entregas
  const handleSelectCliente = async (cliente) => {
    setClienteSelecionado(cliente);
    setBuscaEntregas("");
    await loadEntregasCliente(cliente.id);
  };

  // Carregar entregas do cliente (incluindo entregas onde é cliente adicional)
  const loadEntregasCliente = async (clienteId) => {
    setLoadingEntregas(true);
    try {
      // Buscar entregas onde o cliente é o principal
      const { data: entregasPrincipal, error: errorPrincipal } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .eq('cliente_id', clienteId)
        .order('data_entrega', { ascending: false });

      if (errorPrincipal) throw errorPrincipal;

      // Buscar entregas onde o cliente está nos clientes_adicionais
      // Usar filtro com sintaxe PostgREST para arrays
      const { data: entregasAdicional, error: errorAdicional } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .not('clientes_adicionais', 'is', null)
        .order('data_entrega', { ascending: false });

      if (errorAdicional) throw errorAdicional;

      // Filtrar entregas que contêm o cliente no array clientes_adicionais
      const entregasComClienteAdicional = (entregasAdicional || []).filter(entrega =>
        entrega.clientes_adicionais && entrega.clientes_adicionais.includes(clienteId)
      );

      // Combinar e remover duplicatas
      const todasEntregas = [...(entregasPrincipal || [])];
      const idsExistentes = new Set(todasEntregas.map(e => e.id));

      entregasComClienteAdicional.forEach(entrega => {
        if (!idsExistentes.has(entrega.id)) {
          todasEntregas.push(entrega);
        }
      });

      // Ordenar por data de entrega (mais recente primeiro)
      todasEntregas.sort((a, b) => {
        const dataA = new Date(a.data_entrega || '1900-01-01');
        const dataB = new Date(b.data_entrega || '1900-01-01');
        return dataB - dataA;
      });

      // Processar snapshot de endereço
      const entregasComSnapshot = todasEntregas.map(entrega => {
        // Priorizar dados do snapshot de endereço
        const enderecoDisplay = entrega.endereco_logradouro
          ? {
              // Usar snapshot se existir
              id: entrega.endereco_id,
              logradouro: entrega.endereco_logradouro,
              numero: entrega.endereco_numero,
              complemento: entrega.endereco_complemento,
              bairro: entrega.endereco_bairro,
              cidade: entrega.endereco_cidade
            }
          : entrega.endereco; // Usar dados da relação se snapshot não existir

        return {
          ...entrega,
          endereco: enderecoDisplay
        };
      });

      setEntregasCliente(entregasComSnapshot);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar histórico de entregas');
      setEntregasCliente([]);
    } finally {
      setLoadingEntregas(false);
    }
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    const toastId = toast.loading('Excluindo cliente...');

    try {
      // Verificar se cliente tem entregas como cliente principal
      const { data: entregasPrincipal, error: entregasPrincipalError } = await supabase
        .from('entregas')
        .select('id')
        .eq('cliente_id', clienteToDelete.id)
        .limit(1);

      if (entregasPrincipalError) throw entregasPrincipalError;

      if (entregasPrincipal && entregasPrincipal.length > 0) {
        toast.error('Não é possível excluir cliente com entregas cadastradas', { id: toastId });
        setDeleteDialogOpen(false);
        setClienteToDelete(null);
        return;
      }

      // Verificar se cliente está em entregas como cliente adicional
      const { data: entregasComAdicionais, error: entregasAdicionalError } = await supabase
        .from('entregas')
        .select('id, clientes_adicionais')
        .not('clientes_adicionais', 'is', null);

      if (entregasAdicionalError) throw entregasAdicionalError;

      const temEntregaAdicional = (entregasComAdicionais || []).some(entrega =>
        entrega.clientes_adicionais && entrega.clientes_adicionais.includes(clienteToDelete.id)
      );

      if (temEntregaAdicional) {
        toast.error('Não é possível excluir cliente vinculado a entregas', { id: toastId });
        setDeleteDialogOpen(false);
        setClienteToDelete(null);
        return;
      }

      // Deletar endereços primeiro (relacionamento)
      await supabase
        .from('enderecos')
        .delete()
        .eq('cliente_id', clienteToDelete.id);

      // Deletar cliente
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteToDelete.id);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!', { id: toastId });
      setDeleteDialogOpen(false);
      setClienteToDelete(null);

      // Se o cliente excluído era o selecionado, limpar seleção
      if (clienteSelecionado?.id === clienteToDelete.id) {
        setClienteSelecionado(null);
        setEntregasCliente([]);
      }

      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente: ' + error.message, { id: toastId });
    }
  };

  const confirmDelete = (cliente, e) => {
    e?.stopPropagation();
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  // Remover clientes duplicados
  const removerDuplicados = async () => {
    if (!confirm('Tem certeza que deseja remover os clientes duplicados? Esta ação manterá apenas o cadastro mais antigo de cada cliente com o mesmo nome.')) {
      return;
    }

    const toastId = toast.loading('Removendo duplicados...');

    try {
      // Buscar todos os clientes
      const { data: todosClientes, error: fetchError } = await supabase
        .from('clientes')
        .select('id, nome, created_at')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Encontrar duplicados (agrupar por nome em lowercase)
      const clientesPorNome = {};
      todosClientes.forEach(cliente => {
        const nomeNormalizado = cliente.nome.toLowerCase().trim();
        if (!clientesPorNome[nomeNormalizado]) {
          clientesPorNome[nomeNormalizado] = [];
        }
        clientesPorNome[nomeNormalizado].push(cliente);
      });

      // Coletar IDs dos duplicados (manter o primeiro, remover os outros)
      const idsParaRemover = [];
      Object.values(clientesPorNome).forEach(clientes => {
        if (clientes.length > 1) {
          // Pular o primeiro (mais antigo) e marcar os outros para remoção
          for (let i = 1; i < clientes.length; i++) {
            idsParaRemover.push(clientes[i].id);
          }
        }
      });

      if (idsParaRemover.length === 0) {
        toast.success('Nenhum cliente duplicado encontrado!', { id: toastId });
        return;
      }

      // Primeiro, deletar os endereços dos clientes duplicados
      const { error: enderecoError } = await supabase
        .from('enderecos')
        .delete()
        .in('cliente_id', idsParaRemover);

      if (enderecoError) throw enderecoError;

      // Depois, deletar os clientes duplicados
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .in('id', idsParaRemover);

      if (deleteError) throw deleteError;

      toast.success(`${idsParaRemover.length} cliente(s) duplicado(s) removido(s)!`, { id: toastId });
      loadClientes();
    } catch (error) {
      console.error('Erro ao remover duplicados:', error);
      toast.error('Erro ao remover duplicados: ' + error.message, { id: toastId });
    }
  };

  // Filtrar entregas
  const entregasFiltradas = entregasCliente.filter(e => {
    if (buscaEntregas) {
      const termo = buscaEntregas.toLowerCase();
      return e.requisicao?.toLowerCase().includes(termo) ||
             e.observacoes?.toLowerCase().includes(termo);
    }
    return true;
  });

  const totalEntregas = entregasCliente.length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
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
              <h1 className="text-4xl font-bold text-white">Clientes</h1>
              <p className="text-base text-white opacity-90 mt-1">Gerencie sua base de clientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da página */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            key={editingCliente?.id || 'new'}
            style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: '#376295' }}>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingCliente
                  ? 'Atualize as informações do cliente e seus endereços.'
                  : 'Preencha os dados do novo cliente e pelo menos um endereço.'}
              </DialogDescription>
            </DialogHeader>
            <ClienteForm
              cliente={editingCliente}
              onSuccess={handleSuccess}
              onCancel={handleClose}
            />
          </DialogContent>
        </Dialog>

        {/* Layout Master-Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA - Lista de Clientes */}
          <Card className="border-none shadow-lg">
            <CardHeader className="space-y-3">
              <CardTitle>Lista de Clientes</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                className="w-full"
                style={{ background: '#376295', color: 'white' }}
                onClick={() => { setDialogOpen(true); setEditingCliente(null); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando clientes...
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {filteredClientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        clienteSelecionado?.id === cliente.id ? 'bg-blue-50 border-l-4 border-[#457bba]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {cliente.nome}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefone}
                          </div>
                          {/* Botões de ação inline */}
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleEdit(cliente, e)}
                              className="h-7 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => confirmDelete(cliente, e)}
                              className="h-7 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COLUNA DIREITA - Ficha do Cliente */}
          <div className="lg:col-span-2 space-y-6">
            {clienteSelecionado ? (
              <>
                {/* SEÇÃO SUPERIOR - Cabeçalho Roxo Degradê */}
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <User className="w-8 h-8" />
                      <div>
                        <div>{clienteSelecionado.nome}</div>
                        <div className="text-sm font-normal opacity-90 mt-1">
                          {clienteSelecionado.telefone}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* SEÇÃO INTERMEDIÁRIA - Endereços e Estatísticas */}
                <Card className="border-none shadow-lg">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lado Esquerdo - Endereços */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-[#f59e0b]" />
                          <h3 className="font-semibold text-slate-900">Endereços</h3>
                        </div>
                        {clienteSelecionado.enderecos && clienteSelecionado.enderecos.length > 0 ? (
                          <div className="space-y-3">
                            {clienteSelecionado.enderecos.map((end, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                                <div className="font-medium text-slate-900">
                                  {end.logradouro}, {end.numero}
                                </div>
                                {end.complemento && (
                                  <div className="text-slate-600">{end.complemento}</div>
                                )}
                                <div className="text-slate-600">
                                  {end.bairro && `${end.bairro} - `}
                                  {end.cidade}
                                </div>
                                {end.cep && (
                                  <div className="text-slate-500">CEP: {end.cep}</div>
                                )}
                                {end.regiao && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {end.regiao}
                                    </Badge>
                                  </div>
                                )}
                                {end.is_principal && (
                                  <div className="mt-2">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      Endereço Principal
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">Nenhum endereço cadastrado</p>
                        )}

                        {/* Informações adicionais */}
                        <div className="mt-4 space-y-2">
                          {clienteSelecionado.cpf && (
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">CPF: {clienteSelecionado.cpf}</span>
                            </div>
                          )}
                          {clienteSelecionado.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{clienteSelecionado.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito - Total de Entregas */}
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 mb-4">Entregas</h3>
                        <div className="bg-white rounded-xl shadow-sm p-5" style={{ border: '2px solid #376295' }}>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                              <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">Total</span>
                          </div>
                          <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
                            {totalEntregas}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEÇÃO INFERIOR - Histórico de Entregas */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#457bba]" />
                        Histórico de Entregas
                      </CardTitle>
                      <div className="text-sm text-slate-500">
                        {entregasFiltradas.length} entregas
                      </div>
                    </div>
                    {/* Barra de busca interna */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por requisição..."
                          value={buscaEntregas}
                          onChange={(e) => setBuscaEntregas(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingEntregas ? (
                      <div className="p-6 text-center text-slate-500">
                        Carregando histórico...
                      </div>
                    ) : entregasFiltradas.length === 0 ? (
                      <div className="p-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          {buscaEntregas
                            ? 'Nenhuma entrega encontrada com a busca aplicada'
                            : 'Nenhuma entrega encontrada para este cliente'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {entregasFiltradas.map((entrega) => (
                          <button
                            key={entrega.id}
                            type="button"
                            onClick={() => navigate(`/detalhes-romaneio?id=${entrega.id}`)}
                            className="w-full p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-bold text-slate-900">
                                    #{entrega.requisicao}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  {entrega.motoboy?.nome && (
                                    <div>
                                      <span className="font-medium">Motoboy:</span> {entrega.motoboy.nome}
                                    </div>
                                  )}
                                  {entrega.regiao && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {entrega.regiao}
                                    </div>
                                  )}
                                  {entrega.data_entrega && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(entrega.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                  )}
                                  {entrega.valor && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      R$ {entrega.valor.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Selecione um Cliente
                  </h3>
                  <p className="text-slate-600">
                    Escolha um cliente da lista para visualizar sua ficha completa e histórico de entregas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente <strong>{clienteToDelete?.nome}</strong> e todos os seus endereços serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClienteToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: '#ef4444' }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
