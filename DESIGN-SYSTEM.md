# 🎨 Design System - Formedica Entregas

## 📋 Análise de Inconsistências Encontradas

### 1. **Ícones** ❌
- **EntregasMoto**: SVG inline customizados
- **Pagamentos**: lucide-react (✅ melhor prática)
- **Dispositivos**: lucide-react (✅ melhor prática)
- **Problema**: Mistura de abordagens, SVG inline dificulta manutenção

### 2. **Componentes** ❌
- **Pagamentos**: Usa shadcn/ui (Card, Button, Badge, Input)
- **Dispositivos**: Tailwind puro em divs
- **Problema**: Falta de consistência visual e código duplicado

### 3. **Headers de Página** ❌
- Cada página tem um estilo diferente de cabeçalho
- Diferentes backgrounds, espaçamentos e estruturas

### 4. **Cores** ❌
- Algumas páginas usam cores hardcoded (bg-green-500, bg-red-500)
- Outras usam variáveis CSS do tema
- **Problema**: Difícil mudar esquema de cores globalmente

### 5. **Espaçamentos** ❌
- Padding e margin inconsistentes
- Alguns usam p-4, outros p-6, sem padrão claro

---

## ✅ Padronização Proposta

### 1. Paleta de Cores
```
Primária: #457bba (Azul Formedica)
Secundária: #64748b (Slate)

Status:
- Sucesso: #10b981 (green-500)
- Aviso: #f59e0b (amber-500)
- Erro: #ef4444 (red-500)
- Info: #3b82f6 (blue-500)

Neutros:
- Background: #f8fafc (slate-50)
- Card: #ffffff (white)
- Border: #e2e8f0 (slate-200)
- Text: #1e293b (slate-900)
- Text Secondary: #64748b (slate-600)
```

### 2. Componentes Padrão
```
✅ Usar shadcn/ui sempre que possível:
- Card, CardContent, CardHeader, CardTitle
- Button (com variants padrão)
- Badge (com variants: default, success, warning, destructive)
- Input, Select, Dialog, etc.

✅ Ícones: lucide-react apenas
- Remover SVG inline
- Importar de lucide-react
```

### 3. Header de Página Padrão
```jsx
<div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm">
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center gap-4">
      <button onClick={() => navigate(-1)}>
        <ArrowLeft />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">[Título]</h1>
        <p className="text-sm text-slate-600">[Descrição]</p>
      </div>
    </div>
  </div>
</div>
```

### 4. Layout de Cards
```jsx
<div className="max-w-7xl mx-auto px-6 py-6">
  <Card>
    <CardHeader>
      <CardTitle>[Título]</CardTitle>
    </CardHeader>
    <CardContent>
      [Conteúdo]
    </CardContent>
  </Card>
</div>
```

### 5. Espaçamentos Padrão
```
Container principal: max-w-7xl mx-auto px-6 py-6
Cards internos: p-6
Gaps entre elementos: gap-4 (padrão), gap-6 (maior)
Margem entre seções: mb-6
```

### 6. Tipografia
```
Título da página: text-2xl font-bold text-slate-900
Subtítulo: text-sm text-slate-600
Títulos de seção: text-lg font-bold text-slate-900
Texto normal: text-base text-slate-900
Texto secundário: text-sm text-slate-600
Labels: text-sm font-medium text-slate-700
```

---

## 🎯 Plano de Implementação

### Fase 1: Criar Componentes Base (COMEÇAR AQUI)
1. Criar `src/components/PageHeader.jsx` - Header padrão
2. Criar `src/components/StatusBadge.jsx` - Badge de status
3. Criar `src/components/EmptyState.jsx` - Estado vazio
4. Criar `src/components/LoadingState.jsx` - Estado de carregamento

### Fase 2: Padronizar Páginas Principais
1. EntregasMoto (página inicial)
2. Dispositivos (já moderna, pequenos ajustes)
3. Pagamentos
4. Receitas

### Fase 3: Páginas Secundárias
1. Clientes
2. SedexDisktenha
3. Relatorios
4. PlanilhaDiaria

### Fase 4: Detalhes Finais
1. Responsividade mobile
2. Loading states
3. Empty states
4. Transições e animações suaves

---

## 🚀 Por onde começar?

**RECOMENDAÇÃO: Começar pela Fase 1**

Criar os 4 componentes base vai:
- ✅ Estabelecer o padrão visual
- ✅ Facilitar a padronização das páginas
- ✅ Reduzir código duplicado
- ✅ Garantir consistência

Depois aplicar nas páginas principais uma por uma.
