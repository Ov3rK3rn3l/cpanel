# Guia de Papéis (Roles) e Permissões no Supabase - Painel GERR

Este guia detalha como o sistema de papéis de usuário é implementado no painel GERR e como as permissões são gerenciadas usando Políticas de Segurança em Nível de Linha (RLS) no Supabase.

## 1. Visão Geral dos Papéis

O sistema utiliza os seguintes papéis principais, armazenados na coluna `role` da tabela `public.users`:

-   **`admin`**: Acesso total a todas as funcionalidades e dados do painel.
-   **`moderador`**: Acesso a funcionalidades de moderação (Membros, Missões, Advertências, Comunicados, etc.).
-   **`recrutador`**: Acesso focado em recrutamento (adicionar e visualizar Membros).
-   **`member`**: Papel padrão para usuários do painel que são membros do clã, com acesso ao seu dashboard pessoal.

## 2. Configuração no Supabase

### 2.1. Tabela `public.users`

A tabela `public.users` armazena perfis de usuários do painel e deve ter uma coluna `role` (TEXT) para definir o papel do usuário.

```sql
-- Estrutura recomendada para public.users:
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Trigger para popular public.users ao criar um novo usuário na autenticação:
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'member'), NEW.raw_user_meta_data->>'nome');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
```

### 2.2. Função SQL `get_current_user_role()`

Esta função SQL busca o papel do usuário autenticado na tabela `public.users`. É essencial para as políticas RLS.

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;
```

## 3. Políticas de Segurança em Nível de Linha (RLS) Detalhadas

As políticas RLS são habilitadas para cada tabela e usam `get_current_user_role()` para controle de acesso.

### 3.1. Tabela `members` (Membros do Clã)
-   **Admins e Moderadores:** Acesso total.
-   **Recrutadores:** Podem visualizar e inserir.
-   **Usuários Autenticados:** Podem visualizar todos os membros.
-   **Usuários:** Podem atualizar seus próprios dados.

### 3.2. Tabela `users` (Perfis do Painel)
-   **Admins:** Gerenciam todos os perfis.
-   **Usuários:** Visualizam e atualizam seu próprio perfil.

### 3.3. Tabela `announcements` (Comunicados)
-   **Admins e Moderadores:** Acesso total.
-   **Outros Usuários Autenticados:** Apenas visualização.

### 3.4. Tabela `missions` (Missões)
-   **Admins, Moderadores e Recrutadores:** Acesso total.
-   **Outros Usuários Autenticados:** Apenas visualização.

### 3.5. Tabela `action_logs` (Logs de Atividade)
-   **Admins, Moderadores e Recrutadores:** Apenas visualização.
-   **Sistema/Usuários Autenticados:** Permissão de `INSERT` para registrar suas próprias ações.

### 3.6. Tabelas Financeiras (`treasury_categories`, `treasury_transactions`, `vip_purchases`)
-   **Admins:** Acesso total.
-   **Outros Usuários Autenticados:** Apenas visualização.
-   **Moderadores e Recrutadores NÃO têm acesso de modificação.**

**Importante:** Sempre habilite RLS para cada tabela: `ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;`

## 4. Lógica no Frontend

-   **`AuthContext.jsx`**: Busca e armazena o `userRole` do usuário logado.
-   **`LoginPage.jsx`**: Após o login, busca a `role` do usuário e redireciona para o painel apropriado (`/admin/dashboard` ou `/dashboard`).
-   **`App.jsx` (`ProtectedRoute`)**: Protege as rotas com base na `userRole` armazenada no contexto.

Este sistema garante um controle de acesso granular e seguro ao painel GERR.