# Configuração de Anexos - Sistema de Entregas

## Passo a Passo para Configurar Upload de Anexos

### 1. Atualizar Banco de Dados

Execute o script `adicionar_colunas_anexos.sql` no Supabase SQL Editor:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `adicionar_colunas_anexos.sql`
6. Clique em **Run** para executar

### 2. Configurar Storage

Execute o script `configurar_storage_anexos.sql` no Supabase SQL Editor:

1. No mesmo **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `configurar_storage_anexos.sql`
4. Clique em **Run** para executar

### 3. Verificar Configuração

#### Verificar Colunas
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entregas'
AND column_name LIKE '%anexo%' OR column_name LIKE '%descricao%';
```

#### Verificar Bucket
1. Vá em **Storage** no menu lateral do Supabase
2. Verifique se o bucket `entregas-anexos` foi criado
3. Clique no bucket e verifique as políticas de acesso

### 4. Funcionalidades Implementadas

#### Tipos de Anexo
- **Receita**: Fotos de receitas médicas retidas
- **Pagamento**: Comprovantes de pagamento
- **Outros**: Outros documentos relacionados à entrega

#### Campos no Banco de Dados
Para cada tipo de anexo, há 2 colunas:
- `{tipo}_anexo`: URL pública do arquivo no Supabase Storage
- `{tipo}_descricao`: Descrição opcional do anexo

Exemplo:
- `receita_anexo` e `receita_descricao`
- `pagamento_anexo` e `pagamento_descricao`
- `outros_anexo` e `outros_descricao`

#### Fluxo de Upload
1. Usuário clica em "Anexar" em uma receita pendente
2. Modal abre com campos:
   - Tipo de anexo (Receita/Pagamento/Outros)
   - Seleção de arquivo (imagens ou PDF)
   - Descrição opcional
3. Ao enviar:
   - Arquivo é enviado para `entregas-anexos` no Supabase Storage
   - URL pública é salva no banco de dados
   - Se tipo for "Pagamento", redireciona para página de pagamentos
   - Se tipo for "Receita", permanece na página de receitas

### 5. Permissões de Acesso

As políticas configuradas permitem:
- **Upload**: Apenas usuários autenticados
- **Leitura**: Público (URLs compartilháveis)
- **Atualização**: Apenas usuários autenticados
- **Exclusão**: Apenas usuários autenticados

### 6. Formatos Aceitos

- Imagens: JPG, PNG, GIF, WebP, etc.
- Documentos: PDF

### 7. Nomenclatura dos Arquivos

Os arquivos são salvos com o padrão:
```
{id_entrega}_{tipo}_{timestamp}.{extensao}
```

Exemplo: `123_Receita_1640000000000.jpg`
