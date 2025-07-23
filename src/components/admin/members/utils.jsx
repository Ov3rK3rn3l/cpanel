import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, CheckSquare, MinusCircle, Award } from 'lucide-react';

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

export const PATENTE_ORDER_MAP = {
  "General de Exército": 25,
  "General de Divisão": 24,
  "General de Brigada": 23,
  "Consultor": 22,
  "Oficial Veterano": 21,
  "Veterano": 20,
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

export const GENERAL_RANKS = ["General de Exército", "General de Divisão", "General de Brigada"];

export const MERIT_PATENTS_START_ORDER = PATENTE_ORDER_MAP["Major"];

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
};

export const PROMOTION_THRESHOLDS = Object.keys(PROMOTION_PATENTS).map(Number).sort((a, b) => a - b);

export const PATENTE_OPTIONS = Object.keys(PATENTE_ORDER_MAP)
  .sort((a, b) => PATENTE_ORDER_MAP[b] - PATENTE_ORDER_MAP[a]) 
  .map(patente => ({ value: patente, label: patente }));

export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + userTimezoneOffset);
    return localDate.toISOString().split('T')[0];
  } catch (error) {
    console.error("Erro ao formatar data para input:", error, "Data original:", dateString);
    return '';
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

export const calculateDays = (dateString) => {
  if (!dateString) return 'N/A';
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  let targetDate;

  try {
    targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) throw new Error("Data inválida");
    const userTimezoneOffset = targetDate.getTimezoneOffset() * 60000;
    targetDate = new Date(targetDate.getTime() + userTimezoneOffset);
    targetDate.setUTCHours(0,0,0,0);
  } catch (e) {
    console.error("Erro ao parsear data:", dateString, e);
    return 'Data Inválida';
  }

  const diffTime = today.getTime() - targetDate.getTime(); 
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
  return diffDays;
};

export const getPromotionDisplayInfo = (member, userRole) => {
  const totalPresencas = member.total_presencas || 0;
  const patenteAtual = member.patente_atual || "Reservista";
  const currentPatenteOrder = PATENTE_ORDER_MAP[patenteAtual] || 0;

  if (currentPatenteOrder >= MERIT_PATENTS_START_ORDER) {
    if (userRole === 'admin') {
      const nextPatenteIndex = PATENTE_OPTIONS.findIndex(p => p.value === patenteAtual) - 1;
      if (nextPatenteIndex >= 0) {
        const nextPatente = PATENTE_OPTIONS[nextPatenteIndex].value;
        return { 
          text: <span className="text-purple-400 flex items-center"><Award className="mr-1 h-4 w-4" /> Promover por Mérito</span>, 
          eligible: true, 
          suggested: nextPatente,
          isMerit: true
        };
      }
    }
    return { text: 'Mérito', eligible: false, suggested: null, isMerit: true };
  }

  let suggestedPatenteForThreshold = PROMOTION_PATENTS[0];
  for (const threshold of PROMOTION_THRESHOLDS) {
      if (totalPresencas >= threshold) {
          suggestedPatenteForThreshold = PROMOTION_PATENTS[threshold];
      } else {
          break;
      }
  }
  
  const suggestedPatenteOrder = PATENTE_ORDER_MAP[suggestedPatenteForThreshold] || 0;

  if (suggestedPatenteOrder > currentPatenteOrder) {
     return { text: <span className="text-yellow-500 flex items-center"><AlertTriangle className="mr-1 h-4 w-4" /> Sugerido: {suggestedPatenteForThreshold}</span>, eligible: true, suggested: suggestedPatenteForThreshold, isMerit: false };
  }
  
  return { text: member.promocao_status || patenteAtual || 'N/A', eligible: false, suggested: null, isMerit: false };
};