## Guia de Políticas de Segurança em Nível de Linha (RLS) do Supabase - Projeto GERR Painel

    Este documento detalha as políticas RLS (Row Level Security) configuradas para as principais tabelas do banco de dados Supabase do projeto GERR Painel. As políticas RLS são cruciais para garantir que os dados sejam acessados e modificados apenas por usuários autorizados.

    **Nota Geral sobre `auth.uid()` e `auth.role()`:**
    -   `auth.uid()`: Retorna o ID do usuário autenticado que está fazendo a requisição.
    -   `auth.role()`: Retorna o papel do usuário autenticado (ex: `authenticated`, `anon`).
    -   `EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())`: Esta é uma forma comum de verificar se o usuário que está fazendo a requisição é um usuário autenticado válido no sistema.
    -   `is_admin()`: É uma função customizada que você precisaria criar no seu banco de dados para verificar se um `auth.uid()` tem um papel de administrador (ex: buscando em uma tabela `user_roles` ou verificando `user_metadata`). **Nas políticas atuais, essa função não parece estar definida; as políticas confiam no papel `authenticated` como sendo "admin".**

    ---

    ### Tabela: `members`

    **Políticas Ativas:**

    1.  **Nome:** `Allow authenticated users to view members`
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **Check (`WITH CHECK`):** `null`
        *   **O que faz:** Permite que qualquer usuário autenticado leia (SELECT) todos os registros da tabela `members`.

    2.  **Nome:** `Usuário pode deletar seus próprios membros`
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (provavelmente um erro, deveria ser `authenticated` ou uma role específica)
        *   **Definição (`USING`):** `(auth.uid() = user_id)`
        *   **Check (`WITH CHECK`):** `null`
        *   **O que faz:** Permite que um usuário autenticado delete um registro da tabela `members` SE o campo `user_id` do registro for igual ao ID do usuário autenticado. *Se a role for `public`, usuários anônimos não poderiam satisfazer `auth.uid()`.*

    3.  **Nome:** `Admins can update members`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Permite que qualquer usuário autenticado atualize (UPDATE) qualquer registro na tabela `members`. A cláusula `WITH CHECK (true)` garante que a condição `USING (true)` também seja válida para os dados após a atualização (o que é sempre verdade neste caso).

    4.  **Nome:** `Admins can delete members`
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **Check (`WITH CHECK`):** `null`
        *   **O que faz:** Permite que qualquer usuário autenticado delete (DELETE) qualquer registro da tabela `members`.

    5.  **Nome:** `Usuário pode adicionar membros`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (provavelmente um erro, deveria ser `authenticated`)
        *   **Definição (`USING`):** `null` (não se aplica a INSERT)
        *   **Check (`WITH CHECK`):** `(auth.uid() = user_id)`
        *   **O que faz:** Permite que um usuário autenticado insira (INSERT) um novo registro na tabela `members` SE o campo `user_id` do novo registro for igual ao ID do usuário autenticado. *Se a role for `public`, anônimos não poderiam satisfazer `auth.uid()`.*

    6.  **Nome:** `Usuário pode editar seus próprios membros`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (provavelmente um erro, deveria ser `authenticated`)
        *   **Definição (`USING`):** `(auth.uid() = user_id)`
        *   **Check (`WITH CHECK`):** `null` (mas deveria ter `(auth.uid() = user_id)` para garantir consistência)
        *   **O que faz:** Permite que um usuário autenticado atualize um registro da tabela `members` SE o campo `user_id` do registro for igual ao ID do usuário autenticado.

    7.  **Nome:** `authenticated pode tudo`
        *   **Comando:** `ALL` (SELECT, INSERT, UPDATE, DELETE)
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (provavelmente um erro, deveria ser `authenticated`)
        *   **Definição (`USING`):** `(auth.role() = 'authenticated'::text)`
        *   **Check (`WITH CHECK`):** `(auth.role() = 'authenticated'::text)`
        *   **O que faz:** Essencialmente, se o usuário atual tem a role `authenticated`, ele pode realizar todas as operações. Isso torna muitas das políticas mais específicas acima redundantes ou sobrescritas se esta for a intenção. *Se a role for `public`, esta política nunca se aplicaria, pois `auth.role()` seria `anon`.*

    8.  **Nome:** `Authenticated can insert`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `(auth.uid() IS NOT NULL)`
        *   **O que faz:** Permite que usuários autenticados insiram registros. O `WITH CHECK` garante que o usuário está autenticado.

    9.  **Nome:** `Authenticated can update`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(auth.uid() IS NOT NULL)`
        *   **Check (`WITH CHECK`):** `(auth.uid() IS NOT NULL)`
        *   **O que faz:** Permite que usuários autenticados atualizem registros.

    10. **Nome:** `Authenticated can delete`
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(auth.uid() IS NOT NULL)`
        *   **Check (`WITH CHECK`):** `null`
        *   **O que faz:** Permite que usuários autenticados deletem registros.

    11. **Nome:** `Admins can select members` (Duplicata de 1)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **O que faz:** Mesma da política 1.

    12. **Nome:** `Admins can insert members`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Permite que usuários autenticados insiram registros. O `WITH CHECK (true)` é permissivo.

    13. **Nome:** `Allow admin users to delete members`
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que qualquer usuário autenticado (que exista na tabela `auth.users`) delete qualquer registro.

    14. **Nome:** `Allow admin users to update members`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **Check (`WITH CHECK`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que qualquer usuário autenticado atualize qualquer registro.

    15. **Nome:** `Allow admin users to insert members` (Duplicata de 12 com verificação diferente)
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que usuários autenticados insiram registros.

    **Resumo para `members`:** As políticas são um pouco redundantes e algumas com role `public` parecem ser erros de configuração se a intenção é apenas para administradores autenticados. A combinação delas essencialmente permite que **qualquer usuário autenticado realize todas as operações (SELECT, INSERT, UPDATE, DELETE) em todos os registros da tabela `members`.**

    ---

    ### Tabela: `announcements`

    **Políticas Ativas:**

    1.  **Nome:** `Authenticated users can update announcements`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Permite que qualquer usuário autenticado atualize qualquer anúncio.

    2.  **Nome:** `Allow authenticated users to view announcements`
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **O que faz:** Permite que qualquer usuário autenticado visualize todos os anúncios.

    3.  **Nome:** `Allow admin users to insert announcements`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que qualquer usuário autenticado insira anúncios.

    4.  **Nome:** `Allow admin users to update announcements` (Similar a 1)
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **Check (`WITH CHECK`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que qualquer usuário autenticado atualize anúncios.

    5.  **Nome:** `Allow admin users to delete announcements`
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(EXISTS ( SELECT 1 FROM auth.users WHERE (users.id = auth.uid())))`
        *   **O que faz:** Permite que qualquer usuário autenticado delete anúncios.

    6.  **Nome:** `Admins can manage announcements`
        *   **Comando:** `ALL`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Provavelmente deveria ser `authenticated` e usar uma função `get_user_role` mais robusta)
        *   **Definição (`USING`):** `(get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'superadmin'::text]))`
        *   **Check (`WITH CHECK`):** `(get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'superadmin'::text]))`
        *   **O que faz:** Se uma função `get_user_role` existir e retornar 'admin' ou 'superadmin' para o `auth.uid()`, então o usuário pode fazer tudo. *Se a role for `public`, esta política pode não funcionar como esperado para usuários anônimos, e se `get_user_role` não estiver definida, a política falhará.*

    7.  **Nome:** `Public can read announcements`
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public`
        *   **Definição (`USING`):** `true`
        *   **O que faz:** Permite que QUALQUER usuário (autenticado ou anônimo) leia todos os anúncios. Isso é útil se os anúncios devem ser públicos.

    8.  **Nome:** `Allow authenticated users to insert` (Similar a 3)
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Permite que usuários autenticados insiram anúncios.

    9.  **Nome:** `Usuário pode editar seus próprios anúncios`
        *   **Comando:** `UPDATE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Deveria ser `authenticated`)
        *   **Definição (`USING`):** `(auth.uid() = user_id)`
        *   **O que faz:** Permite que um usuário autenticado edite um anúncio SE o `user_id` do anúncio for o seu.

    10. **Nome:** `Authenticated users can delete announcements` (Similar a 5)
        *   **Comando:** `DELETE`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **O que faz:** Permite que qualquer usuário autenticado delete qualquer anúncio.

    **Resumo para `announcements`:** Usuários **autenticados** têm controle total (CRUD) sobre todos os anúncios. Usuários **anônimos** (`public`) podem apenas ler os anúncios (devido à política 7). A política 6 com `get_user_role` é mais específica, mas pode ser redundante ou entrar em conflito com as outras mais permissivas para `authenticated`.

    ---

    ### Tabela: `users` (presumivelmente `public.users`, não `auth.users`)

    **Políticas Ativas:**

    1.  **Nome:** `authenticated_select_own`
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(id = auth.uid())`
        *   **O que faz:** Permite que um usuário autenticado leia seu próprio registro na tabela `users` (onde o `id` da linha é igual ao `auth.uid()`).

    2.  **Nome:** `Permitir criação de usuários`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `null`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Permite que usuários autenticados insiram novos registros na tabela `users`. Isso é muito permissivo se qualquer admin pode criar "perfis" para outros.

    3.  **Nome:** `Usuário pode ver seus dados` (Similar a 1)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Deveria ser `authenticated`)
        *   **Definição (`USING`):** `(auth.uid() = id)`

    4.  **Nome:** `Read own user info` (Muito permissiva)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public`
        *   **Definição (`USING`):** `true`
        *   **O que faz:** Permite que QUALQUER um (incluindo anônimos) leia TODOS os registros da tabela `users`. **Isso é geralmente um risco de segurança.**

    5.  **Nome:** `Public users access` (Duplicata de 4)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public`
        *   **Definição (`USING`):** `true`

    6.  **Nome:** `Allow authenticated inserts on own data`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Check (`WITH CHECK`):** `(auth.uid() = id)`
        *   **O que faz:** Permite que um usuário autenticado insira um registro PARA SI MESMO (o `id` do novo registro deve ser o seu `auth.uid()`).

    7.  **Nome:** `Allow authenticated selects on own data` (Duplicata de 1)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(auth.uid() = id)`

    8.  **Nome:** `admin_full_access`
        *   **Comando:** `ALL`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `true`
        *   **Check (`WITH CHECK`):** `true`
        *   **O que faz:** Dá acesso total (CRUD) a todos os registros da tabela `users` para qualquer usuário autenticado. **Isso sobrescreve as políticas mais restritivas e é um risco se não for a intenção.**

    9.  **Nome:** `public_select_own` (Similar a 1 e 3, mas para role `public`)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Deveria ser `authenticated`)
        *   **Definição (`USING`):** `(id = auth.uid())`

    10. **Nome:** `User can see own data` (Duplicata de 1)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `(auth.uid() = id)`

    11. **Nome:** `Permitir leitura própria` (Redundante com 4 e 5)
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public`
        *   **Definição (`USING`):** `true`

    12. **Nome:** `Full access for admins` (Depende da função `is_admin()`)
        *   **Comando:** `ALL`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Definição (`USING`):** `is_admin()`
        *   **Check (`WITH CHECK`):** `is_admin()`
        *   **O que faz:** Se `is_admin()` retornar true para o usuário, ele tem acesso total.

    **Resumo para `users`:** As políticas para `public.users` são muito permissivas. As políticas 4, 5 e 11 permitem que qualquer pessoa leia todos os dados dos usuários. A política 8 (`admin_full_access` com `USING (true)`) dá a qualquer admin autenticado controle total. É crucial revisar estas políticas para restringir o acesso, especialmente SELECT, aos dados dos usuários.

    ---

    ### Tabela: `missions`

    **Políticas Ativas:** (Muitas são redundantes ou com roles misturadas)

    1.  **Nome:** `Enable insert for admins` (Usa `users.role` - CUIDADO se `users` é `public.users`)
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `authenticated`
        *   **Check (`WITH CHECK`):** `(EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))`
        *   **O que faz:** Permite inserir se o usuário autenticado tiver `role = 'admin'` na tabela `public.users`.

    ... (Muitas políticas para `missions` seguem padrões similares, com algumas para `user_id = auth.uid()` e outras mais gerais para `authenticated` ou com a verificação de `users.role = 'admin'`. A política `admin_full_access` com `USING (true)` também está presente.)

    **Resumo para `missions`:** Similar à tabela `members`, a combinação de políticas parece conceder a qualquer usuário autenticado privilégios totais (CRUD) sobre todos os registros de missões, especialmente devido a políticas como `admin_full_access` (com `USING (true)`). Políticas que verificam `users.role = 'admin'` dependem da tabela `public.users` ter um campo `role` e este ser mantido corretamente.

    ---

    ### Tabela: `action_logs`

    **Políticas Ativas:**

    1.  **Nome:** `Allow insert for authenticated users`
        *   **Comando:** `INSERT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Deveria ser `authenticated`)
        *   **Check (`WITH CHECK`):** `(auth.uid() = user_id)`
        *   **O que faz:** Permite que um usuário autenticado insira um log SE o `user_id` do log for o seu.

    2.  **Nome:** `Allow select for own logs`
        *   **Comando:** `SELECT`
        *   **Ação:** `PERMISSIVE`
        *   **Roles:** `public` (Deveria ser `authenticated`)
        *   **Definição (`USING`):** `(auth.uid() = user_id)`
        *   **O que faz:** Permite que um usuário autenticado leia SEUS PRÓPRIOS logs.

    **Resumo para `action_logs`:** Usuários autenticados podem inserir logs para si mesmos e ler seus próprios logs. Isso é uma boa prática de segurança para logs. Se a intenção é que admins possam ver todos os logs, uma política adicional para SELECT com `USING (true)` para uma role de admin seria necessária.

    ---

    ### Recomendações Gerais:

    1.  **Simplificar e Remover Redundâncias:** Muitas tabelas têm múltiplas políticas que concedem as mesmas permissões (ex: várias políticas de SELECT para `authenticated` com `USING (true)`). Isso pode ser simplificado para uma única política abrangente por operação/role.
    2.  **Corrigir Roles:** Várias políticas estão atribuídas à role `public` mas com definições que claramente se aplicam a `authenticated` usuários (verificando `auth.uid()`). Isso deve ser corrigido para `authenticated`.
    3.  **Princípio do Menor Privilégio:**
        *   Para a tabela `public.users`, a política `SELECT USING (true) FOR public` é um grande risco. Idealmente, os usuários só deveriam poder ler seus próprios dados, e administradores (com uma role definida) poderiam ler todos.
        *   Se a intenção é que apenas administradores gerenciem dados, a maioria das políticas para `authenticated` que usam `USING (true)` deveriam ser mais restritivas ou usar uma verificação de role de administrador mais robusta (ex: `is_admin()` ou verificando `user_metadata` em `auth.users`).
    4.  **Campo `user_id`:** Certifique-se de que o campo `user_id` nas tabelas (quando usado para controle de propriedade) esteja sendo consistentemente populado com o `auth.uid()` do usuário que está criando/modificando o registro.
    5.  **Função `get_user_role()` e `is_admin()`:** Se você usa estas funções em suas políticas (como em `announcements`), certifique-se de que elas estão corretamente definidas no seu banco de dados e que a lógica para atribuir roles aos usuários é segura.
    6.  **Consistência:** Tente usar uma abordagem consistente para definir políticas. Por exemplo, para tabelas gerenciadas apenas por administradores, um conjunto de políticas `ALL FOR authenticated USING (is_admin()) WITH CHECK (is_admin())` pode ser mais limpo do que múltiplas políticas permissivas.

    É altamente recomendável revisar e testar estas políticas cuidadosamente para garantir que elas alinhem com os requisitos de segurança e acesso da sua aplicação.