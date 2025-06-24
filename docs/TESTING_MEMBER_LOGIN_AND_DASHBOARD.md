## Guia de Teste: Login de Membro e Acesso ao Dashboard

Este guia detalha os passos para testar o fluxo de login de um usuário com a role "member" e garantir que ele seja corretamente redirecionado para seu dashboard (`/dashboard`), visualizando suas informações da tabela `members`.

### Pré-requisitos:

1.  **Conta de Administrador/Recrutador Funcional**: Você precisa de uma conta com permissão para:
    *   Criar usuários do painel (na `auth.users` e `public.users`) com a role "member".
    *   Cadastrar/editar perfis de membros na tabela `public.members`, incluindo o campo `email`.
2.  **Edge Function `create-update-panel-user`**: Deve estar implantada e funcional no Supabase, permitindo que administradores criem usuários do painel com email, senha e role.
3.  **Políticas RLS Corretas**: As políticas RLS para as tabelas `public.users` e `public.members` devem estar configuradas conforme as interações anteriores para permitir:
    *   Leitura da `role` na tabela `public.users` pelo `AuthContext`.
    *   Leitura dos dados do membro na tabela `public.members` pelo próprio membro.
    *   Atualização do campo `user_id` na tabela `public.members` pelo próprio membro (para vinculação).
4.  **Campo `email` na Tabela `members`**: A tabela `public.members` deve ter uma coluna `email` (do tipo `TEXT`) para armazenar o email do membro, que será usado para vinculação com a conta de autenticação.

### Fluxo de Teste Detalhado:

**Passo 1: Criar uma Conta de Autenticação para o Membro de Teste**

*   **Opção A (Usando o Painel Administrativo - Recomendado):**
    1.  Faça login no painel com uma conta de `admin`.
    2.  Navegue até a seção de "Gerenciamento de Usuários do Painel" (ex: `UserManagementPage.jsx`).
    3.  Clique em "Criar Novo Usuário" (ou similar).
    4.  Preencha o formulário:
        *   **Nome**: `Membro Teste GERR` (ou qualquer nome)
        *   **Email**: `membro.teste.login@example.com` (Use um email único e anote-o)
        *   **Senha**: `SenhaSegura123!` (Use uma senha forte e anote-a)
        *   **Role**: Selecione `member`.
    5.  Envie o formulário.
        *   **Verificação**: A Edge Function `create-update-panel-user` deve ser chamada. O usuário deve ser criado em `auth.users` (Supabase Authentication). Uma entrada correspondente deve ser criada na tabela `public.users` com o `id` do `auth.users`, o `email` fornecido e a `role` "member". (Isso é geralmente feito pelo trigger `handle_new_user_profile` ou pela própria Edge Function).

*   **Opção B (Manualmente no Supabase Studio - Alternativa):**
    1.  Acesse seu projeto no Supabase Studio.
    2.  Vá para "Authentication" -> "Users" -> Clique em "Add user".
    3.  **Email**: `membro.teste.login@example.com`
    4.  **Password**: Defina a senha (ex: `SenhaSegura123!`).
    5.  **Auto Confirm User**: Marque esta opção para simplificar o teste (evita a necessidade de confirmação por email).
    6.  Clique em "Create user".
    7.  Copie o `UID` do usuário recém-criado.
    8.  Vá para "Table Editor" -> Tabela `users`.
    9.  Clique em "Insert row".
        *   `id`: Cole o `UID` copiado.
        *   `email`: `membro.teste.login@example.com`
        *   `role`: `member`
        *   `nome`: `Membro Teste GERR` (opcional)
    10. Salve a linha.

**Passo 2: Cadastrar/Vincular o Perfil do Membro na Tabela `members`**

1.  Ainda logado como `admin` (ou `recrutador`), navegue até a seção "Membros" do painel administrativo.
2.  **Opção A (Novo Membro):**
    *   Adicione um novo membro.
    *   Preencha os campos obrigatórios (Codinome, Patente Atual, etc.).
    *   **CRUCIAL**: No campo `Email` (que corresponde à coluna `email` da tabela `members`), insira **exatamente** o mesmo email usado no Passo 1: `membro.teste.login@example.com`.
    *   Salve o novo membro.
3.  **Opção B (Membro Existente):**
    *   Edite um membro existente que você usará para o teste.
    *   **CRUCIAL**: No campo `Email`, altere/insira **exatamente** `membro.teste.login@example.com`.
    *   Salve as alterações.

    *   **Verificação**: Neste ponto, na tabela `members`, o registro para "Membro Teste GERR" deve ter o campo `email` preenchido com `membro.teste.login@example.com`. O campo `user_id` neste registro provavelmente estará `NULL` ou vazio.

**Passo 3: Fazer Logout da Conta Administrativa**

*   No painel, clique em "Sair" ou na opção de logout para deslogar da conta de `admin`.

**Passo 4: Tentar Fazer Login como o Membro de Teste**

1.  Navegue até a página de login do painel (geralmente `/login`).
2.  Insira as credenciais do membro de teste:
    *   **Email**: `membro.teste.login@example.com`
    *   **Senha**: `SenhaSegura123!`
3.  Clique em "Entrar".

    *   **Resultado Esperado**:
        1.  O login deve ser bem-sucedido.
        2.  O `LoginPage.jsx` deve consultar a tabela `public.users` para obter a `role` associada ao `id` do usuário autenticado. Ele deve encontrar a `role` "member".
        3.  O usuário deve ser **redirecionado automaticamente** para `/dashboard` (a página `MemberDashboardPage.jsx`).
        4.  Na `MemberDashboardPage.jsx`:
            *   A função `fetchMemberData` tentará buscar o membro por `user_id`. Como é o primeiro login e o `user_id` na tabela `members` ainda está `NULL`, esta busca falhará (o que é esperado).
            *   Em seguida, `fetchMemberData` tentará buscar o membro por `email` (comparando `members.email` com `auth.email()`). Esta busca **deve ter sucesso** porque `members.email` foi definido como `membro.teste.login@example.com`.
            *   Os dados do "Membro Teste GERR" (patente, presenças, etc.) devem ser exibidos no dashboard.
            *   **Importante**: Em segundo plano, `fetchMemberData` tentará executar um `UPDATE` na tabela `members` para preencher o campo `user_id` do registro encontrado com o `id` do usuário autenticado (`auth.uid()`). Isso é para otimizar logins futuros.

**Passo 5: Verificar a Vinculação do `user_id` (Opcional, mas recomendado)**

1.  No Supabase Studio, vá para "Table Editor" -> Tabela `members`.
2.  Encontre o registro do "Membro Teste GERR" (aquele com `email = 'membro.teste.login@example.com'`).
3.  Verifique se a coluna `user_id` agora está preenchida com o `UID` do usuário `membro.teste.login@example.com` (o mesmo `UID` da tabela `auth.users` e `public.users`).

**Passo 6: Testar Login Subsequente**

1.  Faça logout da conta do "Membro Teste GERR".
2.  Tente fazer login novamente com as mesmas credenciais (`membro.teste.login@example.com` e `SenhaSegura123!`).

    *   **Resultado Esperado**:
        1.  Login bem-sucedido.
        2.  Redirecionamento para `/dashboard`.
        3.  Desta vez, na `MemberDashboardPage.jsx`, a função `fetchMemberData` deve encontrar o membro **diretamente pela busca por `user_id`**, pois este campo foi vinculado no login anterior. A busca por email não deve ser necessária.
        4.  Os dados do membro devem ser exibidos corretamente.

### Solução de Problemas Comuns:

*   **Membro não é redirecionado para `/dashboard` ou vai para `/admin/dashboard`**:
    *   Verifique a `role` do usuário na tabela `public.users`. Deve ser "member".
    *   Verifique a lógica de redirecionamento no `LoginPage.jsx` e no `ProtectedRoute` em `App.jsx`.
*   **Mensagem "Perfil Não Encontrado" no `/dashboard`**:
    *   **Causa mais comum**: O email cadastrado na tabela `members` (campo `email`) **NÃO** é idêntico ao email usado para login (e registrado na `auth.users` / `public.users`). Eles devem ser exatamente iguais.
    *   **Falha na vinculação do `user_id`**: A política RLS `Members: Allow member to update their own user_id link` pode não estar configurada corretamente ou pode haver outro bloqueio. Verifique os logs do console do navegador para erros de RLS durante a tentativa de `UPDATE` no `MemberDashboardPage.jsx`.
    *   **RLS de Leitura**: A política `Members: Members can read their own data` deve permitir que o membro leia seu registro na tabela `members` (seja por `user_id` vinculado ou por `email` correspondente com `user_id` nulo).
*   **Erro ao criar usuário pelo painel de admin**:
    *   Verifique os logs da Edge Function `create-update-panel-user` no Supabase Studio.
    *   Certifique-se de que os segredos do Supabase (SERVICE_ROLE_KEY, URL) estão corretamente configurados para a Edge Function.
*   **Admin é redirecionado ao criar usuário**:
    *   A lógica de submissão do formulário na página de gerenciamento de usuários do painel (ex: `UserManagementPage.jsx`) não deve conter um `navigate()` após a criação bem-sucedida do usuário. O admin deve permanecer na página de gerenciamento.

Se após seguir estes passos o problema persistir, por favor, forneça detalhes sobre qual passo falhou e quaisquer mensagens de erro observadas no console do navegador ou nos logs do Supabase.