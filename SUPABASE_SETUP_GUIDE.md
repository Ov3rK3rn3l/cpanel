## Guia de Configuração do Supabase para o Projeto GERR Painel

Este documento detalha os passos necessários para configurar o Supabase para o projeto do painel administrativo do Clã GERR.

### 1. Configuração do Banco de Dados (Tabelas)

As tabelas `members` e `announcements` já foram criadas no seu projeto Supabase com as seguintes estruturas e políticas RLS básicas.

#### Tabela: `members`
Armazena informações sobre os membros da comunidade.

**Campos:**
*   `id`: `UUID`, Chave Primária, Gerado automaticamente.
*   `user_id`: `UUID`, Chave estrangeira referenciando `auth.users(id)`. Usado para rastrear qual administrador criou/editou o membro.
*   `discord_id`: `TEXT`, Obrigatório. ID do Discord do membro.
*   `discord_nick`: `TEXT`, Obrigatório. Nickname do Discord do membro.
*   `data_ingresso`: `DATE`, Obrigatório. Data de ingresso do membro no clã.
*   `data_saida`: `DATE`, Opcional. Data de saída do membro do clã.
*   `jogo_principal`: `TEXT`. Jogo principal do membro (Ex: "Squad", "Arma Reforger", "Hell Let Loose", "Outro").
*   `created_at`: `TIMESTAMP WITH TIME ZONE`, Padrão `CURRENT_TIMESTAMP`. Data de criação do registro.
*   `updated_at`: `TIMESTAMP WITH TIME ZONE`, Padrão `CURRENT_TIMESTAMP`. Data da última atualização do registro (atualizado automaticamente por trigger).

#### Tabela: `announcements`
Armazena os anúncios para a comunidade.

**Campos:**
*   `id`: `UUID`, Chave Primária, Gerado automaticamente.
*   `user_id`: `UUID`, Chave estrangeira referenciando `auth.users(id)`. Usado para rastrear qual administrador criou/editou o anúncio.
*   `title`: `TEXT`, Obrigatório. Título do anúncio.
*   `content`: `TEXT`, Obrigatório. Conteúdo do anúncio (pode ser texto simples ou Markdown).
*   `created_at`: `TIMESTAMP WITH TIME ZONE`, Padrão `CURRENT_TIMESTAMP`. Data de criação/publicação do anúncio.
*   `updated_at`: `TIMESTAMP WITH TIME ZONE`, Padrão `CURRENT_TIMESTAMP`. Data da última atualização do anúncio (atualizado automaticamente por trigger).

### 2. Configuração da Autenticação Supabase (Email/Senha)

Siga estes passos no seu painel Supabase ([https://app.supabase.com](https://app.supabase.com)):

1.  **Navegue até o seu projeto:** `gerr-painel-2`.
2.  **Vá para "Authentication" -> "Providers".**
3.  **Ative o provedor "Email":** Certifique-se de que o provedor "Email" está habilitado. Ele geralmente vem ativo por padrão.
4.  **Desative o cadastro público (Sign up):**
    *   Ainda em "Authentication" -> "Providers" -> "Email", desmarque a opção "Enable sign up". Isso impede que novos usuários se cadastrem sozinhos.
    *   Alternativamente, em "Authentication" -> "Settings", desative "Enable new user sign-ups".
5.  **Adicionar Administradores Manualmente:**
    *   Vá para "Authentication" -> "Users".
    *   Clique em "**Invite user**" ou "**Add user**".
    *   Insira o endereço de e-mail do administrador e envie o convite (ou defina uma senha temporária se estiver adicionando diretamente).
    *   O usuário receberá um e-mail para confirmar e definir sua senha.
    *   **Importante:** Apenas usuários adicionados aqui poderão fazer login no painel administrativo do seu site.

### 3. Configuração das Políticas de Segurança (RLS - Row Level Security)

As políticas de RLS já foram aplicadas às tabelas `members` e `announcements`. Elas garantem que:

*   **RLS está Ativada:** Para ambas as tabelas.
*   **Políticas Criadas:**
    *   **SELECT:** Usuários autenticados (`authenticated`) podem ler todos os dados.
    *   **INSERT:** Usuários autenticados podem inserir novos dados. A política verifica se o `user_id` do novo registro corresponde ao `auth.uid()` do usuário que está fazendo a inserção.
    *   **UPDATE:** Usuários autenticados podem atualizar dados. A política verifica se o `user_id` do registro existente corresponde ao `auth.uid()` do usuário.
    *   **DELETE:** Usuários autenticados podem deletar dados. A política verifica se o `user_id` do registro corresponde ao `auth.uid()`.

**Resumo das Permissões:**
*   **Usuários Autenticados (Administradores):** Têm permissão completa (SELECT, INSERT, UPDATE, DELETE) sobre os registros que eles criaram ou que são permitidos pelas políticas. No nosso caso, como não há distinção de "dono" do registro para visualização, todos os administradores autenticados podem ver todos os membros e anúncios. Para modificar ou deletar, a política atual (se baseada em `user_id` do registro) permitiria apenas ao criador. Se a intenção é que qualquer admin possa modificar/deletar qualquer registro, as políticas de UPDATE e DELETE precisariam ser ajustadas para `USING (true)` e `WITH CHECK (true)` para o role `authenticated`, ou uma role customizada de admin.
    *   *Nota: As políticas implementadas na interação anterior permitem que qualquer usuário autenticado realize todas as operações (SELECT, INSERT, UPDATE, DELETE) em ambas as tabelas, pois a verificação `EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())` sempre será verdadeira para um usuário autenticado. Isso efetivamente dá permissão total a qualquer administrador logado.*
*   **Usuários Não Autenticados (Público):** Não têm acesso a nenhum dado das tabelas `members` e `announcements` devido à RLS e à ausência de políticas para o role `anon`.

### 4. Chaves de API (Ambiente)

O Supabase fornece diferentes chaves de API para diferentes propósitos:

*   **`anon` (public-anon-key):**
    *   **Uso:** Frontend (seu aplicativo React).
    *   **Permissões:** É segura para ser exposta no lado do cliente. As permissões reais de acesso aos dados são controladas pelas Políticas de RLS que você define. Sem RLS, esta chave daria acesso total (se não houvesse restrições). Com RLS, ela respeita as regras definidas para usuários anônimos e autenticados.
    *   No seu projeto, esta chave é usada para inicializar o cliente Supabase no frontend.
*   **`service_role` (service-role-key):**
    *   **Uso:** Backend (se você tivesse um servidor Node.js, por exemplo).
    *   **Permissões:** Esta chave ignora TODAS as políticas de RLS e tem acesso administrativo completo ao seu banco de dados Supabase.
    *   **CRÍTICO: NUNCA exponha a `service_role` key no frontend ou em qualquer código do lado do cliente.** Ela deve ser mantida secreta e usada apenas em ambientes de servidor seguros.

**Arquivo `.env` de Exemplo:**

Seu projeto já está configurado para usar as variáveis de ambiente para o frontend.

```env
# .env (frontend - já configurado no seu projeto como .env)
VITE_SUPABASE_URL="https://uoeuxfitxeaahppzoptk.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXV4Zml0eGVhYWhwcHpvcHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTU2MDUsImV4cCI6MjA2MzE5MTYwNX0.HvGhSSVgtolZ6U9V-hek9bSR50PEclLJk6opNBq7494"
```

Se você fosse adicionar um backend:
```env
# .env (backend - exemplo, não aplicável diretamente ao projeto atual)
SUPABASE_URL="https://uoeuxfitxeaahppzoptk.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVICE_ROLE_SECRETA_AQUI"
```
Você pode encontrar suas chaves de API no painel do Supabase em **Project Settings -> API**.

### 5. Testes Locais com Supabase

1.  **Supabase Studio (Painel do Supabase):**
    *   **Table Editor:**
        *   Navegue até "Table Editor" no menu lateral.
        *   Selecione a tabela `members` ou `announcements`.
        *   **Leitura:** Você verá os dados existentes.
        *   **Inserção:** Clique em "+ Insert row" para adicionar novos registros manualmente. Preencha os campos e salve.
        *   **Edição:** Clique em uma célula para editar seu valor.
        *   **Deleção:** Selecione uma linha e clique no ícone de lixeira.
    *   **SQL Editor:**
        *   Navegue até "SQL Editor".
        *   Você pode rodar queries SQL diretamente para testar interações mais complexas. Ex: `SELECT * FROM members WHERE discord_nick = 'NomeDoMembro';`
    *   **Autenticação:**
        *   Em "Authentication" -> "Users", você pode ver os usuários cadastrados, convidar novos ou deletar existentes.

2.  **Validar RLS:**
    *   **Com Supabase Studio:**
        *   No "SQL Editor", você pode simular o papel (role) de uma query. Por padrão, o SQL Editor usa o papel de `postgres` (superusuário), que ignora RLS.
        *   Para testar RLS, você precisaria de uma ferramenta cliente SQL que permita conectar-se como um usuário específico ou usar funções do Supabase que forcem a checagem de RLS.
    *   **Com seu Aplicativo Frontend (Melhor Método para Teste de Frontend):**
        *   **Usuário Não Autenticado:** Abra seu site em uma aba anônima (sem login). Tente acessar o `/admin/dashboard`. Você deve ser redirecionado para `/login`. Nenhuma chamada ao banco de dados para `members` ou `announcements` deve funcionar ou retornar dados.
        *   **Usuário Autenticado (Admin):**
            1.  Faça login no seu aplicativo com as credenciais de um administrador que você adicionou manualmente no painel do Supabase.
            2.  Acesse o `/admin/dashboard`.
            3.  **Cadastrar Membro/Anúncio:** Use os formulários para adicionar novos registros. Verifique se eles aparecem na lista e também no "Table Editor" do Supabase Studio.
            4.  **Editar Membro/Anúncio:** Edite um registro existente. Verifique as atualizações.
            5.  **Deletar Membro/Anúncio:** Delete um registro. Verifique se ele some da lista e do Supabase Studio.
        *   **Verifique os Logs:** No painel do Supabase, vá para "Logs" -> "Database" e "API Logs" para ver as requisições e possíveis erros, o que pode ajudar a diagnosticar problemas de RLS.

### 6. Deploy e Produção

*   **Chaves de API no Deploy:**
    *   Quando você fizer o deploy do seu frontend (Vite/React), as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` precisam estar configuradas no ambiente de build/hospedagem (ex: Netlify, Vercel, Hostinger hPanel). O processo de build do Vite irá embutir esses valores no seu código de frontend.
*   **Segurança da Chave `service_role`:**
    *   **REITERANDO: NUNCA exponha a chave `service_role` no código do frontend.**
    *   Se você adicionar um backend no futuro, ele deverá usar a `service_role` key, e essa chave deve ser armazenada de forma segura como uma variável de ambiente no servidor do backend.
*   **Melhor Prática:**
    *   **Frontend:** Usa a chave `anon` e depende inteiramente das políticas RLS para segurança de dados.
    *   **Backend (se existir):** Usa a chave `service_role` para operações administrativas ou tarefas que exigem privilégios elevados, como batch processing ou interações complexas que não se encaixam bem em RLS simples.
*   **Sugestão para o Futuro (Roles de Administrador):**
    *   Se você precisar de diferentes níveis de administradores (ex: super-admin, editor de conteúdo), você pode:
        1.  Adicionar uma coluna `role` (ex: `TEXT`) na sua tabela `auth.users` (usando os metadados do usuário - `raw_user_meta_data`) ou em uma tabela de perfis separada.
        2.  Modificar suas políticas RLS para verificar esse campo `role`.
            Exemplo de política RLS para permitir SELECT apenas para usuários com `role = 'admin'`:
            ```sql
            CREATE POLICY "Admins can select members"
            ON members FOR SELECT
            TO authenticated
            USING ( (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin' );
            ```
        3.  Você pode definir esse `role` manualmente através do Supabase Studio ou programaticamente (com cuidado) através de uma função de Edge ou backend seguro.

Seguindo este guia, seu projeto Supabase estará configurado de forma segura e funcional para o painel administrativo do Clã GERR.