
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Exemplo de estrutura de dados que este script espera.
 * Você pode carregar isso de um arquivo JSON ou colar aqui.
 */
const dataToImport = [
  {
    "Cidade": "Belo Horizonte",
    "Status do Prefeito": "Prefeitura Parceira",
    "Votação Alê": 150000,
    "Votação Lincoln": 120000,
    "IDENE?": "Não",
    "Assessor Resp.": "João Silva",
    "Lincoln Portela fechado?": "Sim",
    "Status de atendimento": "Contemplado",
    "Tipo de atendimento": "Recurso Federal",
    "Principal Demanda": "Saúde e Infraestrutura",
    "Sugestão de Programa SEDESE": "Ponte para o Futuro",
    "OBSERVAÇÃO": "Liderança local muito forte."
  }
];

async function importData() {
  console.log('--- Iniciando Importação de Dados ---');

  // 1. Buscar todos os assessores para mapear nomes
  const { data: assessores } = await supabase.from('assessores').select('id, nome');
  const assessorMap = {};
  assessores?.forEach(a => assessorMap[a.nome] = a.id);

  for (const row of dataToImport) {
    console.log(`Processando: ${row.Cidade}...`);

    // Busca o ID do município pelo nome
    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .ilike('nome', row.Cidade)
      .single();

    if (!municipio) {
      console.warn(`Aviso: Município '${row.Cidade}' não encontrado no banco.`);
      continue;
    }

    // Mapeia os dados para o formato do banco
    const updateData = {
      status_prefeito: row["Status do Prefeito"],
      votacao_ale: row["Votação Alê"],
      votacao_lincoln: row["Votação Lincoln"],
      idene: row["IDENE?"] === 'Sim',
      lincoln_fechado: row["Lincoln Portela fechado?"] === 'Sim',
      status_atendimento: row["Status de atendimento"],
      tipo_atendimento: row["Tipo de atendimento"],
      principal_demanda: row["Principal Demanda"],
      sugestao_sedese: row["Sugestao de Programa SEDESE"],
      observacao: row["OBSERVAÇÃO"],
      assessor_id: assessorMap[row["Assessor Resp."]] || null
    };

    const { error } = await supabase
      .from('municipios')
      .update(updateData)
      .eq('id', municipio.id);

    if (error) {
      console.error(`Erro ao atualizar ${row.Cidade}:`, error.message);
    } else {
      console.log(`Sucesso: ${row.Cidade} atualizado.`);
    }
  }

  console.log('--- Importação Concluída ---');
}

importData();
