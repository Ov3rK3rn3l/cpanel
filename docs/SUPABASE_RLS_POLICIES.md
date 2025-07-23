# Guia de Políticas de Segurança (RLS) - GERR Painel (Revisado)

Este documento detalha as políticas de segurança (Row Level Security - RLS) simplificadas e reestruturadas para o projeto GERR Painel, garantindo acesso seguro e apropriado aos dados.

## Função de Apoio Principal

-   **`get_current_user_role()`**: Uma função SQL `SECURITY DEFINER` que busca de forma segura o cargo (`role`) do usuário autenticado na tabela `public.users`. Esta função é a base para a maioria das políticas.

---

### Tabela: `members`

**Objetivo:** Controlar o acesso aos dados dos membros do clã.

**Políticas Ativas:**

1.  **Nome:** `Members: Admins and Mods have full access`
    *   **Acesso:** Total (SELECT, INSERT, UPDATE, DELETE).
    *   **Para Quem:** Usuários com cargo de `admin` ou `moderador`.
    *   **O que faz:** Concede controle completo sobre todos os registros de membros para a administração.

2.  **Nome:** `Members: Recruiters can view and insert`
    *   **Acesso:** Total (mas primariamente para SELECT e INSERT).
    *   **Para Quem:** Usuários com cargo de `recrutador`.
    *   **O que faz:** Permite que recrutadores vejam todos os membros e adicionem novos recrutas.

3.  **Nome:** `Members: Authenticated users can view all members`
    *   **Acesso:** Apenas Leitura (SELECT).
    *   **Para Quem:** Qualquer usuário autenticado (incluindo `member`).
    *   **O que faz:** Permite que todos os usuários logados vejam a lista de membros, promovendo a integração.

4.  **Nome:** `Members: Users can update their own data`
    *   **Acesso:** Apenas Atualização (UPDATE).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Permite que um usuário atualize **apenas o seu próprio perfil de membro** (onde `user_id` corresponde ao seu ID de autenticação).

---

### Tabela: `users`

**Objetivo:** Gerenciar os perfis de usuário do painel (diferente de `members`).

**Políticas Ativas:**

1.  **Nome:** `Users: Admins have full access`
    *   **Acesso:** Total (CRUD).
    *   **Para Quem:** Usuários com cargo de `admin`.
    *   **O que faz:** Permite que administradores gerenciem todos os perfis de usuário do sistema.

2.  **Nome:** `Users: Can view their own profile`
    *   **Acesso:** Apenas Leitura (SELECT).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Garante que um usuário só possa ver os detalhes do seu próprio perfil na tabela `users`.

3.  **Nome:** `Users: Can update their own profile`
    *   **Acesso:** Apenas Atualização (UPDATE).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Permite que um usuário atualize os dados do seu próprio perfil.

---

### Tabela: `missions`

**Objetivo:** Controlar o acesso às missões e eventos do clã.

**Políticas Ativas:**

1.  **Nome:** `Missions: Admins, Mods, Recruiters have full access`
    *   **Acesso:** Total (CRUD).
    *   **Para Quem:** Usuários com cargo de `admin`, `moderador` ou `recrutador`.
    *   **O que faz:** Permite que a liderança crie, edite e gerencie todas as missões.

2.  **Nome:** `Missions: Authenticated users can view`
    *   **Acesso:** Apenas Leitura (SELECT).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Permite que todos os membros do clã vejam as missões disponíveis.

---

### Tabela: `action_logs`

**Objetivo:** Registrar e controlar o acesso aos logs de ações do sistema.

**Políticas Ativas:**

1.  **Nome:** `ActionLogs: Admins, Mods, Recruiters can view all logs`
    *   **Acesso:** Apenas Leitura (SELECT).
    *   **Para Quem:** Usuários com cargo de `admin`, `moderador` ou `recrutador`.
    *   **O que faz:** Permite que a liderança audite as ações realizadas no painel.

2.  **Nome:** `ActionLogs: Users can insert their own logs`
    *   **Acesso:** Apenas Inserção (INSERT).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Permite que o sistema registre logs em nome do usuário que está realizando a ação.

---

### Tabelas Financeiras (`treasury_categories`, `treasury_transactions`, `vip_purchases`)

**Objetivo:** Controlar o acesso à tesouraria.

**Políticas Ativas:**

1.  **Nome:** `Treasury...: Admins full access`
    *   **Acesso:** Total (CRUD).
    *   **Para Quem:** Usuários com cargo de `admin`.
    *   **O que faz:** Concede controle total sobre as finanças apenas para administradores.

2.  **Nome:** `Treasury...: Authenticated can view`
    *   **Acesso:** Apenas Leitura (SELECT).
    *   **Para Quem:** Qualquer usuário autenticado.
    *   **O que faz:** Permite que todos os usuários logados vejam as transações para transparência.

Esta estrutura de RLS é mais segura, limpa e alinhada com as necessidades de cada cargo dentro do clã.