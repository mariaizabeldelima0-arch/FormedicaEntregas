// Dados do PIX da farmacia, usados nas impressoes de romaneio.
//
// Ficam aqui, num lugar so, porque existem DOIS layouts de impressao
// (ImpressaoRomaneio.jsx e RomaneiosDoDia.jsx). Se a chave ou a regra
// ficassem copiadas nos dois, uma hora mudariam so num deles.

// Chave PIX: o CNPJ da Formedica. A imagem do QR correspondente esta em
// public/pix-qrcode.png.
export const CHAVE_PIX_CNPJ = '00.922.390/0001-57';

/**
 * Diz se o romaneio deve sair com o QR do PIX.
 *
 * So faz sentido oferecer o PIX quando o dinheiro ainda nao entrou. Sao dois
 * casos, e a regra olha o texto da forma de pagamento em vez de uma lista
 * fechada, para valer tambem em formas novas que venham a existir:
 *
 *   - comeca com "Receber"  -> Receber Dinheiro, Receber Maquina
 *   - contem "Aguardando"   -> Aguardando, Link Aguardando, Pix Aguardando
 *
 * Ficam de fora: "Pago ..." (ja foi pago), "Pagar MP", "Boleto", "Coleta",
 * "So Entregar" e "Via na Pasta".
 */
export function romaneioAceitaPix(formaPagamento) {
  const forma = String(formaPagamento || '').trim().toLowerCase();
  return forma.startsWith('receber') || forma.includes('aguardando');
}
