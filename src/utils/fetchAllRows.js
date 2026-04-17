/**
 * Busca todas as linhas de uma query Supabase contornando o limite padrão de 1000 linhas.
 * @param {Function} builderFn - Função que recebe (from, to) e retorna a query Supabase com .range()
 * @returns {Promise<Array>} Todos os dados concatenados
 */
export async function fetchAllRows(builderFn) {
  const pageSize = 1000;
  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await builderFn(from, from + pageSize - 1);
    if (error) throw error;
    allData = [...allData, ...(data || [])];
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}
