/**
 * Busca endereço pelo CEP usando a API ViaCEP
 * @param {string} cep - CEP com ou sem formatação
 * @returns {Promise<{logradouro, bairro, cidade, estado}|null>}
 */
export async function buscarCep(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();
    if (data.erro === true || data.erro === 'true') return null;

    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
    };
  } catch {
    return null;
  }
}

/**
 * Formata o CEP enquanto o usuário digita (00000-000)
 * @param {string} value
 * @returns {string}
 */
export function formatarCep(value) {
  const nums = value.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}
