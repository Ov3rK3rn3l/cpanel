### `load-members-from-google-sheets`

    Esta função carrega dados de membros de uma Google Sheet específica para a tabela `members` no Supabase.

    **Objetivo:** Sincronizar a lista de membros da planilha para o banco de dados da aplicação, atualizando registros existentes e inserindo novos, aplicando lógica de promoção e presença.

    **Endpoint:** `/functions/v1/load-members-from-google-sheets`
    **Método HTTP:** `POST`

    **Corpo da Requisição (Request Body - Exemplo JSON):**
    ```json
    {
      "spreadsheetId": "YOUR_SPREADSHEET_ID",
      "sheetName": "BotAutomacao"
    }
    ```

    **Lógica Principal da Edge Function:**

    1.  **Autenticação e Setup do Google Sheets API:**
        *   Obtém as credenciais da conta de serviço do Google a partir de um segredo Supabase (`GOOGLE_SERVICE_ACCOUNT_KEY`).
        *   Inicializa o cliente Google Sheets API.

    2.  **Busca de Dados da Planilha:**
        *   Lê os dados da aba especificada (`sheetName`) da planilha (`spreadsheetId`).
        *   Assume que a primeira linha contém os cabeçalhos das colunas.

    3.  **Mapeamento de Colunas (Planilha para Supabase):**
        *   Define um mapa para converter nomes de colunas da planilha para os nomes de campos da tabela `members` no Supabase.
            *   `'Codinome 🏷️'`: `codinome`
            *   `'Discord ID 🆔'`: `discord_id` (chave primária para correspondência)
            *   `'última presença📆'`: `ultima_presenca` (converter para formato YYYY-MM-DD)
            *   `'Presenças ✅'`: `total_presencas` (converter para número inteiro)
            *   `'Penúltima presença 🚩'`: `penultima_presenca` (converter para formato YYYY-MM-DD)
            *   `'Dias ⌛'`: `dias_inatividade_sheet` (campo opcional, se quiser guardar o valor da planilha, senão é calculado no front)
            *   `'Status'`: `status`
            *   `'ESA 🎖️'`: `esa` (Normalizar para "Sim" ou "Nao" ou null)
            *   `'CFO 🎖️'`: `cfo` (Normalizar para "Sim" ou "Nao" ou null)
            *   `'Promover'`: `promocao_sugerida_sheet` (campo opcional, se quiser guardar valor da planilha)
            *   `'Patente Atual'`: `patente_atual`

    4.  **Processamento de Cada Linha da Planilha:**
        *   Para cada membro na planilha:
            *   Busca no Supabase um membro existente com o mesmo `discord_id`.
            *   **Se o membro existir no Supabase:**
                *   Compara a `ultima_presenca` da planilha com a `ultima_presenca` do banco.
                *   **Se a `ultima_presenca` da planilha for mais recente:**
                    *   A `ultima_presenca` atual do banco se torna a `penultima_presenca`.
                    *   A `ultima_presenca` da planilha se torna a nova `ultima_presenca`.
                    *   Verifica as condições para incremento de `total_presencas` (do Supabase):
                        *   Se `total_presencas` < 55 OU (`total_presencas` >= 55 E `esa` do membro no Supabase/planilha === "Sim").
                        *   E se `total_presencas` < 120 OU (`total_presencas` >= 120 E `cfo` do membro no Supabase/planilha === "Sim").
                        *   Se ambas as condições forem verdadeiras, incrementa `total_presencas` do Supabase. Caso contrário, mantém o valor do Supabase.
                        *   **Importante**: A coluna `Presenças ✅` (D) da planilha, se representar o total de presenças já contabilizado pela automação da planilha, deve ser usada para atualizar `total_presencas` no Supabase, respeitando os bloqueios de ESA/CFO. Ou seja, se `Presenças ✅` da planilha for maior que o `total_presencas` atual do Supabase, atualize `total_presencas` para o valor da planilha, mas não ultrapasse os limites de 55/120 se ESA/CFO não estiverem "Sim".
                *   Atualiza os outros campos do membro no Supabase com os dados da planilha (codinome, status, esa, cfo, patente_atual, etc.).
            *   **Se o membro não existir no Supabase:**
                *   Insere um novo registro na tabela `members` com os dados da planilha.
                *   `total_presencas` é o valor da coluna `Presenças ✅`.
                *   `ultima_presenca` e `penultima_presenca` conforme a planilha.

    5.  **Tratamento de Datas:**
        *   Converte as datas dos campos `ultima_presenca` e `penultima_presenca` para o formato `YYYY-MM-DD` antes de salvar no Supabase. Se a planilha usar formato DD/MM/YYYY, a conversão é necessária. Se a planilha já tiver datas em formato ISO ou compatível, pode ser mais direto.

    6.  **Normalização de Dados:**
        *   Para campos como `esa` e `cfo`, normaliza os valores (ex: "SIM", "sim", "S" para "Sim"; "NÃO", "nao", "N" para "Nao"; vazio ou outros para `null` ou "Nao Definido").

    7.  **Log de Ações:**
        *   Registra na tabela `action_logs` cada membro atualizado ou inserido.

    8.  **Resposta:**
        *   Retorna uma mensagem de sucesso com a contagem de membros processados (atualizados/inseridos) ou uma mensagem de erro detalhada.

    **Exemplo de Código (TypeScript - Deno):**
    ```typescript
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
    import { google } from 'npm:googleapis@134'; // Certifique-se que a versão é compatível

    const defaultHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Função para converter data DD/MM/YYYY para YYYY-MM-DD
    function convertDateToYyyyMmDd(dateString) {
      if (!dateString || typeof dateString !== 'string') return null;
      const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (parts) {
        const day = parts[1].padStart(2, '0');
        const month = parts[2].padStart(2, '0');
        const year = parts[3];
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return `${year}-${month}-${day}`;
        }
      }
      // Tenta interpretar como YYYY-MM-DD ou outros formatos que o Date constructor entenda
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return null;
    }

    function normalizeYesNo(value) {
      if (!value || typeof value !== 'string') return null; // Ou "Nao Definido"
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'sim' || lowerValue === 's') return 'Sim';
      if (lowerValue === 'não' || lowerValue === 'nao' || lowerValue === 'n') return 'Nao';
      return null; // Ou "Nao Definido"
    }


    serve(async (req) => {
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: defaultHeaders });
      }

      try {
        const { spreadsheetId, sheetName } = await req.json();
        if (!spreadsheetId || !sheetName) {
          throw new Error("Spreadsheet ID e Sheet Name são obrigatórios.");
        }

        const serviceAccountKey = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')!);
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccountKey.client_email,
            private_key: serviceAccountKey.private_key,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A:K`, // Ajuste o range conforme necessário
        });
        const rows = response.data.values;

        if (!rows || rows.length === 0) {
          return new Response(JSON.stringify({ message: "Nenhum dado encontrado na planilha." }), {
            headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const headers = rows[0].map(h => h.trim());
        const dataRows = rows.slice(1);
        let updatedCount = 0;
        let insertedCount = 0;
        const errorsDetails = [];

        const columnMapping = {
          'Codinome 🏷️': 'codinome',
          'Discord ID 🆔': 'discord_id',
          'última presença📆': 'ultima_presenca',
          'Presenças ✅': 'total_presencas_sheet', // Ler valor da planilha
          'Penúltima presença 🚩': 'penultima_presenca',
          'Dias ⌛': 'dias_inatividade_sheet', // Opcional
          'Status': 'status',
          'ESA 🎖️': 'esa',
          'CFO 🎖️': 'cfo',
          'Promover': 'promocao_sugerida_sheet', // Opcional
          'Patente Atual': 'patente_atual',
        };

        for (const row of dataRows) {
          const memberSheetData = {};
          headers.forEach((header, index) => {
            const supabaseField = columnMapping[header];
            if (supabaseField) {
              let value = row[index];
              if (supabaseField === 'ultima_presenca' || supabaseField === 'penultima_presenca') {
                value = convertDateToYyyyMmDd(value);
              } else if (supabaseField === 'total_presencas_sheet') {
                value = value ? parseInt(value, 10) : 0;
                if (isNaN(value)) value = 0;
              } else if (supabaseField === 'esa' || supabaseField === 'cfo') {
                value = normalizeYesNo(value);
              }
              memberSheetData[supabaseField] = value;
            }
          });

          if (!memberSheetData.discord_id) {
            errorsDetails.push(`Linha sem Discord ID: ${JSON.stringify(row)}`);
            continue;
          }

          const { data: existingMember, error: fetchError } = await supabaseAdmin
            .from('members')
            .select('id, ultima_presenca, total_presencas, esa, cfo, penultima_presenca')
            .eq('discord_id', memberSheetData.discord_id)
            .maybeSingle();

          if (fetchError) {
            errorsDetails.push(`Erro ao buscar membro ${memberSheetData.discord_id}: ${fetchError.message}`);
            continue;
          }
          
          const memberDataForSupabase = {
            codinome: memberSheetData.codinome,
            discord_id: memberSheetData.discord_id,
            status: memberSheetData.status,
            esa: memberSheetData.esa,
            cfo: memberSheetData.cfo,
            patente_atual: memberSheetData.patente_atual,
            // campos opcionais da planilha
            // promocao_sugerida: memberSheetData.promocao_sugerida_sheet,
            // dias_inatividade: memberSheetData.dias_inatividade_sheet,
          };

          let newTotalPresencas = existingMember ? existingMember.total_presencas : 0;
          let newUltimaPresenca = existingMember ? existingMember.ultima_presenca : null;
          let newPenultimaPresenca = existingMember ? existingMember.penultima_presenca : null;


          // Lógica de atualização de presença
          const sheetUltimaPresenca = memberSheetData.ultima_presenca ? new Date(memberSheetData.ultima_presenca) : null;
          const dbUltimaPresenca = existingMember?.ultima_presenca ? new Date(existingMember.ultima_presenca) : null;

          if (sheetUltimaPresenca && (!dbUltimaPresenca || sheetUltimaPresenca > dbUltimaPresenca)) {
            newPenultimaPresenca = existingMember?.ultima_presenca || memberSheetData.penultima_presenca || null; // Penúltima da planilha se não houver no DB
            newUltimaPresenca = memberSheetData.ultima_presenca;

            // Condições para incrementar presença
            const canIncrementESA = existingMember ? (existingMember.total_presencas < 55 || (existingMember.total_presencas >= 55 && (memberSheetData.esa === 'Sim' || existingMember.esa === 'Sim'))) : (0 < 55 || (0 >= 55 && memberSheetData.esa === 'Sim'));
            const canIncrementCFO = existingMember ? (existingMember.total_presencas < 120 || (existingMember.total_presencas >= 120 && (memberSheetData.cfo === 'Sim' || existingMember.cfo === 'Sim'))) : (0 < 120 || (0 >= 120 && memberSheetData.cfo === 'Sim'));

            if (canIncrementESA && canIncrementCFO) {
              // A coluna "Presenças ✅" da planilha (total_presencas_sheet) é a fonte da verdade.
              // Atualize o total de presenças no Supabase com o valor da planilha, respeitando as travas.
              let targetPresencas = memberSheetData.total_presencas_sheet;

              if (targetPresencas >= 55 && !(memberSheetData.esa === 'Sim' || existingMember?.esa === 'Sim')) {
                 // Se já tem mais de 55 e não tem ESA, trava em 54 ou no valor atual se for menor.
                 targetPresencas = Math.min(targetPresencas, existingMember ? Math.max(existingMember.total_presencas, 54) : 54);
              }
              if (targetPresencas >= 120 && !(memberSheetData.cfo === 'Sim' || existingMember?.cfo === 'Sim')) {
                // Se já tem mais de 120 e não tem CFO, trava em 119 ou no valor atual se for menor.
                targetPresencas = Math.min(targetPresencas, existingMember ? Math.max(existingMember.total_presencas, 119) : 119);
              }
              newTotalPresencas = targetPresencas;

            } else {
              // Se não pode incrementar, mantém o total de presenças do banco, mas atualiza datas
              newTotalPresencas = existingMember?.total_presencas || 0;
            }
          } else { // Se a data da planilha não for mais nova, ou não existir
             newTotalPresencas = memberSheetData.total_presencas_sheet !== undefined ? memberSheetData.total_presencas_sheet : (existingMember?.total_presencas || 0);
             newUltimaPresenca = memberSheetData.ultima_presenca || existingMember?.ultima_presenca || null;
             newPenultimaPresenca = memberSheetData.penultima_presenca || existingMember?.penultima_presenca || null;
          }


          memberDataForSupabase.ultima_presenca = newUltimaPresenca;
          memberDataForSupabase.penultima_presenca = newPenultimaPresenca;
          memberDataForSupabase.total_presencas = newTotalPresencas;


          if (existingMember) {
            const { error: updateError } = await supabaseAdmin
              .from('members')
              .update(memberDataForSupabase)
              .eq('id', existingMember.id);
            if (updateError) errorsDetails.push(`Erro ao atualizar ${memberSheetData.discord_id}: ${updateError.message}`);
            else updatedCount++;
          } else {
             // Necessário adicionar user_id se for uma FK para auth.users
             // memberDataForSupabase.user_id = SOME_LOGIC_TO_FIND_OR_CREATE_AUTH_USER_ID; 
            const { error: insertError } = await supabaseAdmin
              .from('members')
              .insert(memberDataForSupabase);
            if (insertError) errorsDetails.push(`Erro ao inserir ${memberSheetData.discord_id}: ${insertError.message}`);
            else insertedCount++;
          }
        }

        const summaryMessage = `Carregamento concluído. ${insertedCount} membros inseridos, ${updatedCount} membros atualizados.`;
        if (errorsDetails.length > 0) {
          console.error("Erros durante o carregamento:", errorsDetails);
          return new Response(JSON.stringify({ 
              message: `${summaryMessage} Alguns erros ocorreram.`,
              details: errorsDetails 
            }), {
            headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
            status: 207, // Multi-Status
          });
        }

        return new Response(JSON.stringify({ message: summaryMessage }), {
          headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        console.error("Erro na Edge Function load-members-from-google-sheets:", error);
        return new Response(JSON.stringify({ error: error.message, details: error.stack }), {
          headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    });
    ```

    **Considerações Importantes:**
    *   **Performance:** Para planilhas muito grandes, o processamento linha a linha pode ser lento. Considere otimizações como processamento em lote (batch-upsert) se a performance se tornar um problema.
    *   **Tratamento de Erros:** A lógica de tratamento de erros deve ser robusta para lidar com dados inconsistentes na planilha.
    *   **Segurança:** A chave de serviço (`SUPABASE_SERVICE_ROLE_KEY`) usada nesta função tem privilégios administrativos. Use com cautela.
    *   **Associação com `auth.users`:** Se a tabela `members` precisa ser associada à tabela `auth.users` (via `user_id`), a Edge Function precisará de uma lógica para encontrar ou criar o usuário correspondente em `auth.users` (por exemplo, usando o email ou Discord ID, se únicos). Isso adiciona complexidade e pode exigir chamadas adicionais ao Supabase. A lógica atual não implementa isso.
    *   **Conflitos de Discord ID:** A função assume que `discord_id` é um identificador único confiável.

    ---

    ### `sync-members-to-google-sheets`

    Esta função sincroniza dados de membros da tabela `members` do Supabase para uma Google Sheet específica.

    **Objetivo:** Manter a planilha atualizada com os dados mais recentes da aplicação.

    **Endpoint:** `/functions/v1/sync-members-to-google-sheets`
    **Método HTTP:** `POST`

    **Corpo da Requisição (Request Body - Exemplo JSON):**
    ```json
    {
      "members": [/* array de objetos de membros do Supabase */],
      "spreadsheetId": "YOUR_SPREADSHEET_ID",
      "sheetName": "BotAutomacao" 
    }
    ```
    Se o array `members` não for fornecido, a função deve buscar todos os membros ativos da tabela `members`.

    **Lógica Principal da Edge Function:**

    1.  **Autenticação e Setup do Google Sheets API:** Similar à função `load-members-from-google-sheets`.
    2.  **Busca de Dados do Supabase (Opcional):** Se o array `members` não for fornecido no corpo da requisição, busca todos os membros da tabela `members` no Supabase.
    3.  **Formatação dos Dados para a Planilha:**
        *   Define a ordem das colunas esperada na planilha.
        *   Mapeia os campos dos objetos de membros para a ordem correta das colunas.
        *   Converte datas para um formato legível (ex: DD/MM/YYYY) se necessário.
    4.  **Limpeza da Planilha (Opcional):** Antes de escrever os novos dados, pode ser útil limpar a aba (exceto a linha de cabeçalho) para evitar dados duplicados ou desatualizados.
    5.  **Escrita dos Dados na Planilha:**
        *   Usa a API do Google Sheets para escrever os dados formatados na aba especificada.
    6.  **Resposta:** Retorna uma mensagem de sucesso ou erro.

    **Exemplo de Código (TypeScript - Deno):**
    ```typescript
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
    import { google } from 'npm:googleapis@134';

    const defaultHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Função para formatar data YYYY-MM-DD para DD/MM/YYYY ou manter como está se for string
    function formatDateForSheet(dateString) {
      if (!dateString) return '';
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString; // Retorna como está se não for YYYY-MM-DD
    }

    serve(async (req) => {
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: defaultHeaders });
      }

      try {
        let { members, spreadsheetId, sheetName } = await req.json();
        
        if (!spreadsheetId || !sheetName) {
          throw new Error("Spreadsheet ID e Sheet Name são obrigatórios.");
        }

        const serviceAccountKey = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')!);
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        if (!members || members.length === 0) {
            const { data: fetchedMembers, error: fetchError } = await supabaseAdmin
                .from('members')
                .select('*')
                .is('data_saida', null) // Apenas membros ativos
                .order('codinome', { ascending: true });
            if (fetchError) throw fetchError;
            members = fetchedMembers || [];
        }


        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccountKey.client_email,
            private_key: serviceAccountKey.private_key,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        // Ordem das colunas conforme especificado pelo usuário
        const sheetHeaders = [
          'Codinome 🏷️', 'Discord ID 🆔', 'última presença📆', 'Presenças ✅',
          'Penúltima presença 🚩', 'Dias ⌛', 'Status', 'ESA 🎖️', 'CFO 🎖️',
          'Promover', 'Patente Atual'
        ];
        
        const valuesToWrite = [sheetHeaders]; // Começa com os cabeçalhos

        for (const member of members) {
          const row = [
            member.codinome || '',
            member.discord_id || '',
            formatDateForSheet(member.ultima_presenca),
            member.total_presencas !== null && member.total_presencas !== undefined ? member.total_presencas : '', // Campo D
            formatDateForSheet(member.penultima_presenca),
            member.dias_inatividade_sheet !== null && member.dias_inatividade_sheet !== undefined ? member.dias_inatividade_sheet : '', // Campo F (se vier da planilha)
            member.status || '',
            member.esa || '',
            member.cfo || '',
            member.promocao_sugerida_sheet || '', // Campo J (se vier da planilha)
            member.patente_atual || '',
          ];
          valuesToWrite.push(row);
        }

        // Limpar a planilha (exceto cabeçalhos, se preferir, ajustando o range)
        await sheets.spreadsheets.values.clear({
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A1:K`, // Limpa da linha 1 em diante, colunas A até K
        });

        // Escrever os novos dados
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A1`, // Começa a escrever da célula A1
          valueInputOption: 'USER_ENTERED', // ou 'RAW'
          requestBody: {
            values: valuesToWrite,
          },
        });

        return new Response(JSON.stringify({ message: `Sincronização com Google Sheets concluída. ${members.length} membros enviados.` }), {
          headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        console.error("Erro na Edge Function sync-members-to-google-sheets:", error);
        return new Response(JSON.stringify({ error: error.message, details: error.stack }), {
          headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    });
    ```

    Este exemplo sincroniza os dados substituindo o conteúdo existente na aba. Ajustes podem ser necessários dependendo do comportamento desejado (ex: apenas adicionar novas linhas, atualizar linhas existentes por ID, etc.).