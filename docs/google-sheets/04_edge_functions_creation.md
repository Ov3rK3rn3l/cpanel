### 4. Criação e Implantação das Supabase Edge Functions

    As Supabase Edge Functions executarão a lógica de backend para interagir com a API do Google Sheets. Você usará a Supabase CLI para criar e implantar essas funções.

    **Pré-requisitos:**
    *   [Supabase CLI instalada e configurada](https://supabase.com/docs/guides/cli/getting-started).
    *   Logado na Supabase CLI (`supabase login`).
    *   Seu projeto Supabase vinculado localmente (`supabase link --project-ref YOUR_PROJECT_ID`).

    **Passos:**

    1.  **Inicialize as Funções Supabase (se ainda não o fez no seu projeto):**
        Se esta é a primeira vez que você está criando Edge Functions neste projeto, pode ser necessário inicializar o diretório de funções. Normalmente, a CLI cuida disso ao criar a primeira função.

    2.  **Crie os Arquivos das Edge Functions:**
        Use o comando `supabase functions new <nome_da_funcao>` para criar a estrutura de diretório para cada função.

        ```bash
        supabase functions new load-members-from-google-sheets
        supabase functions new sync-members-to-google-sheets
        ```
        Isso criará os seguintes diretórios dentro da sua pasta `supabase` (geralmente na raiz do seu projeto):
        *   `supabase/functions/load-members-from-google-sheets/index.ts`
        *   `supabase/functions/sync-members-to-google-sheets/index.ts`

    3.  **Configure o `import_map.json` para Dependências:**
        As Edge Functions no Supabase usam um arquivo `import_map.json` para gerenciar dependências externas. Precisamos adicionar a biblioteca `googleapis`.

        Crie ou edite o arquivo `supabase/functions/import_map.json` (ele deve estar na raiz do diretório `functions`, não dentro de cada função individual):

        ```json
        // supabase/functions/import_map.json
        {
          "imports": {
            "googleapis": "npm:googleapis@134" 
          }
        }
        ```
        *Nota: Verifique a [versão mais recente do `googleapis`](https://www.npmjs.com/package/googleapis) e atualize o número da versão (`@134`) se necessário.*

    4.  **Adicione o Código às Edge Functions:**
        Copie o código TypeScript fornecido na próxima seção ("Detalhes das Edge Functions e Mapeamento de Dados") para os respectivos arquivos `index.ts` de cada função.
        *   O código para ler da planilha vai em `supabase/functions/load-members-from-google-sheets/index.ts`.
        *   O código para escrever na planilha vai em `supabase/functions/sync-members-to-google-sheets/index.ts`.

    5.  **(Opcional) Arquivo Compartilhado para Headers CORS:**
        Se você precisar de uma configuração CORS consistente entre múltiplas funções, pode criar um arquivo compartilhado.
        Crie `supabase/functions/_shared/cors.ts`:
        ```typescript
        // supabase/functions/_shared/cors.ts
        export const corsHeaders = {
          'Access-Control-Allow-Origin': '*', // Em produção, restrinja para o seu domínio: 'https://seudominio.com'
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        };
        ```
        Você pode então importar `corsHeaders` nas suas funções. Os exemplos de código das funções já incluem headers CORS básicos.

    6.  **Implante (Deploy) as Edge Functions:**
        Após adicionar o código e configurar o `import_map.json`, implante as funções no Supabase:

        ```bash
        supabase functions deploy load-members-from-google-sheets --no-verify-jwt
        supabase functions deploy sync-members-to-google-sheets --no-verify-jwt
        ```
        *   **`--no-verify-jwt`**: Esta flag permite que a função seja chamada sem um token JWT de usuário Supabase válido. Isso é útil se:
            *   A função é chamada por um sistema externo.
            *   A autenticação é tratada de outra forma (ex: um token de API secreto no corpo da requisição, embora para esta integração a chave da conta de serviço Google já seja o principal segredo).
            *   Você quer que qualquer pessoa com o URL da função possa invocá-la (menos seguro, use com cautela).
        *   Se você remover `--no-verify-jwt`, o frontend precisará incluir o token de acesso do usuário Supabase no header `Authorization` ao chamar a função. A função então terá acesso aos detalhes do usuário autenticado. Para interações com Google Sheets onde a autorização é via chave de serviço, `--no-verify-jwt` é comum, mas considere as implicações de segurança.

    7.  **Verifique a Implantação:**
        *   Acesse o painel do Supabase > "Edge Functions". Você deverá ver suas funções listadas com o status "OK".
        *   Você também pode verificar os logs de cada função aqui após tentar invocá-las.

    Com as funções implantadas, a próxima etapa é entender o código delas e como o mapeamento de dados é feito.