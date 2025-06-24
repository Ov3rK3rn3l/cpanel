## Gerenciamento de Membros e Sincronização com Google Sheets

    Este documento descreve as funcionalidades de gerenciamento de membros no painel administrativo e como elas se integram com a planilha Google Sheets "BotAutomacao".

    ### Estrutura de Dados dos Membros (Tabela `members` no Supabase)

    Os seguintes campos são gerenciados para cada membro e são relevantes para a sincronização com a planilha:

    *   `id` (UUID): Identificador único do membro no Supabase (gerado automaticamente).
    *   `user_id` (UUID): ID do usuário Supabase que criou/gerencia o registro (opcional, dependendo da lógica de permissão).
    *   `codinome` (TEXT): Nome/apelido do membro usado na comunidade (anteriormente `discord_nick`). Corresponde à coluna "Codinome 🏷️" na planilha. **Obrigatório.**
    *   `discord_id` (TEXT): ID Discord do membro. Corresponde à coluna "Discord ID 🆔" na planilha. **Obrigatório.**
    *   `ultima_presenca` (DATE): Data da última presença registrada. Corresponde à coluna "última presença📆".
    *   `presencas` (INTEGER): Contagem de presenças. Corresponde à coluna "Presenças ✅".
    *   `penultima_presenca` (DATE): Data da penúltima presença registrada. Corresponde à coluna "Penúltima presença 🚩".
    *   `dias` (INTEGER): Contagem de dias (significado a ser definido pela comunidade, ex: dias no clã). Corresponde à coluna "Dias ⌛".
    *   `status` (TEXT): Status atual do membro (ex: Ativo, Inativo, Recruta). Corresponde à coluna "Status".
    *   `esa` (TEXT): Informação relacionada a ESA. Corresponde à coluna "ESA 🎖️".
    *   `cfo` (TEXT): Informação relacionada a CFO. Corresponde à coluna "CFO 🎖️".
    *   `promover` (TEXT): Informação sobre promoção. Corresponde à coluna "Promover".
    *   `patente_atual` (TEXT): Patente atual do membro. Corresponde à coluna "Patente Atual".
    *   `jogo_principal` (TEXT): Jogo principal do membro (ex: Squad, Arma Reforger). Este campo é gerenciado no painel e pode ou não ser sincronizado com a planilha, dependendo da configuração da Edge Function `sync-members-to-google-sheets`.
    *   `data_ingresso` (DATE): Data em que o membro ingressou na comunidade. Este campo é gerenciado no painel. Pode ser sincronizado com a planilha.
    *   `data_saida` (DATE): Data em que o membro saiu da comunidade. Se preenchido, o membro é considerado inativo/ex-membro.
    *   `created_at` (TIMESTAMPZ): Data de criação do registro no Supabase.
    *   `updated_at` (TIMESTAMPZ): Data da última atualização do registro no Supabase.

    ### Funcionalidades no Painel

    1.  **Listagem de Membros Ativos:**
        *   A tabela principal exibe apenas membros que **não possuem** uma `data_saida` preenchida.
        *   As colunas exibidas são: Codinome, Discord ID, Última Presença, Presenças, Status, Patente Atual e Ações. Outras colunas podem ser visíveis em telas maiores.

    2.  **Adicionar Novo Membro:**
        *   O botão "Adicionar Membro" abre um formulário (`MemberFormDialog`).
        *   O formulário inclui campos para todas as informações relevantes listadas acima (Codinome, Discord ID, Última Presença, etc., incluindo Jogo Principal e Data de Ingresso).
        *   Ao submeter, um novo registro é criado na tabela `members` do Supabase.

    3.  **Editar Membro Existente:**
        *   O botão "Editar" (ícone de lápis) na tabela de membros abre o mesmo formulário (`MemberFormDialog`), pré-preenchido com os dados do membro selecionado.
        *   Ao submeter, o registro do membro existente é atualizado na tabela `members`.

    4.  **Registrar Saída de Membro:**
        *   O botão "Registrar Saída" (ícone de `UserX`) na tabela de membros abre um diálogo de confirmação.
        *   Ao confirmar, o campo `data_saida` do membro é preenchido com a data atual e o `status` é atualizado para "Saiu" (ou similar).
        *   O membro **não é excluído** do banco de dados, permitindo um histórico. Ele apenas deixa de ser listado como ativo.
        *   Membros com `data_saida` preenchida não são exibidos na lista principal de membros ativos.

    5.  **Busca/Filtragem:**
        *   Um campo de busca permite filtrar a lista de membros ativos por: Codinome, Discord ID, Jogo Principal, Status ou Patente Atual.

    ### Sincronização com Google Sheets ("BotAutomacao")

    A integração com a planilha Google Sheets é realizada através de duas Supabase Edge Functions:

    1.  **`load-members-from-google-sheets` (Carregar do Sheets):**
        *   **Ação:** Lê todos os dados da aba "BotAutomacao" da planilha configurada.
        *   **Mapeamento:** Converte os dados lidos da planilha para o formato da tabela `members` do Supabase, usando o `columnMappingFromSheetToSupabase` definido na Edge Function.
        *   **Operação no Supabase:** Realiza um "upsert" na tabela `members` baseado no `discord_id`. Isso significa que:
            *   Se um membro da planilha (com um `discord_id` específico) já existe no Supabase, seus dados são atualizados com as informações da planilha.
            *   Se um membro da planilha não existe no Supabase, um novo registro é criado.
        *   **Fonte da Verdade (para esta operação):** A planilha é considerada a fonte da verdade. Os dados do Supabase são sobrescritos/criados com base no que está na planilha.
        *   **Impacto no Frontend:** Após a execução, o frontend recarrega a lista de membros do Supabase.

    2.  **`sync-members-to-google-sheets` (Sincronizar para Sheets):**
        *   **Ação:** Envia os dados dos membros ativos (sem `data_saida`) do painel (Supabase) para a planilha "BotAutomacao".
        *   **Operação na Planilha:**
            *   Primeiro, limpa todas as linhas da planilha abaixo da linha de cabeçalho (geralmente da linha 2 em diante).
            *   Depois, preenche a planilha com os dados atuais dos membros ativos do Supabase.
        *   **Mapeamento:** Converte os dados da tabela `members` para o formato esperado pela planilha, seguindo a ordem de colunas definida em `sheetHeadersInOrder` e usando `supabaseFieldToSheetHeaderMap` na Edge Function.
        *   **Fonte da Verdade (para esta operação):** O painel/Supabase é considerado a fonte da verdade. A planilha é sobrescrita para refletir o estado atual do Supabase.
        *   **Impacto no Frontend:** Nenhuma alteração direta nos dados do frontend, apenas uma notificação de sucesso/falha.

    **Importante sobre `data_ingresso` e `jogo_principal` na Sincronização:**
    *   Ao **carregar da planilha** (`load-members-from-google-sheets`): Se as colunas correspondentes a `data_ingresso` e `jogo_principal` não existirem ou não estiverem mapeadas na Edge Function, esses campos no Supabase não serão alterados por esta operação (a menos que seja um novo membro, onde `data_ingresso` pode precisar de um valor padrão se for `NOT NULL`).
    *   Ao **sincronizar para a planilha** (`sync-members-to-google-sheets`): Se `data_ingresso` e `jogo_principal` estiverem incluídos no mapeamento `supabaseFieldToSheetHeaderMap` e nos `sheetHeadersInOrder` da Edge Function, seus valores serão escritos na planilha. Caso contrário, as colunas correspondentes na planilha ficarão vazias ou com os dados antigos.

    Consulte os arquivos de documentação específicos do Google Sheets (`docs/google-sheets/`) para detalhes técnicos sobre a configuração das Edge Functions e da API do Google.