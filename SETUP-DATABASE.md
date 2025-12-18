# Configuração do Banco de Dados - Formédica Entregas

## Passo 1: Executar o Schema SQL no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase-schema.sql`
6. Cole no editor SQL
7. Clique em **Run** ou pressione `Ctrl+Enter`

## Passo 2: Verificar as Tabelas Criadas

Após executar o script, verifique se as seguintes tabelas foram criadas:

- ✅ `usuarios` - Para login e autenticação
- ✅ `clientes` - Cadastro de clientes
- ✅ `enderecos` - Múltiplos endereços por cliente
- ✅ `motoboys` - Cadastro dos motoboys
- ✅ `entregas` - Romaneios e entregas

## Passo 3: Inserir Dados Iniciais (Opcional)

O script já inclui:
- ✅ Dois motoboys: **Marcio** e **Bruno**
- ✅ Um usuário admin padrão (CPF: 00000000000, senha: admin123)

**IMPORTANTE**: Troque a senha do admin em produção!

## Passo 4: Cadastrar Clientes de Teste

Para testar o sistema, você pode inserir alguns clientes manualmente:

```sql
-- Cliente de Teste 1
INSERT INTO clientes (nome, cpf, telefone, email) VALUES
('João Silva', '12345678901', '(47) 99999-9999', 'joao@email.com');

-- Endereço do Cliente 1
INSERT INTO enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal)
SELECT id, 'Rua das Flores', '123', 'Centro', 'Balneário Camboriú', 'BC', true
FROM clientes WHERE nome = 'João Silva';

-- Cliente de Teste 2
INSERT INTO clientes (nome, cpf, telefone, email) VALUES
('Maria Santos', '98765432109', '(47) 98888-8888', 'maria@email.com');

-- Endereço do Cliente 2
INSERT INTO enderecos (cliente_id, logradouro, numero, bairro, cidade, regiao, is_principal)
SELECT id, 'Av. Brasil', '456', 'Centro', 'Itajaí', 'ITAJAI', true
FROM clientes WHERE nome = 'Maria Santos';
```

## Passo 5: Testar a Funcionalidade "Novo Romaneio"

1. Execute o projeto: `npm run dev`
2. Faça login (use as credenciais do admin ou crie um usuário)
3. Clique em **"Novo Romaneio"** no menu lateral
4. Teste o fluxo completo:
   - ✅ Buscar cliente por nome
   - ✅ Selecionar endereço do cliente
   - ✅ Ou usar "Usar outro endereço" para digitar novo
   - ✅ Preencher número de requisição
   - ✅ Selecionar região (o motoboy e valor são calculados automaticamente)
   - ✅ Preencher os demais campos
   - ✅ Marcar "Item de Geladeira" e "Buscar Receita" se necessário
   - ✅ Salvar

## Estrutura Implementada

### 1. Dropdown de Endereços
- Quando seleciona um cliente, carrega automaticamente seus endereços
- Se o cliente tem apenas 1 endereço, seleciona automaticamente
- Botão para adicionar novo endereço (texto livre)
- Botão para voltar aos endereços cadastrados

### 2. Cálculo Automático
- Ao selecionar a região, o sistema:
  - Define automaticamente o motoboy (Marcio ou Bruno)
  - Calcula o valor de entrega baseado na tabela de preços

### 3. Validações
- Campos obrigatórios marcados com *
- Mensagens de erro específicas para cada campo
- Validação de requisição duplicada

### 4. Feedback Visual
- Toasts bonitos (Sonner) ao invés de alerts
- Loading state durante salvamento
- Mensagens de sucesso e erro

### 5. Campos Salvos no Banco
- ✅ cliente_id
- ✅ endereco_id (quando selecionado do cadastro)
- ✅ requisicao
- ✅ endereco_destino (texto livre ou endereço completo)
- ✅ regiao
- ✅ outra_cidade (quando região = OUTRO)
- ✅ data_entrega
- ✅ periodo (Manhã/Tarde)
- ✅ forma_pagamento
- ✅ motoboy_id
- ✅ valor
- ✅ item_geladeira (boolean)
- ✅ buscar_receita (boolean)
- ✅ observacoes

## Próximos Passos Sugeridos

1. **Cadastro de Clientes**: Implementar a tela de cadastro completo
2. **Listagem de Entregas**: Buscar entregas reais do banco
3. **Filtros**: Implementar filtros funcionais na listagem
4. **Relatórios**: Implementar geração de relatórios

## Troubleshooting

### Erro ao criar romaneio
- Verifique se executou o schema SQL completo
- Confirme que os motoboys foram inseridos corretamente
- Verifique as credenciais do Supabase no `.env`

### Endereços não aparecem
- Certifique-se que a tabela `enderecos` foi criada
- Verifique se os endereços têm `cliente_id` correto
- Confirme que há dados de teste inseridos

### Toast não aparece
- Verifique se o componente `<Toaster />` está no App.jsx
- Confirme que o import `import { toast } from 'sonner'` está correto

## Suporte

Se encontrar algum problema, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Aba Network para erros de API
3. Logs do Supabase para erros de banco de dados
