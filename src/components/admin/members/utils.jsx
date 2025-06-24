import React from 'react';
    import { CheckCircle, XCircle, AlertTriangle, CheckSquare, MinusCircle } from 'lucide-react';

    export const JOGO_PRINCIPAL_OPTIONS = ["Squad", "Arma Reforger", "Hell Let Loose", "Outro"];
    export const STATUS_OPTIONS = ["Ativo", "Inativo", "Recruta", "Licença", "Desligado", "Outro"];
    
    export const YES_NO_OPTIONS_VALUES = {
      NOT_DEFINED: "not_defined_value",
      SIM: "Sim",
      NAO: "Nao"
    };

    export const YES_NO_OPTIONS = [
        { value: YES_NO_OPTIONS_VALUES.NOT_DEFINED, label: "Nao Definido" },
        { value: YES_NO_OPTIONS_VALUES.SIM, label: "Sim" },
        { value: YES_NO_OPTIONS_VALUES.NAO, label: "Nao" }
    ];

    export const PROMOTION_PATENTS = {
      0: "Reservista",
      15: "Recruta",
      20: "Sd 2ª Classe",
      35: "Sd 1ª Classe",
      45: "Cabo",
      55: "3º Sgt", 
      65: "2º Sgt",
      80: "1º Sgt",
      100: "SubTenente",
      120: "Aluno-Oficial", 
      145: "Aspirante a Oficial",
      160: "2º Tenente",
      180: "1º Tenente",
      250: "Capitão",
      300: "Major",
      350: "Tenente-Coronel",
      400: "Coronel",
      450: "Coronel-Brigadeiro",
      500: "Brigadeiro"
    };

    export const PROMOTION_THRESHOLDS = Object.keys(PROMOTION_PATENTS).map(Number).sort((a, b) => a - b);

    export const PATENTE_ORDER_MAP = {
      "Brigadeiro": 19,
      "Coronel-Brigadeiro": 18,
      "Coronel": 17,
      "Tenente-Coronel": 16,
      "Major": 15,
      "Capitão": 14,
      "1º Tenente": 13,
      "2º Tenente": 12,
      "Aspirante a Oficial": 11,
      "Aluno-Oficial": 10,
      "SubTenente": 9,
      "1º Sgt": 8,
      "2º Sgt": 7,
      "3º Sgt": 6,
      "Cabo": 5,
      "Sd 1ª Classe": 4,
      "Sd 2ª Classe": 3,
      "Recruta": 2,
      "Reservista": 1,
    };

    export const PATENTE_OPTIONS = Object.keys(PATENTE_ORDER_MAP)
      .sort((a, b) => PATENTE_ORDER_MAP[b] - PATENTE_ORDER_MAP[a]) 
      .map(patente => ({ value: patente, label: patente }));

    export const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Ajusta para o fuso horário local para evitar problemas de "um dia a menos"
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);
        return localDate.toISOString().split('T')[0];
      } catch (error) {
        console.error("Erro ao formatar data para input:", error, "Data original:", dateString);
        return ''; // Retorna string vazia em caso de erro
      }
    };
    
    export const formatDate = (dateString, format = 'dd/MM/yyyy') => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        if (format === 'yyyy-MM-dd') {
          return localDate.toISOString().split('T')[0];
        }
        // Padrão dd/MM/yyyy
        const day = String(localDate.getDate()).padStart(2, '0');
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const year = localDate.getFullYear();
        return `${day}/${month}/${year}`;

      } catch (error) {
        console.error("Erro ao formatar data:", error, "Data original:", dateString);
        return 'Data Inválida';
      }
    };
    
    export const renderYesNoIcon = (value) => {
      if (value === null || value === undefined || value === YES_NO_OPTIONS_VALUES.NOT_DEFINED || typeof value !== 'string' || value.trim() === '') {
        return <MinusCircle className="h-5 w-5 text-muted-foreground inline-block" />;
      }
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'sim') {
        return <CheckCircle className="h-5 w-5 text-green-500 inline-block" />;
      }
      if (lowerValue === 'nao' || lowerValue === 'não') {
        return <XCircle className="h-5 w-5 text-red-500 inline-block" />;
      }
      return value; 
    };

    export const calculateDaysSinceLastPresence = (ultimaPresenca) => {
      if (!ultimaPresenca) return 'N/A';
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); 
      let lastPresenceDate;

      try {
        // Tenta criar a data. Se for inválida, o catch pegará.
        lastPresenceDate = new Date(ultimaPresenca);
        if (isNaN(lastPresenceDate.getTime())) throw new Error("Data inválida após construtor");

        // Ajusta para UTC 00:00:00 para comparação correta de dias
        const userTimezoneOffset = lastPresenceDate.getTimezoneOffset() * 60000;
        lastPresenceDate = new Date(lastPresenceDate.getTime() + userTimezoneOffset);
        lastPresenceDate.setUTCHours(0,0,0,0);

      } catch (e) {
        // Se a data original já for YYYY-MM-DD, o construtor pode interpretá-la como UTC.
        // Se falhar, tentamos adicionar T00:00:00Z explicitamente.
        try {
            lastPresenceDate = new Date(ultimaPresenca + 'T00:00:00.000Z');
            if (isNaN(lastPresenceDate.getTime())) throw new Error("Data inválida mesmo com T00Z");
            lastPresenceDate.setUTCHours(0,0,0,0);
        } catch (finalError) {
            console.error("Erro ao parsear data em calculateDaysSinceLastPresence:", ultimaPresenca, finalError);
            return 'Data Inválida';
        }
      }

      const diffTime = today.getTime() - lastPresenceDate.getTime(); 
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
      return diffDays;
    };
        
    export const getSuggestedPromotion = (totalPresencas, currentPatente) => {
      let suggestedPatente = PROMOTION_PATENTS[0]; 
      let nextThresholdAchieved = 0;

      for (const threshold of PROMOTION_THRESHOLDS) {
        if (totalPresencas >= threshold) {
          suggestedPatente = PROMOTION_PATENTS[threshold];
          nextThresholdAchieved = threshold;
        } else {
          break; 
        }
      }
      
      if (currentPatente === suggestedPatente && totalPresencas >= nextThresholdAchieved) {
         const currentIndex = PROMOTION_THRESHOLDS.indexOf(nextThresholdAchieved);
         if (currentIndex < PROMOTION_THRESHOLDS.length - 1) {
            const nextHigherThreshold = PROMOTION_THRESHOLDS[currentIndex+1];
            if (totalPresencas >= nextHigherThreshold) {
                 return PROMOTION_PATENTS[nextHigherThreshold];
            }
         }
        return null; 
      }
      return suggestedPatente;
    };

    export const getPromotionDisplayInfo = (member) => {
      const totalPresencas = member.total_presencas || 0;
      const patenteAtual = member.patente_atual || PROMOTION_PATENTS[0];
      const promocaoStatus = member.promocao_status;

      let suggestedPatenteForThreshold = PROMOTION_PATENTS[0];
      let achievedThreshold = 0;

      for (const threshold of PROMOTION_THRESHOLDS) {
          if (totalPresencas >= threshold) {
              suggestedPatenteForThreshold = PROMOTION_PATENTS[threshold];
              achievedThreshold = threshold;
          } else {
              break;
          }
      }
      
      if (promocaoStatus && promocaoStatus.toLowerCase().startsWith('promovido para')) {
        const promotedToPatente = promocaoStatus.substring('promovido para '.length).trim();
        const promotedThreshold = Object.keys(PROMOTION_PATENTS).find(key => PROMOTION_PATENTS[key] === promotedToPatente);
        if (promotedThreshold && parseInt(promotedThreshold) >= achievedThreshold && PATENTE_ORDER_MAP[promotedToPatente] >= PATENTE_ORDER_MAP[suggestedPatenteForThreshold]) {
           return { text: <span className="text-green-500 flex items-center"><CheckSquare className="mr-1 h-4 w-4" /> {promocaoStatus}</span>, eligible: false, suggested: null };
        }
      }

      const currentPatenteOrder = PATENTE_ORDER_MAP[patenteAtual] || 0;
      const suggestedPatenteOrder = PATENTE_ORDER_MAP[suggestedPatenteForThreshold] || 0;

      if (suggestedPatenteOrder > currentPatenteOrder) {
         return { text: <span className="text-yellow-500 flex items-center"><AlertTriangle className="mr-1 h-4 w-4" /> Sugerido: {suggestedPatenteForThreshold}</span>, eligible: true, suggested: suggestedPatenteForThreshold };
      }
      
      const currentIndex = PROMOTION_THRESHOLDS.indexOf(achievedThreshold);
      if (patenteAtual === suggestedPatenteForThreshold && currentIndex < PROMOTION_THRESHOLDS.length - 1) {
          const nextHigherThreshold = PROMOTION_THRESHOLDS[currentIndex + 1];
          if (totalPresencas >= nextHigherThreshold) {
              const nextPatente = PROMOTION_PATENTS[nextHigherThreshold];
              if (PATENTE_ORDER_MAP[nextPatente] > currentPatenteOrder) {
                 return { text: <span className="text-yellow-500 flex items-center"><AlertTriangle className="mr-1 h-4 w-4" /> Sugerido: {nextPatente}</span>, eligible: true, suggested: nextPatente };
              }
          }
      }

      return { text: promocaoStatus || patenteAtual || 'N/A', eligible: false, suggested: null };
    };