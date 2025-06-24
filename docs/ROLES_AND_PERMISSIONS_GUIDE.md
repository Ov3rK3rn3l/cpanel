# Guia de Papéis (Roles) e Permissões no Supabase - Painel GERR

Este guia detalha como o sistema de papéis de usuário é implementado no painel GERR e como as permissões são gerenciadas usando Políticas de Segurança em Nível de Linha (RLS) no Supabase.

## 1. Visão Geral dos Papéis

O sistema utiliza os seguintes papéis principais, armazenados na coluna `role` da tabela `public.users`:

-   **`admin`**: Acesso total a todas as funcionalidades e dados do painel.
-   **`moderador`**: Acesso a funcionalidades de moderação (Membros, Missões, Estatísticas, Comunicados, Histórico de Saídas, visualização de Logs).
-   **`recrutador`**: Acesso focado em recrutamento (adicionar e visualizar Membros, gerenciar Histórico de Saídas, visualizar Logs).
-   **`member`**: Papel padrão para usuários do painel sem privilégios elevados. Atualmente, o foco do painel é para os papéis acima. Todos os usuários podem editar seu próprio perfil.

## 2. Configuração no Supabase

### 2.1. Tabela `public.users`

A tabela `public.users` armazena perfis de usuários do painel e deve ter uma coluna `role` (TEXT) para definir o papel do usuário (admin, moderador, recrutador, member). É crucial que o `id` desta tabela seja o mesmo que o `id` em `auth.users` (tabela de autenticação do Supabase).

```sql
-- Estrutura recomendada para public.users:
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Trigger para popular public.users ao criar um novo usuário na autenticação:
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
BEGIN
  INSERT INTO public.users (id, email, role, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'member'), NEW.raw_user_meta_data->>'nome');
  RETURN NEW;
END;
$;

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
```

### 2.2. Função SQL `get_current_user_role()`

Esta função SQL busca o papel do usuário autenticado na tabela `public.users`. É essencial para as políticas RLS.

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon'; 
  END IF;
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  IF user_role IS NULL THEN
    RETURN 'authenticated'; -- Papel base se não houver perfil específico
  END IF;
  RETURN user_role;
END;
$;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
```

## 3. Políticas de Segurança em Nível de Linha (RLS) Detalhadas

As políticas RLS são habilitadas para cada tabela e usam `get_current_user_role()` para controle de acesso.

### 3.1. Tabela `public.users` (Perfis do Painel)
-   **Admins:** Gerenciam todos os perfis.
    ```sql
    CREATE POLICY "Admins can manage all panel user profiles"
    ON public.users FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');
    ```
-   **Usuários:** Visualizam e atualizam seu próprio perfil.
    ```sql
    CREATE POLICY "Users can view and update their own panel user profile"
    ON public.users FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    ```

### 3.2. Tabela `members` (Membros do Clã)
-   **Admins:** Acesso total (SELECT, INSERT, UPDATE, DELETE).
    ```sql
    CREATE POLICY "Members: Admins full access"
    ON public.members FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');
    ```
-   **Moderadores:** Acesso total (SELECT, INSERT, UPDATE, DELETE).
    ```sql
    CREATE POLICY "Members: Moderadores full access"
    ON public.members FOR ALL
    USING (get_current_user_role() = 'moderador')
    WITH CHECK (get_current_user_role() = 'moderador');
    ```
-   **Recrutadores:**
    -   Podem visualizar todos os membros (`SELECT`).
        ```sql
        CREATE POLICY "Members: Recrutadores SELECT access"
        ON public.members FOR SELECT
        USING (get_current_user_role() = 'recrutador');
        ```
    -   Podem adicionar novos membros (`INSERT`).
        ```sql
        CREATE POLICY "Members: Recrutadores INSERT access"
        ON public.members FOR INSERT
        WITH CHECK (get_current_user_role() = 'recrutador');
        ```
    -   **Importante:** Recrutadores NÃO podem `UPDATE` ou `DELETE` membros existentes diretamente pela tabela `members`. O gerenciamento de saídas (que pode envolver `UPDATE` para marcar como desligado ou `DELETE`) é feito via `DepartedMembersDialog` que pode ter lógica de backend mais específica (ou as políticas para `members` precisam ser ajustadas para permitir que recrutadores modifiquem `data_saida` e `observacoes_saida` ou deletem membros marcados como desligados). Para esta iteração, a política de `UPDATE` para recrutadores na tabela `members` não foi concedida, o que significa que funcionalidades como "Reingressar" ou "Apagar Definitivamente" no `DepartedMembersDialog` precisarão ser testadas para garantir que não violem essa restrição para o papel de recrutador. Se essas ações falharem para recrutadores, políticas específicas para `UPDATE` (para campos de saída) e `DELETE` (para membros com `data_saida` preenchida) podem ser necessárias para o papel `recrutador`.

### 3.3. Tabela `announcements` (Comunicados)
-   **Admins e Moderadores:** Acesso total.
    ```sql
    CREATE POLICY "Announcements: Admins and Moderadores full access"
    ON public.announcements FOR ALL
    USING (get_current_user_role() IN ('admin', 'moderador'))
    WITH CHECK (get_current_user_role() IN ('admin', 'moderador'));
    ```
-   **Outros Usuários Autenticados (Recrutadores, Members):** Apenas visualização.
    ```sql
    CREATE POLICY "Announcements: Authenticated users view access"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');
    ```

### 3.4. Tabela `missions` (Missões)
-   **Admins e Moderadores:** Acesso total.
    ```sql
    CREATE POLICY "Missions: Admins and Moderadores full access"
    ON public.missions FOR ALL
    USING (get_current_user_role() IN ('admin', 'moderador'))
    WITH CHECK (get_current_user_role() IN ('admin', 'moderador'));
    ```
-   **Outros Usuários Autenticados (Recrutadores, Members):** Apenas visualização.
    ```sql
    CREATE POLICY "Missions: Authenticated users view access"
    ON public.missions FOR SELECT
    USING (auth.role() = 'authenticated');
    ```

### 3.5. Tabela `action_logs` (Logs de Atividade)
-   **Admins, Moderadores e Recrutadores:** Apenas visualização.
    ```sql
    CREATE POLICY "ActionLogs: Admins, Moderadores, Recrutadores view access"
    ON public.action_logs FOR SELECT
    USING (get_current_user_role() IN ('admin', 'moderador', 'recrutador'));
    ```
-   **Sistema/Usuários Autenticados (para registrar suas próprias ações):** Permissão de `INSERT`.
    ```sql
    CREATE POLICY "ActionLogs: Authenticated users insert their own logs"
    ON public.action_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');
    ```

### 3.6. Tabelas Financeiras (`treasury_categories`, `treasury_transactions`, `vip_purchases`)
-   **Admins:** Acesso total.
    ```sql
    CREATE POLICY "TreasuryCategories: Admins full access" ON public.treasury_categories FOR ALL USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');
    CREATE POLICY "TreasuryTransactions: Admins full access" ON public.treasury_transactions FOR ALL USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');
    CREATE POLICY "VipPurchases: Admins full access" ON public.vip_purchases FOR ALL USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');
    ```
-   **Outros Usuários Autenticados:** Apenas visualização (para transparência, se desejado).
    ```sql
    CREATE POLICY "TreasuryCategories: Authenticated can view" ON public.treasury_categories FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "TreasuryTransactions: Authenticated can view" ON public.treasury_transactions FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "VipPurchases: Authenticated can view" ON public.vip_purchases FOR SELECT USING (auth.role() = 'authenticated');
    ```
    **Moderadores e Recrutadores NÃO têm acesso de modificação às tabelas financeiras.**

**Importante:** Sempre habilite RLS para cada tabela: `ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;`

## 4. Criando e Gerenciando Usuários do Painel

-   **Via Painel de "Usuários" (para Admins):** A forma mais fácil de criar usuários (`admin`, `moderador`, `recrutador`, `member`) e atribuir papéis.
-   **Via Supabase Studio (Manualmente):**
    1.  Crie o usuário em "Authentication".
    2.  Copie o UID.
    3.  Insira/atualize o registro na tabela `public.users`, colando o UID no campo `id` e definindo o `role` desejado.

## 5. Lógica no Frontend

-   **`AuthContext.jsx`**: Busca e armazena o `userRole` do usuário logado.
-   **`DashboardPage.jsx`**: Filtra as abas visíveis com base no `userRole`.
-   **Componentes Específicos**: Devem verificar `userRole` para habilitar/desabilitar botões ou funcionalidades (ex: Recrutador não pode editar membros, apenas adicionar).

Este sistema garante um controle de acesso granular e seguro ao painel GERR.