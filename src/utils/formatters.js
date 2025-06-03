/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param {number} value - O valor a ser formatado
 * @returns {string} O valor formatado em reais
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro (dd/mm/yyyy)
 * @param {string|Date} date - A data a ser formatada
 * @returns {string} A data formatada
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

/**
 * Formata uma data e hora para o formato brasileiro (dd/mm/yyyy HH:mm)
 * @param {string|Date} date - A data e hora a ser formatada
 * @returns {string} A data e hora formatada
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}; 