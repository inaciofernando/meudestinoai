import { ConciergeCategory } from "@/types/concierge";
import { v4 as uuidv4 } from "uuid";

export const getCategoryData = (category: ConciergeCategory) => {
  const categories = {
    restaurante: { icon: '🍽️', name: 'Restaurante', type: 'restaurante' },
    roteiro: { icon: '🗺️', name: 'Roteiro', type: 'atividade' },
    hospedagem: { icon: '🏨', name: 'Hospedagem', type: 'acomodação' },
    diversos: { icon: '✨', name: 'Diversos', type: 'item' }
  };
  return categories[category] || categories.diversos;
};

export const getQuickSuggestions = (category: ConciergeCategory) => {
  const suggestions = {
    restaurante: [
      'Restaurante italiano romântico',
      'Comida local típica', 
      'Opções vegetarianas',
      'Café da manhã especial'
    ],
    roteiro: [
      'Pontos turísticos famosos',
      'Atividades ao ar livre',
      'Museus e cultura', 
      'Vida noturna'
    ],
    hospedagem: [
      'Hotel 4 estrelas centro',
      'Opções econômicas',
      'Hotel com spa',
      'Perto de atrações'
    ],
    diversos: [
      'Onde comprar souvenirs',
      'Farmácia 24h',
      'Shopping centers',
      'Mercados locais'
    ]
  };
  return suggestions[category] || [];
};

export const getRandomProcessingMessage = () => {
  const messages = [
    'Concierge está procurando as melhores opções...',
    'Analisando recomendações personalizadas...',
    'Consultando bases de dados locais...',
    'Verificando disponibilidade e preços...',
    'Preparando sugestões especiais para você...'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const generateId = () => uuidv4();

export const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short' 
  });
  const end = new Date(endDate).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short' 
  });
  return `${start} - ${end}`;
};

export const getAuthToken = () => {
  // Implementar lógica para obter token de autenticação
  return localStorage.getItem('auth_token') || '';
};