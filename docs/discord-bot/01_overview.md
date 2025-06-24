# Guia Bot Discord: Visão Geral e Arquitetura

Este guia descreve a integração do bot do Discord com o painel GERR usando Supabase Edge Functions. Ele cobre os comandos `!presença` e `!justificar`.

## Arquitetura

O bot do Discord (Node.js) funciona como um intermediário (mensageiro). Ele detecta comandos específicos e encaminha as informações relevantes para uma Supabase Edge Function. Toda a lógica de negócios, processamento de dados e interações com o banco de dados residem nas Edge Functions.

### Fluxo do Comando `!presença`

1.  **Comando do Usuário**: Um membro digita `!presença` no canal Discord designado.
2.  **Detecção pelo Bot**: O bot do Discord detecta o comando.
3.  **Extração de ID**: O bot extrai o `discord_id` do autor.
4.  **Requisição à Edge Function**: O bot envia uma requisição HTTP POST para a função `process-discord-presence` com o `discord_id`.
5.  **Processamento na Edge Function (`process-discord-presence`)**:
    *   Valida a requisição.
    *   Busca os dados do membro no banco de dados.
    *   Aplica a lógica de presença, incluindo marcos e congelamento de contagem.
    *   Registra a ação na tabela de logs.
    *   Retorna uma resposta JSON com a mensagem para o bot enviar ao usuário.
6.  **Resposta do Bot ao Usuário**: O bot recebe a mensagem e a envia no canal do Discord.

### Fluxo do Comando `!justificar`

1.  **Comando do Usuário**: Um membro digita `!justificar` no Discord.
2.  **Abertura do Formulário**: O bot responde abrindo um formulário (modal) para o membro preencher.
3.  **Preenchimento de Dados**: O membro insere o motivo, a data de início e a data de término da ausência.
4.  **Requisição à Edge Function**: Após o envio, o bot coleta os dados e envia uma requisição HTTP POST para a função `process-discord-justification`.
5.  **Processamento na Edge Function (`process-discord-justification`)**:
    *   Valida a requisição.
    *   Valida e formata os dados recebidos (especialmente as datas).
    *   Insere os dados na tabela `justifications` do banco de dados.
    *   Retorna uma resposta JSON confirmando o registro.
6.  **Resposta do Bot ao Usuário**: O bot informa ao membro que sua justificativa foi registrada com sucesso.

Este fluxo garante que a lógica de negócios complexa seja gerenciada centralmente nas Edge Functions, mantendo o bot do Discord relativamente simples e focado em interações de interface.