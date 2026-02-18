import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const VALORES_ENTREGA_UNICA_BRUNO = {
  'BC': 12, 'NOVA ESPERANÇA': 15, 'CAMBORIÚ': 20, 'TABULEIRO': 15,
  'MONTE ALEGRE': 15, 'BARRA': 15, 'ESTALEIRO': 25, 'TAQUARAS': 25,
  'LARANJEIRAS': 25, 'ITAJAI': 25, 'ESPINHEIROS': 35, 'PRAIA DOS AMORES': 15,
  'PRAIA BRAVA': 15, 'ITAPEMA': 35, 'NAVEGANTES': 50, 'PENHA': 75,
  'PORTO BELO': 60, 'TIJUCAS': 87, 'PIÇARRAS': 80, 'BOMBINHAS': 90, 'CLINICA': 12
};

const VALORES_NORMAIS_BRUNO = {
  'BC': 7, 'NOVA ESPERANÇA': 9, 'CAMBORIÚ': 14, 'TABULEIRO': 9,
  'MONTE ALEGRE': 9, 'BARRA': 9, 'ESTALEIRO': 14, 'TAQUARAS': 14,
  'LARANJEIRAS': 14, 'ITAJAI': 17, 'ESPINHEIROS': 21, 'PRAIA DOS AMORES': 11.50,
  'PRAIA BRAVA': 11.50, 'ITAPEMA': 25, 'NAVEGANTES': 40, 'PENHA': 50,
  'PORTO BELO': 30, 'TIJUCAS': 50, 'PIÇARRAS': 50, 'BOMBINHAS': 50, 'CLINICA': 7
};

async function corrigirValores() {
  console.log('Buscando ID do Bruno...');

  const { data: bruno } = await supabase
    .from('motoboys')
    .select('id')
    .eq('nome', 'Bruno')
    .single();

  if (!bruno) {
    console.log('Motoboy Bruno não encontrado!');
    return;
  }

  console.log('Bruno ID:', bruno.id);

  // Buscar todas as entregas do Bruno
  const { data: entregas, error } = await supabase
    .from('entregas')
    .select('id, data_entrega, periodo, regiao, valor')
    .eq('motoboy_id', bruno.id)
    .order('data_entrega', { ascending: true });

  if (error) {
    console.error('Erro ao buscar entregas:', error);
    return;
  }

  console.log(`Total de entregas do Bruno: ${entregas.length}\n`);

  // Agrupar por data + período
  const grupos = {};
  for (const entrega of entregas) {
    const chave = `${entrega.data_entrega}|${entrega.periodo}`;
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(entrega);
  }

  let corrigidas = 0;

  for (const [chave, entregasGrupo] of Object.entries(grupos)) {
    const [data, periodo] = chave.split('|');
    const ehUnica = entregasGrupo.length === 1;

    for (const entrega of entregasGrupo) {
      const valorUnico = VALORES_ENTREGA_UNICA_BRUNO[entrega.regiao];
      const valorNormal = VALORES_NORMAIS_BRUNO[entrega.regiao];

      if (!valorUnico || !valorNormal) continue;

      if (!ehUnica && entrega.valor === valorUnico) {
        // Tem mais de 1 entrega no período mas está com valor de entrega única → corrigir para normal
        console.log(`[CORRIGIR] ${data} ${periodo} | Região: ${entrega.regiao} | R$${valorUnico} → R$${valorNormal} (${entregasGrupo.length} entregas no período)`);

        const { error: updateError } = await supabase
          .from('entregas')
          .update({ valor: valorNormal })
          .eq('id', entrega.id);

        if (updateError) {
          console.error(`  ERRO ao atualizar entrega ${entrega.id}:`, updateError);
        } else {
          console.log(`  OK - Entrega ${entrega.id} atualizada`);
          corrigidas++;
        }
      } else if (ehUnica && entrega.valor === valorNormal) {
        // Tem só 1 entrega no período mas está com valor normal → promover para única
        console.log(`[PROMOVER] ${data} ${periodo} | Região: ${entrega.regiao} | R$${valorNormal} → R$${valorUnico} (entrega única)`);

        const { error: updateError } = await supabase
          .from('entregas')
          .update({ valor: valorUnico })
          .eq('id', entrega.id);

        if (updateError) {
          console.error(`  ERRO ao atualizar entrega ${entrega.id}:`, updateError);
        } else {
          console.log(`  OK - Entrega ${entrega.id} atualizada`);
          corrigidas++;
        }
      }
    }
  }

  console.log(`\nTotal de entregas corrigidas: ${corrigidas}`);
}

corrigirValores().catch(console.error);
