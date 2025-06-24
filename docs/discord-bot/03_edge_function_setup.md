```markdown
# Guia Bot Discord: Configuração da Edge Function

A Supabase Edge Function `process-discord-presence` é o coração da lógica de registro de presença. Esta seção detalha sua configuração.

## Arquivo `_shared/cors.ts`

Este arquivo define os cabeçalhos CORS (Cross-Origin Resource Sharing) para sua Edge Function, permitindo que ela seja acessada por seu bot.

**Localização**: `supabase/functions/_shared/cors.ts`

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Para desenvolvimento. Em produção, restrinja ao domínio do seu bot se possível.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", // OPTIONS é necessário para preflight requests
};
```

## Edge Function `process-discord-presence`

Esta é a função principal que lida com a lógica de presença, incluindo os marcos e o congelamento.

**Localização**: `supabase/functions/process-discord-presence/index.ts`

```typescript
// supabase/functions/process-discord-presence/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface PresencePayload {
  discord_id: string;
}

interface MemberData {
  id: string;
  codinome: string | null;
  ultima_presenca: string | null;
  penultima_presenca: string | null;
  total_presencas: number;
  status: string | null;
  esa: string | null; // "Sim", "Não", ou null
  cfo: string | null; // "Sim", "Não", ou null
  dias_inatividade: number;
}

// Função auxiliar para criar respostas JSON padronizadas
function createJsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: status,
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_SECRET = Deno.env.get("DISCORD_BOT_SECRET_KEY");
    const authorization = req.headers.get("Authorization");

    if (!BOT_SECRET) {
      console.error("DISCORD_BOT_SECRET_KEY não está configurado na Edge Function.");
      return createJsonResponse({ 
        actionTaken: "ERROR_CONFIG",
        messageForBot: "Erro de configuração interna do servidor. Contate um administrador." 
      }, 500);
    }
    if (!authorization || authorization !== `Bearer ${BOT_SECRET}`) {
      console.warn("Tentativa de acesso não autorizado à Edge Function.");
      return createJsonResponse({ 
        actionTaken: "ERROR_UNAUTHORIZED",
        messageForBot: "Acesso não autorizado." 
      }, 401);
    }

    let payload: PresencePayload;
    try {
      payload = await req.json();
    } catch (jsonError) {
      console.error("Erro ao parsear JSON do payload:", jsonError.message);
      return createJsonResponse({ 
        actionTaken: "ERROR_INVALID_PAYLOAD",
        messageForBot: "Requisição inválida." 
      }, 400);
    }
    
    const { discord_id } = payload;
    if (!discord_id) {
      return createJsonResponse({ 
        actionTaken: "ERROR_MISSING_ID",
        messageForBot: "ID Discord não fornecido." 
      }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.");
      return createJsonResponse({ 
        actionTaken: "ERROR_DB_CONFIG",
        messageForBot: "Erro de configuração interna do servidor para acesso ao banco. Contate um administrador." 
      }, 500);
    }
    
    const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: memberResult, error: fetchError } = await supabaseClient
      .from("members")
      .select("id, codinome, ultima_presenca, penultima_presenca, total_presencas, status, esa, cfo, dias_inatividade")
      .eq("discord_id", discord_id)
      .is("data_saida", null)
      .single();

    if (fetchError || !memberResult) {
      const dbErrorMessage = fetchError ? fetchError.message : "Membro não encontrado ou inativo.";
      console.warn(`Falha ao buscar membro ${discord_id}: ${dbErrorMessage}`);
      return createJsonResponse({ 
        actionTaken: "ERROR_MEMBER_NOT_FOUND",
        messageForBot: `Membro com Discord ID ${discord_id} não encontrado ou está inativo.` 
      }, 404);
    }
    
    const member: MemberData = memberResult as MemberData;
    const today = new Date().toISOString().split("T")[0];

    // 1. Verificar se a presença já foi registrada hoje
    if (member.ultima_presenca === today) {
      console.log(`Presença já registrada hoje para ${member.codinome || discord_id}.`);
      return createJsonResponse({
        actionTaken: "ALREADY_LOGGED_TODAY",
        messageForBot: `Olá ${member.codinome || discord_id}, sua presença já foi registrada hoje! Total: ${member.total_presencas}.`
      }, 200);
    }

    // 2. Lógica de "congelamento" (atualiza data de presença mas não o total) e marcos
    // Define os updates básicos que sempre ocorrerão se a presença for marcada (mesmo que congelada)
    const basicUpdates = {
      ultima_presenca: today,
      penultima_presenca: member.ultima_presenca,
      status: "Ativo",
      dias_inatividade: 0
    };

    // Marco ESA (55 presenças) - Congelamento
    if (member.total_presencas >= 55 && member.esa !== "Sim") {
      console.log(`Membro ${member.codinome || discord_id} com ${member.total_presencas} presenças (ESA pendente). Atualizando data de presença.`);
      const { error: updateError } = await supabaseClient
        .from("members")
        .update(basicUpdates) // Só atualiza data e status de atividade
        .eq("id", member.id);

      if (updateError) {
        console.error("Erro ao atualizar data de presença (ESA pendente):", updateError.message);
        return createJsonResponse({ 
          actionTaken: "ERROR_UPDATING_MEMBER_DATE_ESA",
          messageForBot: "Ocorreu um erro ao tentar registrar sua atividade (ESA)." 
        }, 500);
      }
      // Log
      try {
        await supabaseClient.from("action_logs").insert({
          action_type: "BOT_PRESENCE_V3",
          action_description: `Atividade registrada (ESA pendente): ${member.codinome || discord_id}. Total presenças mantido: ${member.total_presencas}.`,
          table_affected: "members", record_id: member.id,
          details: { discord_id, new_ultima_presenca: today, total_presencas_apos: member.total_presencas, action_result: "ACTIVITY_LOGGED_ESA_PENDING" },
        });
      } catch (logError) { console.error("Erro log (ACTIVITY_LOGGED_ESA_PENDING):", logError.message); }

      return createJsonResponse({
        actionTaken: "ACTIVITY_LOGGED_ESA_PENDING",
        messageForBot: `🛑 Olá ${member.codinome || discord_id}, sua atividade foi registrada! Você tem ${member.total_presencas} presenças. Para continuar progredindo e contabilizando mais presenças, conclua o ESA e peça a um administrador para atualizar seu status.`
      }, 200);
    }

    // Marco CFO (120 presenças) - Congelamento
    if (member.total_presencas >= 120 && member.cfo !== "Sim") {
      console.log(`Membro ${member.codinome || discord_id} com ${member.total_presencas} presenças (CFO pendente). Atualizando data de presença.`);
      const { error: updateError } = await supabaseClient
        .from("members")
        .update(basicUpdates) // Só atualiza data e status de atividade
        .eq("id", member.id);

      if (updateError) {
        console.error("Erro ao atualizar data de presença (CFO pendente):", updateError.message);
        return createJsonResponse({ 
          actionTaken: "ERROR_UPDATING_MEMBER_DATE_CFO",
          messageForBot: "Ocorreu um erro ao tentar registrar sua atividade (CFO)." 
        }, 500);
      }
      // Log
      try {
        await supabaseClient.from("action_logs").insert({
          action_type: "BOT_PRESENCE_V3",
          action_description: `Atividade registrada (CFO pendente): ${member.codinome || discord_id}. Total presenças mantido: ${member.total_presencas}.`,
          table_affected: "members", record_id: member.id,
          details: { discord_id, new_ultima_presenca: today, total_presencas_apos: member.total_presencas, action_result: "ACTIVITY_LOGGED_CFO_PENDING" },
        });
      } catch (logError) { console.error("Erro log (ACTIVITY_LOGGED_CFO_PENDING):", logError.message); }
      
      return createJsonResponse({
        actionTaken: "ACTIVITY_LOGGED_CFO_PENDING",
        messageForBot: `🛑 Olá ${member.codinome || discord_id}, sua atividade foi registrada! Você tem ${member.total_presencas} presenças. Para continuar progredindo e contabilizando mais presenças, conclua o CFO e peça a um administrador para atualizar seu status.`
      }, 200);
    }
    
    // 3. Se não estiver congelado, registrar presença normalmente (incrementar total)
    const newTotalPresencas = (member.total_presencas || 0) + 1;
    const fullUpdates = {
      ...basicUpdates,
      total_presencas: newTotalPresencas,
    };

    const { error: updateError } = await supabaseClient
      .from("members")
      .update(fullUpdates)
      .eq("id", member.id);

    if (updateError) {
      console.error("Erro ao atualizar dados do membro (registro normal):", updateError.message);
      return createJsonResponse({ 
        actionTaken: "ERROR_UPDATING_MEMBER_NORMAL",
        messageForBot: "Ocorreu um erro ao tentar registrar sua presença no banco de dados." 
      }, 500);
    }

    // 4. Verificar se um novo marco foi atingido NESTE REGISTRO (e curso pendente)
    let finalMessageForBot = `✅ Olá ${member.codinome || discord_id}, presença registrada com sucesso! Total atual: ${newTotalPresencas}.`;
    let actionTakenResponse = "PRESENCE_LOGGED_NORMAL";

    if (newTotalPresencas === 55 && member.esa !== "Sim") {
      finalMessageForBot = `🛑 Olá ${member.codinome || discord_id}, você atingiu 55 presenças! Sua presença foi contabilizada. Para continuar progredindo, conclua o ESA e peça a um administrador para atualizar seu status.`;
      actionTakenResponse = "MILESTONE_ESA_REACHED_NOW";
    } else if (newTotalPresencas === 120 && member.cfo !== "Sim") {
      finalMessageForBot = `🛑 Olá ${member.codinome || discord_id}, você atingiu 120 presenças! Sua presença foi contabilizada. Para continuar progredindo, conclua o CFO e peça a um administrador para atualizar seu status.`;
      actionTakenResponse = "MILESTONE_CFO_REACHED_NOW";
    }

    // 5. Registrar ação
    try {
      await supabaseClient.from("action_logs").insert({
        action_type: "BOT_PRESENCE_V3",
        action_description: `Presença via Bot: ${member.codinome || discord_id}. Ação: ${actionTakenResponse}. Total presenças: ${newTotalPresencas}.`,
        table_affected: "members",
        record_id: member.id,
        details: { discord_id, new_ultima_presenca: today, total_presencas_apos: newTotalPresencas, action_result: actionTakenResponse },
      });
    } catch (logError) {
      console.error("Erro ao registrar log de presença do bot (v3):", logError.message);
    }
    
    return createJsonResponse({
      actionTaken: actionTakenResponse,
      messageForBot: finalMessageForBot,
      totalPresencas: newTotalPresencas
    }, 200);

  } catch (error) {
    console.error("Erro inesperado na Edge Function:", error.message, error.stack);
    return createJsonResponse({ 
      actionTaken: "ERROR_UNEXPECTED",
      messageForBot: "Ocorreu um erro interno inesperado. Por favor, tente novamente mais tarde." 
    }, 500);
  }
});
```

## Segredos da Edge Function

Sua Edge Function precisa de acesso a certos segredos (variáveis de ambiente) configurados no painel Supabase:
*   `DISCORD_BOT_SECRET_KEY`: Uma chave secreta que seu bot usará no cabeçalho `Authorization: Bearer <chave>` para se autenticar com a Edge Function. Este valor deve ser idêntico ao `EDGE_FUNCTION_SECRET_KEY` no `.env` do seu bot.
*   `SUPABASE_URL`: A URL do seu projeto Supabase. Esta é injetada automaticamente pelo Supabase.
*   `SUPABASE_SERVICE_ROLE_KEY`: A chave de serviço (role key) do Supabase, que permite à Edge Function realizar operações no banco de dados com permissões elevadas (bypass RLS). Esta é injetada automaticamente.

**Como configurar `DISCORD_BOT_SECRET_KEY` no Painel Supabase:**
1.  Acesse seu projeto no [Painel Supabase](https://supabase.com/dashboard).
2.  Vá para `Project Settings` (ícone de engrenagem no menu lateral).
3.  Selecione `Edge Functions` sob a seção `Project Settings`.
4.  Clique no botão `Add new secret`.
    *   **Name**: `DISCORD_BOT_SECRET_KEY`
    *   **Value**: Gere uma string longa, aleatória e segura (ex: usando um gerenciador de senhas). Copie este valor, pois você precisará dele para o arquivo `.env` do seu bot.
5.  Clique em `Create Secret`.

## Deploy da Edge Function

Se você estiver utilizando a Supabase CLI para gerenciar seu projeto Supabase localmente:
1.  Abra seu terminal e navegue até o diretório raiz do seu projeto Supabase.
2.  Execute o comando de deploy:
    ```bash
    supabase functions deploy process-discord-presence --no-verify-jwt
    ```
    *   `process-discord-presence` é o nome da pasta da sua função (ex: `supabase/functions/process-discord-presence`).
    *   A flag `--no-verify-jwt` é usada porque estamos implementando nossa própria lógica de autenticação com um Bearer token (a `DISCORD_BOT_SECRET_KEY`), em vez de usar a verificação JWT padrão do Supabase para chamadas de função autenticadas por usuários Supabase.

Após o deploy bem-sucedido, a URL da sua Edge Function estará disponível. Geralmente segue o formato:
`https://<SEU_PROJECT_REF>.functions.supabase.co/process-discord-presence`

Você pode encontrar o `<SEU_PROJECT_REF>` na URL do seu painel Supabase ou em `Project Settings > General`.
```