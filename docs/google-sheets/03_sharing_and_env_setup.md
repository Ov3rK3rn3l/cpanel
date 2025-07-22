### 3. Compartilhamento da Planilha e Configuração de Variáveis

    #### Armazenar a Chave da Conta de Serviço no Supabase

    O conteúdo do arquivo JSON da Conta de Serviço precisa ser armazenado como um segredo no seu projeto Supabase.

    1.  **Acesse o Painel do Supabase:** Vá para [app.supabase.com](https://app.supabase.com/) e selecione seu projeto.
    2.  **Navegue até Edge Functions:** No menu lateral, vá para "Edge Functions" (ícone de raio).
    3.  **Adicione um Novo Segredo:**
        *   Clique em "+ Add new secret".
        *   **Nome (Name):** `GOOGLE_SERVICE_ACCOUNT_KEY` (este nome é usado nas Edge Functions de exemplo).
        *   **Valor (Value):** Abra o arquivo JSON que você baixou do Google Cloud Console, copie TODO o seu conteúdo e cole-o neste campo.
        *   Clique em "Create secret".

    #### Compartilhar sua Planilha Google com a Conta de Serviço

    Para que a Conta de Serviço possa ler e escrever na sua planilha, você precisa conceder permissão a ela.

    1.  **Abra sua Planilha Google:** Navegue até a planilha que você deseja usar (aquela com a aba "BotAutomacao").
    2.  **Copie o Email da Conta de Serviço:**
        *   Volte ao Google Cloud Console > "APIs e Serviços" > "Credenciais".
        *   Encontre a conta de serviço criada e copie o endereço de e-mail dela (algo como `nome-da-conta@seu-projeto-id.iam.gserviceaccount.com`).
    3.  **Compartilhe a Planilha:**
        *   Na sua Planilha Google, clique no botão "Compartilhar" (geralmente no canto superior direito).
        *   No campo "Adicionar pessoas e grupos", cole o endereço de e-mail da Conta de Serviço.
        *   Certifique-se de que a permissão concedida seja "Editor" (para permitir leitura e escrita).
        *   Desmarque a opção "Notificar pessoas" (opcional, mas geralmente não é necessário para contas de serviço).
        *   Clique em "Compartilhar" ou "Salvar".

    #### Configurar Variáveis de Ambiente no Frontend (Opcional, mas Recomendado)

    Para facilitar a referência ao ID da sua planilha e ao nome da aba no código do frontend, você pode defini-los como variáveis de ambiente.

    1.  **Crie ou Edite o arquivo `.env` na raiz do seu projeto React/Vite:**
        Se o arquivo não existir, crie-o. Adicione ou modifique as seguintes linhas:

        ```env
        VITE_SUPABASE_URL="https://uoeuxfitxeaahppzoptk.supabase.co"
        VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXV4Zml0eGVhYWhwcHpvcHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTU2MDUsImV4cCI6MjA2MzE5MTYwNX0.HvGhSSVgtolZ6U9V-hek9bSR50PEclLJk6opNBq7494"

        # Adicione estas para a integração com Google Sheets:
        VITE_GOOGLE_SPREADSHEET_ID="SEU_SPREADSHEET_ID_AQUI"
        VITE_GOOGLE_SHEET_NAME="BotAutomacao"
        ```

    2.  **Obtenha o ID da Planilha (SPREADSHEET_ID):**
        *   Abra sua Planilha Google.
        *   Olhe para a URL no seu navegador. Ela terá um formato como:
            `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_AQUI/edit#gid=0`
        *   Copie a longa string de caracteres que representa o `SPREADSHEET_ID_AQUI`.
        *   Substitua `"SEU_SPREADSHEET_ID_AQUI"` no arquivo `.env` pelo ID real.

    3.  **Nome da Aba (SHEET_NAME):**
        *   O `VITE_GOOGLE_SHEET_NAME` já está definido como `"BotAutomacao"` conforme sua especificação. Se o nome da sua aba for diferente, ajuste-o aqui.

    **Importante:** Após adicionar ou modificar o arquivo `.env`, você precisará reiniciar seu servidor de desenvolvimento Vite para que as novas variáveis de ambiente sejam carregadas.

    **Alternativa:** Em vez de usar variáveis de ambiente no frontend para `spreadsheetId` e `sheetName`, você pode passá-los diretamente no corpo da requisição ao invocar as Edge Functions. Isso pode ser considerado mais seguro se você preferir não expor esses IDs no código do cliente, embora o ID da planilha e o nome da aba geralmente não sejam considerados segredos críticos como a chave da conta de serviço.