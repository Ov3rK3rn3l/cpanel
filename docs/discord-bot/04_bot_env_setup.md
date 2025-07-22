```markdown
# Guia Bot Discord: Configuração do `.env` do Bot

O arquivo `.env` na raiz do projeto do seu bot (`gerr-discord-bot/.env`) é crucial para armazenar configurações e segredos de forma segura, sem enviá-los para o controle de versão (Git).

Crie o arquivo `.env` com o seguinte conteúdo, substituindo os placeholders pelos seus valores reais:

```env
# Token de autenticação do seu Bot Discord (obtido do Discord Developer Portal)
DISCORD_TOKEN=SEU_TOKEN_DO_DISCORD_AQUI

# ID do Servidor (Guild) Discord onde o bot irá operar (obtenha via Modo Desenvolvedor no Discord)
GUILD_ID=ID_DO_SEU_SERVIDOR_DISCORD_AQUI

# ID do Canal Discord específico onde o comando !presença será escutado (obtenha via Modo Desenvolvedor)
PRESENCE_CHANNEL_ID=ID_DO_CANAL_PARA_COMANDO_PRESENCA_AQUI

# URL completa da sua Edge Function 'process-discord-presence' implantada no Supabase
# Exemplo: https://xyzprojectref.functions.supabase.co/process-discord-presence
SUPABASE_EDGE_FUNCTION_URL=URL_DA_SUA_EDGE_FUNCTION_AQUI 

# Chave secreta para autenticar o bot com a Edge Function.
# ESTE VALOR DEVE SER IDÊNTICO ao segredo 'DISCORD_BOT_SECRET_KEY' configurado no painel Supabase para a Edge Function.
EDGE_FUNCTION_SECRET_KEY=SEU_SEGREDO_COMPARTILHADO_AQUI
```

## Como Obter os Valores:

*   **`DISCORD_TOKEN`**:
    1.  Acesse o [Discord Developer Portal](https://discord.com/developers/applications).
    2.  Selecione (ou crie) sua aplicação de bot.
    3.  No menu lateral, navegue até a seção "Bot".
    4.  Em "Token", clique em "Reset Token" (ou "View Token" se já tiver um). Copie o token exibido.
    5.  **Importante**: Trate este token como uma senha. Não o compartilhe publicamente.

*   **`GUILD_ID` (ID do Servidor/Guilda)**:
    1.  No seu cliente Discord, vá para `Configurações de Usuário` (ícone de engrenagem próximo ao seu nome de usuário).
    2.  Navegue até `Configurações do Aplicativo > Avançado`.
    3.  Ative a opção `Modo Desenvolvedor`.
    4.  Feche as configurações.
    5.  Clique com o botão direito do mouse sobre o ícone do seu servidor na lista de servidores à esquerda e selecione `Copiar ID`.

*   **`PRESENCE_CHANNEL_ID` (ID do Canal de Presença)**:
    1.  Certifique-se de que o `Modo Desenvolvedor` está ativo (veja o passo anterior).
    2.  No seu servidor, clique com o botão direito do mouse sobre o canal de texto específico onde o comando `!presença` deve ser monitorado.
    3.  Selecione `Copiar ID`.

*   **`SUPABASE_EDGE_FUNCTION_URL`**:
    *   Esta é a URL que você obtém após implantar com sucesso sua Edge Function `process-discord-presence` no Supabase.
    *   O formato é geralmente `https://<SEU_PROJECT_REF>.functions.supabase.co/process-discord-presence`.
    *   Você pode encontrar o `<SEU_PROJECT_REF>` (ID de Referência do Projeto) no painel Supabase em `Project Settings > General`.

*   **`EDGE_FUNCTION_SECRET_KEY`**:
    *   Este é o valor da chave secreta que você criou e configurou no painel Supabase para a sua Edge Function, sob o nome `DISCORD_BOT_SECRET_KEY`.
    *   É essencial que o valor aqui seja exatamente o mesmo configurado no Supabase para que a autenticação entre o bot e a Edge Function funcione.

Lembre-se de adicionar o arquivo `.env` ao seu `.gitignore` para evitar que ele seja acidentalmente versionado.
```