import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Wallet, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TravelHero = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: MapPin,
      title: "Roteiros Personalizados",
      description: "Crie itinerários detalhados para suas viagens"
    },
    {
      icon: Calendar,
      title: "Planejamento Completo",
      description: "Organize suas viagens futuras e mantenha histórico"
    },
    {
      icon: Wallet,
      title: "Controle Financeiro",
      description: "Gerencie orçamentos e acompanhe gastos em tempo real"
    },
    {
      icon: FileText,
      title: "Documentos Seguros",
      description: "Mantenha todos os documentos importantes organizados"
    }
  ];

  const handleStartNow = () => {
    navigate('/viagens');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Gerencie Suas
            <span className="block text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text mt-2">
              Viagens dos Sonhos
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para planejar, organizar e aproveitar suas aventuras ao máximo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleStartNow}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/viagens')}
              className="border-primary text-primary hover:bg-primary/5"
            >
              Explorar Funcionalidades
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo em Um Só Lugar
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplifique o planejamento das suas viagens com ferramentas inteligentes e intuitivas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card border border-border"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};