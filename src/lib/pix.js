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
 * So faz sentido oferecer o PIX quando o dinheiro ainda vai ser recebido do
 * cliente na entrega. Hoje essas formas sao "Receber Dinheiro" e "Receber
 * Maquina"; a regra olha o inicio "Receber" para valer tambem para formas
 * novas que venham a existir.
 *
 * Ficam de fora: "Pago ..." (ja foi pago), "Pagar MP" e "So Entregar".
 */
export function romaneioAceitaPix(formaPagamento) {
  return String(formaPagamento || '').trim().toLowerCase().startsWith('receber');
}
