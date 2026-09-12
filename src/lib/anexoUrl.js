// Links temporários para os anexos (receitas médicas e comprovantes).
//
// POR QUE ISTO EXISTE
// Uma receita revela a condição de saúde do paciente — é dado pessoal
// sensível pela LGPD. Enquanto o balde do Storage era público, cada imagem
// tinha um endereço permanente que abria para qualquer pessoa, sem login.
// Um endereço desses vaza fácil: WhatsApp, histórico do navegador de um
// computador compartilhado, e-mail encaminhado. E não havia como revogar.
//
// COMO FICOU
// O balde é privado. O endereço gravado em `anexos.url` não abre mais
// sozinho: vale apenas como identificação do arquivo. Antes de mostrar a
// imagem pedimos ao Supabase um link assinado — temporário, válido por uma
// hora, e concedido somente a quem está logado.
//
// Continuamos gravando o endereço no mesmo formato de sempre para as linhas
// novas, de modo que as antigas e as novas fiquem iguais entre si. Foi o que
// permitiu fazer esta mudança sem migrar nenhuma das linhas já existentes.

import { supabase } from '@/api/supabaseClient';

export const BUCKET = 'entregas-anexos';

// Uma hora: bem mais do que o tempo de olhar uma receita, e curto o
// suficiente para que um link copiado por engano não sirva no dia seguinte.
const VALIDADE_EM_SEGUNDOS = 60 * 60;

const MARCA_PUBLICA = `/object/public/${BUCKET}/`;

/**
 * Descobre o caminho do arquivo dentro do balde a partir do que está gravado
 * em `anexos.url`.
 *
 * Aceita o endereço completo no formato antigo
 * (`https://.../object/public/entregas-anexos/anexos/foto.jpg`) e também um
 * caminho cru (`anexos/foto.jpg`), caso alguma linha tenha sido gravada assim.
 * Devolve `null` quando não reconhece o formato — aí o chamador avisa o
 * usuário em vez de tentar abrir algo quebrado.
 */
export function caminhoDoAnexo(url) {
  if (!url) return null;

  let caminho = null;

  const partes = url.split(MARCA_PUBLICA);
  if (partes.length > 1) {
    caminho = partes[1].split('?')[0];
  } else if (!url.includes('://')) {
    caminho = url.replace(/^\/+/, '');
  }

  if (!caminho) return null;

  // O endereço vem com os caracteres especiais codificados (%20 e afins);
  // o Storage espera o nome do arquivo como ele realmente é.
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

/**
 * Assina vários anexos de uma vez só (um único pedido ao servidor).
 * Devolve um mapa `url gravada -> link assinado`. Anexos que falharem
 * simplesmente não aparecem no mapa.
 */
export async function assinarUrls(urls) {
  const assinados = new Map();

  const originalPorCaminho = new Map();
  for (const url of urls) {
    const caminho = caminhoDoAnexo(url);
    if (caminho && !originalPorCaminho.has(caminho)) {
      originalPorCaminho.set(caminho, url);
    }
  }

  const caminhos = [...originalPorCaminho.keys()];
  if (caminhos.length === 0) return assinados;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(caminhos, VALIDADE_EM_SEGUNDOS);

  if (error || !data) {
    console.error('Erro ao assinar os anexos:', error);
    return assinados;
  }

  for (const item of data) {
    if (!item?.signedUrl || item.error) continue;
    const original = originalPorCaminho.get(item.path);
    if (original) assinados.set(original, item.signedUrl);
  }

  return assinados;
}

/** Assina um anexo só. Devolve `null` se não der. */
export async function assinarUrl(url) {
  const caminho = caminhoDoAnexo(url);
  if (!caminho) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, VALIDADE_EM_SEGUNDOS);

  if (error || !data?.signedUrl) {
    console.error('Erro ao assinar o anexo:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Abre um anexo numa aba nova. Devolve `false` se não conseguiu, para o
 * chamador poder avisar o usuário.
 */
export async function abrirAnexo(url) {
  // A aba precisa ser aberta agora, dentro do clique. Se esperássemos a
  // resposta do servidor para só então abrir, o navegador entenderia como
  // pop-up e bloquearia.
  const aba = window.open('', '_blank');
  if (aba) aba.opener = null;

  const assinada = await assinarUrl(url);

  if (!assinada) {
    if (aba) aba.close();
    return false;
  }

  if (aba) {
    aba.location.href = assinada;
  } else {
    // Pop-up bloqueado: abre na própria aba, o usuário volta com o botão
    // "voltar" do navegador.
    window.location.href = assinada;
  }

  return true;
}
