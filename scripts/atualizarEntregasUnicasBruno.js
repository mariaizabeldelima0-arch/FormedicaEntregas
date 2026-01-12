// Script para atualizar entregas únicas do Bruno
// Cole este código no console do navegador (F12 > Console) enquanto estiver no site

const VALORES_ENTREGA_UNICA_BRUNO = {
  'BC': 12,
  'NOVA ESPERANÇA': 15,
  'CAMBORIÚ': 20,
  'TABULEIRO': 15,
  'MONTE ALEGRE': 15,
  'BARRA': 15,
  'ESTALEIRO': 25,
  'TAQUARAS': 25,
  'LARANJEIRAS': 25,
  'ITAJAI': 25,
  'ESPINHEIROS': 35,
  'PRAIA DOS AMORES': 15,
  'PRAIA BRAVA': 15,
  'ITAPEMA': 35,
  'NAVEGANTES': 50,
  'PENHA': 75,
  'PORTO BELO': 60,
  'TIJUCAS': 87,
  'PIÇARRAS': 80,
  'BOMBINHAS': 90,
  'CLINICA': 12
};

(async function atualizarEntregasUnicasBruno() {
  // Importar supabase diretamente
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

  // Credenciais do .env
  const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbmJreW1wcWh0Z2ZvdHJtZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzAxNzcsImV4cCI6MjA4MTE0NjE3N30.2uhxv75YfnO_eqsCR_-r2v78S-fe_sWAYp6vKOUrWm0';

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Buscar ID do Bruno
  const { data: bruno } = await supabase
    .from('motoboys')
    .select('id')
    .eq('nome', 'Bruno')
    .single();

  if (!bruno) {
    console.error('Bruno não encontrado!');
    return;
  }

  console.log('Bruno ID:', bruno.id);

  // 2. Buscar todas as entregas do Bruno
  const { data: entregas } = await supabase
    .from('entregas')
    .select('id, data_entrega, periodo, regiao, valor_entrega')
    .eq('motoboy_id', bruno.id)
    .order('data_entrega', { ascending: false });

  console.log(`Total de entregas do Bruno: ${entregas.length}`);

  // 3. Agrupar por data
  const entregasPorData = {};
  entregas.forEach(e => {
    if (!entregasPorData[e.data_entrega]) {
      entregasPorData[e.data_entrega] = { manha: [], tarde: [] };
    }
    if (e.periodo === 'Manhã') {
      entregasPorData[e.data_entrega].manha.push(e);
    } else if (e.periodo === 'Tarde') {
      entregasPorData[e.data_entrega].tarde.push(e);
    }
  });

  // 4. Identificar datas com entregas únicas em AMBOS os períodos
  const entregasParaAtualizar = [];

  for (const [data, periodos] of Object.entries(entregasPorData)) {
    if (periodos.manha.length === 1 && periodos.tarde.length === 1) {
      // Tem exatamente 1 entrega de manhã E 1 de tarde
      entregasParaAtualizar.push(...periodos.manha);
      entregasParaAtualizar.push(...periodos.tarde);
      console.log(`Data ${data}: ✅ Entregas únicas em ambos períodos`);
    }
  }

  console.log(`\nTotal de entregas para atualizar: ${entregasParaAtualizar.length}`);

  // 5. Atualizar os valores
  let atualizadas = 0;
  let erros = 0;

  for (const entrega of entregasParaAtualizar) {
    const novoValor = VALORES_ENTREGA_UNICA_BRUNO[entrega.regiao];

    if (!novoValor) {
      console.warn(`Região não encontrada: ${entrega.regiao}`);
      continue;
    }

    if (entrega.valor_entrega === novoValor) {
      console.log(`Entrega ${entrega.id} (${entrega.data_entrega} ${entrega.periodo}): já tem o valor correto (R$${novoValor})`);
      continue;
    }

    const { error } = await supabase
      .from('entregas')
      .update({ valor_entrega: novoValor })
      .eq('id', entrega.id);

    if (error) {
      console.error(`Erro ao atualizar entrega ${entrega.id}:`, error);
      erros++;
    } else {
      console.log(`Entrega ${entrega.id} (${entrega.data_entrega} ${entrega.periodo} - ${entrega.regiao}): R$${entrega.valor_entrega} → R$${novoValor}`);
      atualizadas++;
    }
  }

  console.log(`\n========== RESUMO ==========`);
  console.log(`Entregas atualizadas: ${atualizadas}`);
  console.log(`Erros: ${erros}`);
  console.log(`============================`);
})();
