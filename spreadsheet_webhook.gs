/**
 * SCRIPT PARA GOOGLE SHEETS - PORTELA HUB
 * 
 * Instruções:
 * 1. No seu Google Sheets, vá em Extensões > Apps Script.
 * 2. Apague tudo e cole este código.
 * 3. Substitua as constantes SUPABASE_URL e SUPABASE_KEY pelos valores do seu .env.local.
 * 4. Salve e clique em "onOpen" para rodar e criar o menu no Sheets.
 */

const SUPABASE_URL = "https://hmbyicviwrrayhztzkch.supabase.co";
const SUPABASE_KEY = "SUA_SERVICE_ROLE_KEY_AQUI"; // Use a Service Role Key para permissão de escrita

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Portela Hub')
      .addItem('Sincronizar Agora', 'syncToSupabase')
      .addToUi();
}

async function syncToSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Sincronizar', 'Deseja enviar os dados da planilha para o Portela Hub?', ui.ButtonSet.YES_NO);
  
  if (response !== ui.Button.YES) return;

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });
    rows.push(row);
  }

  ui.showModelessDialog(HtmlService.createHtmlOutput('Sincronizando... aguarde.'), 'Status');

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    if (!row["Cidade"]) continue;

    try {
      // 1. Buscar ID do Município
      const searchUrl = `${SUPABASE_URL}/rest/v1/municipios?nome=ilike.${encodeURIComponent(row["Cidade"])}&select=id`;
      const searchRes = UrlFetchApp.fetch(searchUrl, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const munData = JSON.parse(searchRes.getContentText());

      if (munData && munData.length > 0) {
        const munId = munData[0].id;
        
        // 2. Preparar Dados de Update
        const updateBody = {
          status_prefeito: row["Status do Prefeito"] || null,
          votacao_ale: parseInt(row["Votação Alê"]) || 0,
          votacao_lincoln: parseInt(row["Votação Lincoln"]) || 0,
          idene: String(row["IDENE?"]).toLowerCase() === 'sim',
          lincoln_fechado: String(row["Lincoln Portela fechado?"]).toLowerCase() === 'sim',
          status_atendimento: row["Status de atendimento"] || null,
          tipo_atendimento: row["Tipo de atendimento"] || null,
          principal_demanda: row["Principal Demanda"] || null,
          sugestao_sedese: row["Sugestão de Programa SEDESE"] || null,
          observacao: row["OBSERVAÇÃO"] || null
        };

        // 3. Update no Supabase
        const updateUrl = `${SUPABASE_URL}/rest/v1/municipios?id=eq.${munId}`;
        UrlFetchApp.fetch(updateUrl, {
          method: "PATCH",
          headers: { 
            "apikey": SUPABASE_KEY, 
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          payload: JSON.stringify(updateBody)
        });
        successCount++;
      } else {
        errorCount++;
      }
    } catch (e) {
      console.error(e);
      errorCount++;
    }
  }

  ui.alert('Fim da Sincronização', `✅ Sucesso: ${successCount}\n❌ Não encontrados: ${errorCount}`, ui.ButtonSet.OK);
}
