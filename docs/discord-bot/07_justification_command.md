# Guia Bot Discord: Comando de Justificativa (`!justificar`)

Este guia detalha como implementar o sistema de justificativas, permitindo que membros enviem suas ausências diretamente do Discord para o painel de controle.

## 1. Visão Geral

O fluxo é o seguinte:
1.  O membro digita o comando `!justificar` no Discord.
2.  O bot responde abrindo um formulário (modal).
3.  O membro preenche o motivo, data de início e data de término e envia.
4.  O bot coleta os dados e os envia para a Supabase Edge Function `process-discord-justification`.
5.  A Edge Function valida os dados e os salva na tabela `justifications` do banco de dados.
6.  O bot informa ao membro que a justificativa foi registrada com sucesso.

## 2. Edge Function: `process-discord-justification`

Esta função é o endpoint que recebe os dados do bot.

**Localização**: `supabase/functions/process-discord-justification/index.ts`

**Código da Função**:
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface JustificationPayload {
  discord_id: string;
  member_name: string;
  reason: string;
  start_date: string; // Formato esperado: "DD/MM/YYYY"
  end_date: string;   // Formato esperado: "DD/MM/YYYY"
}

function createJsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: status,
  });
}

// Converte "DD/MM/YYYY" para "YYYY-MM-DD" para o banco de dados
function parseDate(dateStr: string): string | null {
  const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return null;
  // parts[1] = DD, parts[2] = MM, parts[3] = YYYY
  return `${parts[3]}-${parts[2]}-${parts[1]}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_SECRET = Deno.env.get("DISCORD_BOT_SECRET_KEY");
    const authorization = req.headers.get("Authorization");

    if (!BOT_SECRET || !authorization || authorization !== `Bearer ${BOT_SECRET}`) {
      return createJsonResponse({ message: "Acesso não autorizado." }, 401);
    }

    const payload: JustificationPayload = await req.json();
    const { discord_id, member_name, reason, start_date, end_date } = payload;

    if (!discord_id || !member_name || !reason || !start_date || !end_date) {
      return createJsonResponse({ message: "Dados incompletos. Preencha todos os campos." }, 400);
    }

    const formattedStartDate = parseDate(start_date);
    const formattedEndDate = parseDate(end_date);

    if (!formattedStartDate || !formattedEndDate) {
        return createJsonResponse({ message: "Formato de data inválido. Use DD/MM/YYYY." }, 400);
    }

    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Tenta encontrar o membro para vincular o ID
    const { data: member, error: memberError } = await supabaseClient
      .from("members")
      .select("id")
      .eq("discord_id", discord_id)
      .is("data_saida", null)
      .single();

    if (memberError) {
      console.warn(`Justification: Member with discord_id ${discord_id} not found. Storing without member_id link.`);
    }

    const { error: insertError } = await supabaseClient
      .from("justifications")
      .insert({
        discord_id,
        member_name,
        reason,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        member_id: member?.id || null, // Salva o ID do membro se encontrado
      });

    if (insertError) {
      console.error("Error inserting justification:", insertError.message);
      return createJsonResponse({ message: "Ocorreu um erro ao salvar sua justificativa no banco de dados." }, 500);
    }

    return createJsonResponse({ message: "✅ Sua justificativa foi registrada com sucesso no painel!" }, 200);

  } catch (error) {
    console.error("Unexpected error in justification function:", error.message);
    return createJsonResponse({ message: "Ocorreu um erro interno inesperado." }, 500);
  }
});
```

**Deploy da Função**:
Use a Supabase CLI para fazer o deploy:
```bash
supabase functions deploy process-discord-justification --no-verify-jwt
```

## 3. Código do Bot (Node.js)

Consulte o arquivo `docs/discord-bot/05_bot_node_code.md` para o código completo e atualizado do bot, que agora inclui o `justificationHandler.js` e a lógica para o comando `!justificar` no `bot.js`.

### a. Adicione a URL da nova função no `.env`

No arquivo `.env` do seu bot, adicione a URL da nova Edge Function.

```env
# .env
# ... outras variáveis
SUPABASE_JUSTIFICATION_FUNCTION_URL=https://<SEU_PROJECT_REF>.functions.supabase.co/process-discord-justification
```

Com essas alterações, seu bot estará pronto para receber justificativas e enviá-las diretamente para o painel de controle, onde você poderá gerenciá-las na nova página.