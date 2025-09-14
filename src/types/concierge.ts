export interface TripData {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  destinations: string[];
  budgetRange: string;
  travelerCount: number;
  status: string;
}

export interface UserData {
  id: string;
  preferences: Record<string, any>;
}

export interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  saveOptions?: SaveOptions;
}

export interface SaveOptions {
  data: Record<string, any>;
  actions?: ActionButton[];
}

export interface ActionButton {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export type ConciergeCategory = 'restaurante' | 'roteiro' | 'hospedagem' | 'diversos';

export interface ConciergeChatProps {
  category: ConciergeCategory;
  tripData: TripData;
  userData: UserData;
  onClose: () => void;
  onSaveToTrip?: (data: any) => void;
}

export interface ChatPayload {
  user_data: {
    user_id: string;
    session_id: string;
    authenticated: boolean;
    preferences: Record<string, any>;
    timezone: string;
  };
  trip_data: {
    trip_id: string;
    destination: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    destinations: string[];
    budget_range: string;
    traveler_count: number;
    status: string;
    roteiro_destinos: Array<{
      location_name: string;
      location_type: string;
      order_index: number;
      notes?: string;
    }>;
  };
  request_data: {
    category: ConciergeCategory;
    user_message: string;
    conversation_id: string;
    timestamp: string;
    language: string;
  };
}