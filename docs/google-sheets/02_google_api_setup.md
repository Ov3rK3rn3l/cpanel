### 2. Configuração da API Google e Conta de Serviço

    Esta seção descreve como configurar o acesso programático à sua Planilha Google através de uma Conta de Serviço do Google Cloud.

    **Pré-requisitos:**
    *   Uma Conta Google.
    *   Acesso ao [Google Cloud Console](https://console.cloud.google.com/).

    **Passos:**

    1.  **Acesse o Google Cloud Console:**
        *   Navegue até [https://console.cloud.google.com/](https://console.cloud.google.com/) e faça login com sua Conta Google.

    2.  **Selecione ou Crie um Projeto:**
        *   No topo da página, selecione um projeto existente ou clique em "Criar projeto" se for sua primeira vez ou se desejar um projeto dedicado para esta integração. Siga as instruções na tela.

    3.  **Habilite a API do Google Sheets:**
        *   No menu de navegação lateral (ícone de hambúrguer ☰), vá para "APIs e Serviços" > "Biblioteca".
        *   Na barra de pesquisa, digite "Google Sheets API".
        *   Selecione "Google Sheets API" nos resultados da pesquisa.
        *   Clique no botão "Ativar". Se já estiver ativada, você verá "Gerenciar".

    4.  **Crie Credenciais para uma Conta de Serviço:**
        *   Ainda em "APIs e Serviços", vá para "Credenciais".
        *   Clique em "+ CRIAR CREDENCIAIS" no topo da página.
        *   Selecione "Conta de serviço" no menu suspenso.
        *   **Nome da conta de serviço:** Dê um nome descritivo, por exemplo, `painel-sheets-integracao` ou `gerr-botautomacao-sync`. O ID da conta de serviço será gerado automaticamente.
        *   **Descrição da conta de serviço (opcional):** Adicione uma breve descrição, como "Conta para sincronizar dados do painel com a planilha BotAutomacao".
        *   Clique em "CRIAR E CONTINUAR".
        *   **Conceder a esta conta de serviço acesso ao projeto (opcional):** Para esta integração específica, geralmente não são necessárias funções no nível do projeto. Você pode pular esta etapa clicando em "CONTINUAR".
        *   **Conceder aos usuários acesso a esta conta de serviço (opcional):** Pule esta etapa e clique em "CONCLUÍDO".

    5.  **Gere uma Chave JSON para a Conta de Serviço:**
        *   Você será redirecionado para a página de "Credenciais". Encontre a conta de serviço que você acabou de criar na lista de "Contas de serviço".
        *   Clique no endereço de e-mail da conta de serviço.
        *   Vá para a aba "CHAVES".
        *   Clique em "ADICIONAR CHAVE" e selecione "Criar nova chave".
        *   No pop-up "Criar chave privada", selecione o tipo de chave "JSON".
        *   Clique em "CRIAR".
        *   Um arquivo JSON contendo as credenciais da sua conta de serviço será baixado automaticamente para o seu computador. **Este arquivo é sensível e contém informações que concedem acesso à sua planilha. Guarde-o em um local seguro e NUNCA o adicione a repositórios de código públicos ou o exponha no lado do cliente (frontend).**

    Com a chave JSON gerada, o próximo passo é armazená-la de forma segura no Supabase e compartilhar sua planilha com esta conta de serviço.