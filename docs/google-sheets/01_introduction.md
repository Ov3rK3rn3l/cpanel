## Documentação de Integração com Google Sheets via Supabase Edge Functions

    ### Introdução

    Este conjunto de documentos detalha os passos para configurar a API do Google Sheets e Supabase Edge Functions. O objetivo é permitir a sincronização de dados de membros entre o painel administrativo da sua aplicação e uma planilha Google Sheets.

    A integração facilitará o gerenciamento de membros, permitindo que as informações sejam consistentes entre a plataforma interna e a planilha externa, que pode ser usada para outros fins de automação ou visualização.

    **Nome da Planilha (Aba/Sheet) Alvo:** `BotAutomacao`

    **Estrutura de Colunas Esperada na Planilha:**
    *   A - Codinome 🏷️
    *   B - Discord ID 🆔
    *   C - última presença📆
    *   D - Presenças ✅
    *   E - Penúltima presença 🚩
    *   F - Dias ⌛
    *   G - Status
    *   H - ESA 🎖️
    *   I - CFO 🎖️
    *   J - Promover
    *   K - Patente Atual

    Esta documentação está dividida nas seguintes seções:
    1.  **Introdução (este arquivo)**
    2.  Configuração da API Google e Conta de Serviço
    3.  Compartilhamento da Planilha e Configuração de Variáveis
    4.  Criação e Implantação das Supabase Edge Functions
    5.  Detalhes das Edge Functions e Mapeamento de Dados
    6.  Interação Frontend e Considerações Finais

    Prossiga para a próxima seção para iniciar a configuração.