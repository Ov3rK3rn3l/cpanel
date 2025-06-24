# Guia Bot Discord: Estrutura de Pastas e Arquivos

A organização correta dos arquivos é crucial para a manutenção e escalabilidade do projeto do bot do Discord e das Edge Functions associadas.

## Projeto do Bot Discord (Node.js)

Recomenda-se criar uma pasta dedicada para o seu bot, por exemplo, `gerr-discord-bot`. Dentro desta pasta, a estrutura de arquivos e diretórios seria:

```
gerr-discord-bot/
├── src/
│   ├── bot.js                  # Arquivo principal com a lógica do cliente Discord
│   └── utils/
│       ├── presenceHandler.js      # Módulo para interagir com a Edge Function de presença
│       └── justificationHandler.js # Módulo para interagir com a Edge Function de justificativa
├── .env                        # Arquivo para armazenar variáveis de ambiente (não versionado)
└── package.json                # Define as dependências e scripts do projeto Node.js
```

**Instruções para Criação dos Arquivos do Bot:**

*   **`gerr-discord-bot/src/bot.js`**: Contém o código principal para o cliente Discord, incluindo a inicialização, listeners de eventos (como `MessageCreate`, `InteractionCreate`), e a lógica para chamar os handlers.
*   **`gerr-discord-bot/src/utils/presenceHandler.js`**: Exporta uma função que encapsula a chamada `fetch` para a Edge Function `process-discord-presence`.
*   **`gerr-discord-bot/src/utils/justificationHandler.js`**: Exporta uma função que encapsula a chamada `fetch` para a Edge Function `process-discord-justification`.
*   **`gerr-discord-bot/.env`**: Armazena informações sensíveis como o token do bot, IDs de servidor/canal, URLs das Edge Functions e a chave secreta compartilhada.
*   **`gerr-discord-bot/package.json`**: Gerado via `npm init -y`. Lista dependências e define scripts.

## Projeto Supabase (Edge Functions)

As Edge Functions são desenvolvidas e implantadas como parte do seu projeto Supabase.

```
seu-projeto-supabase/
├── supabase/
│   ├── functions/
│   │   ├── process-discord-presence/     # Diretório para a Edge Function de presença
│   │   │   └── index.ts                  # Código TypeScript da Função
│   │   ├── process-discord-justification/ # Diretório para a Edge Function de justificativa
│   │   │   └── index.ts                  # Código TypeScript da Função
│   │   └── _shared/                      # Diretório para código compartilhado
│   │       └── cors.ts                   # Configurações de CORS reutilizáveis
│   └── ... (outras pastas como migrations, etc.)
└── ... (outros arquivos de configuração)
```

**Instruções para Criação dos Arquivos da Edge Function:**

*   **`supabase/functions/process-discord-presence/index.ts`**: Contém a lógica para o comando `!presença`.
*   **`supabase/functions/process-discord-justification/index.ts`**: Contém a lógica para o formulário do comando `!justificar`.
*   **`supabase/functions/_shared/cors.ts`**: Um módulo compartilhado que exporta os cabeçalhos CORS necessários.

Esta estrutura ajuda a separar as responsabilidades: o bot Node.js lida com a interface do Discord, enquanto as Edge Functions no Supabase cuidam da lógica de backend e da interação com o banco de dados.