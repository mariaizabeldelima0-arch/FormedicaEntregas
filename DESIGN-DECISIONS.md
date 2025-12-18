# Decisões de Design - Formédica Entregas

Este arquivo documenta as decisões de design e padrões de UI/UX do projeto.

## 📊 Cards de Estatísticas

### Comportamento Padrão
- **SEMPRE fazer os cards clicáveis** em todas as páginas que tiverem cards de estatísticas
- Os cards devem funcionar como filtros rápidos

### Estilo Visual
- **Card Ativo:**
  - Background colorido (usar a cor do card)
  - Borda de 2px na cor do card
  - Sombra elevada com a cor do card (opacity 40%)
  - Texto em branco
  - Animação de elevação (`translateY(-2px)`)

- **Card Inativo:**
  - Background branco
  - Borda de 1px cinza
  - Sombra suave
  - Texto colorido

### Interação
- Ao clicar em um card, filtrar a lista abaixo pelo critério correspondente
- Clicar novamente no mesmo card (ou no card "Total") limpa o filtro
- Transição suave de 0.2s em todas as mudanças

### Implementação
```javascript
const isActive = filtroAtual === card.filtroValor;

<div
  onClick={() => setFiltro(card.filtroValor)}
  style={{
    background: isActive ? card.color : 'white',
    border: isActive ? `2px solid ${card.color}` : `1px solid ${theme.colors.border}`,
    boxShadow: isActive ? `0 4px 12px ${card.color}40` : '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    transform: isActive ? 'translateY(-2px)' : 'none'
  }}
>
  // Conteúdo com cores condicionais
  <span style={{ color: isActive ? 'white' : card.color }}>
```

## 🎨 Paleta de Cores para Cards

- **Total/Geral:** `theme.colors.primary` (#457bba)
- **Produção/Pendente:** `#3b82f6` (azul)
- **Em Trânsito/A Caminho:** `#f59e0b` (laranja)
- **Concluído/Entregue:** `theme.colors.success` (verde)

## 📋 Seção de Filtros

- **Remover filtros redundantes** que já estão nos cards
- Manter apenas filtros complementares (Motoboy, Região, Período, etc.)
- Campo de busca sempre no topo

## 🔄 Consistência entre Páginas

Aplicar este padrão em:
- ✅ Entregas Moto
- ⏳ Sedex/Disktenha
- ⏳ Relatórios
- ⏳ Painel Motoboys
- ⏳ Outras páginas com cards de estatísticas

---

**Última atualização:** 2025-12-18
**Solicitado por:** Usuário
**Implementado em:** EntregasMoto.jsx
