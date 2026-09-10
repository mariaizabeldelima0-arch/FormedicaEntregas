import imageCompression from 'browser-image-compression';

// Comprime a foto no próprio navegador, antes de subir.
//
// Por que: as fotos vinham da câmera do celular no tamanho original — 2,2 MB
// em média. Isso estourou a cota de armazenamento em agosto/2026. Comprimindo
// aqui, cada foto passa a ocupar cerca de 0,13 MB, sem perda visível de
// legibilidade (conferido imagem a imagem antes de aplicar no acervo antigo).
//
// Os ajustes são os mesmos usados para recomprimir as 596 imagens existentes,
// para que as fotos novas fiquem iguais às antigas.
const AJUSTES = {
  maxWidthOrHeight: 1600,
  initialQuality: 0.8,
  fileType: 'image/jpeg',
  useWebWorker: true,
  // Teto de segurança: não deve ser atingido na prática. Existe só para o
  // caso de uma imagem gigante — sem ele, uma foto muito grande poderia
  // continuar pesada mesmo depois de redimensionada.
  maxSizeMB: 1,
};

// Se a compressão falhar por qualquer motivo (formato que o navegador não
// abre, aparelho antigo, memória), devolve o arquivo original. Anexar a foto
// é mais importante do que economizar espaço — nunca deixar o usuário na mão.
export async function comprimirImagem(arquivo) {
  if (!arquivo || !arquivo.type?.startsWith('image/')) {
    return { arquivo, comprimido: false };
  }

  try {
    const menor = await imageCompression(arquivo, AJUSTES);

    // Se não ajudou (imagem já pequena), fica com a original
    if (menor.size >= arquivo.size) {
      return { arquivo, comprimido: false };
    }

    return { arquivo: menor, comprimido: true };
  } catch (erro) {
    console.error('Não foi possível comprimir a imagem, enviando a original:', erro);
    return { arquivo, comprimido: false };
  }
}

// A compressão converte para JPEG, então a extensão do arquivo precisa
// acompanhar — senão o navegador recebe um .png que na verdade é .jpg.
export function extensaoDoArquivo(arquivo, foiComprimido) {
  if (foiComprimido) return 'jpg';
  const ext = arquivo.name?.split('.').pop();
  return ext && ext.length <= 5 ? ext : 'jpg';
}
