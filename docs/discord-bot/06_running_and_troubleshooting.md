```markdown
# Guia Bot Discord: Executando e Solucionando Problemas

Com toda a configuração e código no lugar, esta seção aborda como executar seu bot e dicas para solucionar problemas comuns.

## Executando o Bot

1.  **Verifique o `.env`**: Certifique-se de que todas as variáveis de ambiente no arquivo `.env` do seu projeto de bot (`gerr-discord-bot/.env`) estão corretas e correspondem aos segredos e URLs configurados no Supabase.
2.  **Navegue até a Pasta do Bot**: Abra seu terminal ou prompt de comando e navegue até o diretório raiz do seu projeto de bot (ex: `cd gerr-discord-bot`).
3.  **Inicie o Bot**: Execute o script de desenvolvimento definido no seu `package.json`:
    ```bash
    npm run dev
    ```
    Se preferir, pode usar `npm start` se tiver um script `start` similar.
4.  **Monitore os Logs**:
    *   **Logs do Bot**: Observe o console do terminal onde você executou o bot. Mensagens de log indicarão se o bot conectou com sucesso (`[Bot Online]...`), se está escutando no canal correto, e qualquer erro durante a execução.
    *   **Logs da Edge Function**: No painel Supabase, vá para `Edge Functions`, selecione sua função `process-discord-presence`, e clique na aba `Logs`. Estes logs são cruciais para depurar problemas na lógica da Edge Function.

## Solução de Problemas Comuns (Troubleshooting)

*   **Erro no Bot: `SyntaxError: Unexpected end of JSON input` ou `Unexpected token < in JSON at position 0`**
    *   **Causa Principal**: A Edge Function não está retornando uma resposta JSON válida. Em vez disso, pode estar retornando HTML (comum para erros 500 não tratados na EF), uma string vazia, ou texto simples.
    *   **Soluções**:
        1.  **Verifique os Logs da Edge Function**: Este é o primeiro lugar para procurar. Erros no código da EF (ex: variável indefinida, erro de consulta ao banco) podem impedir que ela chegue ao `return createJsonResponse(...)`.
        2.  **Consistência da Resposta da EF**: Garanta que *todos* os caminhos de retorno na Edge Function (sucesso, erro, condições específicas) usem a função `createJsonResponse` ou construam manualmente uma `Response` com `JSON.stringify(...)` e o cabeçalho `Content-Type: application/json`.
        3.  **Autenticação da EF**: Se a `EDGE_FUNCTION_SECRET_KEY` no `.env` do bot não corresponder exatamente ao segredo `DISCORD_BOT_SECRET_KEY` configurado no Supabase, a EF pode retornar um erro 401 (Não Autorizado), que pode não ser JSON.
        4.  **URL da EF**: Uma `SUPABASE_EDGE_FUNCTION_URL` incorreta pode levar a erros 404 ou respostas inesperadas.

*   **Bot Não Responde a Comandos no Discord**:
    *   **Status do Bot**: Verifique se o bot aparece como "online" no seu servidor Discord.
    *   **Token**: Confirme se o `DISCORD_TOKEN` no `.env` está correto e não foi revogado.
    *   **ID do Canal**: Se `PRESENCE_CHANNEL_ID` estiver definido no `.env`, certifique-se de que é o ID correto do canal onde você está testando o comando `!presença`. Se não estiver definido, o bot escutará em todos os canais.
    *   **Permissões e Intents**:
        *   No Discord Developer Portal, para sua aplicação de bot, vá em "Bot".
        *   Role para baixo até "Privileged Gateway Intents".
        *   Certifique-se de que `SERVER MEMBERS INTENT` e `MESSAGE CONTENT INTENT` estão **ATIVADAS**. Sem a `MESSAGE CONTENT INTENT`, o bot não pode ler o conteúdo das mensagens (como `!presença`).
    *   **Logs do Bot**: Verifique o console do bot por mensagens de erro na inicialização ou ao receber mensagens.

*   **Erro da Edge Function: 401 Não Autorizado (Unauthorized)**
    *   **Causa**: A chave secreta enviada pelo bot no cabeçalho `Authorization: Bearer <token>` não corresponde à `DISCORD_BOT_SECRET_KEY` esperada pela Edge Function.
    *   **Solução**: Verifique se o valor de `EDGE_FUNCTION_SECRET_KEY` no arquivo `.env` do bot é *exatamente* o mesmo que o valor do segredo `DISCORD_BOT_SECRET_KEY` configurado no painel Supabase para a Edge Function.

*   **Erro da Edge Function: 404 Não Encontrado (Not Found)**
    *   **Causa**: A `SUPABASE_EDGE_FUNCTION_URL` no `.env` do bot está incorreta, ou a Edge Function `process-discord-presence` não foi implantada com sucesso com esse nome exato.
    *   **Solução**: Verifique a URL e o status do deploy da função no painel Supabase.

*   **Erro da Edge Function: 500 Erro Interno do Servidor (Internal Server Error)**
    *   **Causa**: Provavelmente há um erro no código da Edge Function que não foi capturado por um bloco `try...catch`, ou um problema de configuração crítica (ex: variáveis de ambiente essenciais como `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` faltando no ambiente da EF, embora estas geralmente sejam injetadas automaticamente).
    *   **Solução**: Examine detalhadamente os logs da Edge Function no painel Supabase para identificar a linha ou causa do erro.

*   **Problemas de Permissão no Banco de Dados (Dentro da Edge Function)**:
    *   **Causa**: Embora a Edge Function use a `SUPABASE_SERVICE_ROLE_KEY` (que geralmente ignora RLS), erros de permissão ainda podem ocorrer se houver problemas com a própria chave, ou se as tabelas/colunas referenciadas não existirem ou tiverem nomes incorretos.
    *   **Solução**: Verifique os nomes das tabelas (`members`, `action_logs`) e colunas (`discord_id`, `total_presencas`, `esa`, `cfo`, etc.) no seu código da EF e compare-os com o schema do seu banco de dados Supabase.

Seguindo estas dicas e utilizando os logs disponíveis tanto no bot quanto na Edge Function, você deverá ser capaz de diagnosticar e resolver a maioria dos problemas durante a integração.
```