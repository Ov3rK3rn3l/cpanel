# Guia Bot Discord: Notificação de Recrutamento

Este guia detalha a Edge Function `send-recruitment-to-discord`, que é responsável por enviar uma notificação para um canal do Discord quando um novo membro é aceito através do painel de recrutamento.

## 1. Visão Geral

O fluxo é o seguinte:
1.  Um recrutador clica no botão "ACEITO" no painel de recrutamento da aplicação web.
2.  O frontend da aplicação chama a Edge Function `send-recruitment-to-discord`, enviando os detalhes da candidatura aprovada.
3.  A Edge Function formata esses detalhes em uma mensagem bonita (usando Discord Embeds).
4.  A função envia a mensagem para um canal específico do Discord usando um Webhook.

**Nota sobre PDF:** Gerar um arquivo PDF real em uma Edge Function é complexo. Esta abordagem usa Discord Embeds, que é uma maneira muito mais simples e eficiente de apresentar informações de forma estruturada e visualmente agradável diretamente no Discord.

## 2. Edge Function: `send-recruitment-to-discord`

Esta é a função que o seu frontend irá chamar.

**Localização**: `supabase/functions/send-recruitment-to-discord/index.ts`

**Código da Função**:
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// This function is designed to be called by the frontend after a recruiter accepts an application.
// It receives application data, formats it into a message, and sends it to a Discord channel via a webhook.

function createJsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET");
    const authorization = req.headers.get("Authorization");

    if (authorization !== `Bearer ${EDGE_SECRET}`) {
      return createJsonResponse({ error: "Unauthorized: Missing or invalid secret." }, 401);
    }
    
    // Get Discord Webhook URL from environment variables
    const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_RECRUITMENT_WEBHOOK_URL");
    if (!DISCORD_WEBHOOK_URL) {
      console.error("DISCORD_RECRUITMENT_WEBHOOK_URL is not set.");
      return createJsonResponse({ error: "Internal server configuration error." }, 500);
    }

    // Parse the incoming application data
    const applicationData = await req.json();
    const {
      codinome,
      discord_nick,
      discord_id,
      steam_id,
      steam_profile_url,
      how_found,
      availability,
      total_play_time,
      application_reason,
      recruiter_name,
    } = applicationData;

    if (!codinome || !discord_id || !recruiter_name) {
      return createJsonResponse({ error: "Missing required application data." }, 400);
    }

    // Format the data into a Discord Embed object
    const discordEmbed = {
      username: "GERR - Sistema de Recrutamento",
      avatar_url: "https://storage.googleapis.com/hostinger-horizons-assets-prod/8b34e97e-b1fb-436b-96f9-daf091378bb8/c25396be5f48be7359286fb7f650e260.png",
      embeds: [
        {
          title: `✅ Novo Recruta Aceito: ${codinome}`,
          color: 3066993, // Green color
          timestamp: new Date().toISOString(),
          footer: {
            text: `Aprovado por: ${recruiter_name}`,
          },
          fields: [
            { name: "INFORMAÇÕES PESSOAIS", value: `**Nick Discord:** ${discord_nick} (${discord_id})\n**Steam ID:** ${steam_id}\n**Perfil Steam:** [Ver Perfil](${steam_profile_url})`, inline: false },
            { name: "COMO CONHECEU O GERR", value: how_found, inline: false },
            { name: "DISPONIBILIDADE", value: availability, inline: false },
            { name: "INFORMAÇÕES DE JOGOS", value: `**Tempo de Jogo:** ${total_play_time || 'Não informado'}`, inline: true },
            { name: "MOTIVO DA CANDIDATURA", value: application_reason, inline: false },
          ],
        },
      ],
    };

    // Send the data to the Discord Webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordEmbed),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error sending to Discord:", response.status, errorBody);
      return createJsonResponse({ error: "Failed to send notification to Discord." }, 502);
    }

    return createJsonResponse({ success: true, message: "Notification sent to Discord successfully." }, 200);

  } catch (error) {
    console.error("Unexpected error:", error);
    return createJsonResponse({ error: "An unexpected error occurred." }, 500);
  }
});

```
**Deploy da Função**:
Use a Supabase CLI para fazer o deploy:
```bash
supabase functions deploy send-recruitment-to-discord --no-verify-jwt
```

## 3. Configuração de Segredos (Secrets)

Para que a função funcione, você precisa configurar dois segredos no seu painel Supabase:

1.  **`EDGE_FUNCTION_SECRET`**:
    *   **Finalidade**: Uma chave secreta para autenticar as chamadas do seu frontend para a Edge Function.
    *   **Como configurar**: Se ainda não tiver, vá em `Project Settings > Edge Functions` no seu painel Supabase, crie um novo segredo com o nome `EDGE_FUNCTION_SECRET` e um valor longo e aleatório. **Você também deve adicionar este mesmo valor ao seu arquivo `.env` no frontend como `VITE_EDGE_FUNCTION_SECRET`**.

2.  **`DISCORD_RECRUITMENT_WEBHOOK_URL`**:
    *   **Finalidade**: A URL do Webhook do canal do Discord onde as notificações de recrutamento serão postadas.
    *   **Como obter e configurar**:
        *   No seu servidor Discord, vá para as configurações do canal desejado.
        *   Clique em `Integrações` e depois em `Webhooks`.
        *   Crie um novo Webhook, dê um nome (ex: "Recrutamento GERR") e copie a URL do Webhook.
        *   No seu painel Supabase (`Project Settings > Edge Functions`), crie um novo segredo com o nome `DISCORD_RECRUITMENT_WEBHOOK_URL` e cole a URL que você copiou.

## 4. Integração com o Frontend

O seu frontend (a página de gerenciamento de recrutamento) precisará ser atualizado para chamar esta função quando o botão "ACEITO" for clicado.

**Exemplo de chamada no Frontend (React):**

```javascript
const handleAcceptApplication = async (applicationData, recruiterName) => {
  try {
    const response = await supabase.functions.invoke('send-recruitment-to-discord', {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_EDGE_FUNCTION_SECRET}`,
      },
      body: {
        ...applicationData,
        recruiter_name: recruiterName, // Adiciona o nome do recrutador
      },
    });

    if (response.error) {
      throw response.error;
    }

    toast({ title: 'Sucesso', description: 'Notificação enviada ao Discord!' });
  } catch (error) {
    toast({ title: 'Erro', description: 'Falha ao notificar o Discord.', variant: 'destructive' });
    console.error('Error calling edge function:', error);
  }
};
```

Este guia fornece toda a estrutura necessária no backend. A implementação final requer a integração desta chamada no seu código frontend.