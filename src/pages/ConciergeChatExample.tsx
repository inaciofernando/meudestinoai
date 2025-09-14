import { useState } from "react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TripData, UserData, ConciergeCategory } from "@/types/concierge";

export default function ConciergeChatExample() {
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ConciergeCategory>('roteiro');

  // Dados mockados para exemplo
  const tripData: TripData = {
    id: "trip_123",
    destination: "Paris, França",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    durationDays: 7,
    destinations: ["Torre Eiffel", "Louvre", "Montmartre"],
    budgetRange: "R$ 5000-8000",
    travelerCount: 2,
    status: "Confirmada"
  };

  const userData: UserData = {
    id: "user_123",
    preferences: {
      cuisine: "italiana",
      activities: "cultura",
      accommodation: "4estrelas"
    }
  };

  const categories = [
    { id: 'roteiro', name: 'Roteiro', icon: '🗺️' },
    { id: 'restaurante', name: 'Restaurante', icon: '🍽️' },
    { id: 'hospedagem', name: 'Hospedagem', icon: '🏨' },
    { id: 'diversos', name: 'Diversos', icon: '✨' }
  ];

  const handleSaveToTrip = (data: any) => {
    console.log('Item salvo na programação:', data);
  };

  if (showChat) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="p-4">
            <ConciergeChat
              category={selectedCategory}
              tripData={tripData}
              userData={userData}
              onClose={() => setShowChat(false)}
              onSaveToTrip={handleSaveToTrip}
            />
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Concierge de Viagem</h1>
            <p className="text-muted-foreground">
              Escolha uma categoria para começar a conversar com seu concierge pessoal
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✈️ {tripData.destination}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {tripData.durationDays} dias • {tripData.travelerCount} pessoa(s)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover-scale"
                    onClick={() => {
                      setSelectedCategory(category.id as ConciergeCategory);
                      setShowChat(true);
                    }}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-primary">1.</span>
                <span>Escolha uma categoria (roteiro, restaurante, hospedagem ou diversos)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-primary">2.</span>
                <span>Faça suas perguntas para o concierge especializado</span>
              </div>
              <div className="flex gap-3">
                <span className="text-primary">3.</span>
                <span>Receba recomendações personalizadas baseadas na sua viagem</span>
              </div>
              <div className="flex gap-3">
                <span className="text-primary">4.</span>
                <span>Salve as sugestões diretamente na programação da sua viagem</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}