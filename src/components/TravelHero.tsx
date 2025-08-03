import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Wallet, FileText } from "lucide-react";
import heroImage from "@/assets/hero-travel.jpg";

export const TravelHero = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
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

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-sky flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard home
  if (user) {
    return (
      <div className="relative min-h-screen bg-gradient-sky">
        {/* Welcome Header for Logged Users */}
        <div className="relative h-96 flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-highlight/40" />
          </div>
          
          <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              Bem-vindo de volta!
            </h1>
            <p className="text-xl mb-6 text-white/90 drop-shadow-md">
              Pronto para sua próxima aventura, {user.user_metadata?.full_name || user.email}?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="hero" 
                variant="travel" 
                className="shadow-float"
                onClick={() => navigate('/viagens')}
              >
                Gerenciar Viagens
              </Button>
              <Button 
                size="hero" 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate('/minhas-viagens')}
              >
                Minhas Viagens
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions for Logged Users */}
        <div className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Acesso Rápido
              </h2>
              <p className="text-lg text-muted-foreground">
                Continue de onde parou ou inicie algo novo
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 text-center hover:shadow-card transition-smooth hover:scale-105 bg-card border-border/50 cursor-pointer"
                  onClick={() => navigate('/viagens')}
                >
                  <div className="w-12 h-12 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
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
  }

  // Landing page for non-logged users
  return (
    <div className="relative min-h-screen bg-gradient-sky">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-highlight/20" />
        </div>
        
        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
            Gerencie Suas
            <span className="block bg-gradient-ocean bg-clip-text text-transparent">
              Viagens dos Sonhos
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md max-w-2xl mx-auto">
            Tudo que você precisa para planejar, organizar e aproveitar suas aventuras ao máximo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="hero" 
              variant="travel" 
              className="shadow-float"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
            </Button>
            <Button size="hero" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Explorar Funcionalidades
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tudo em Um Só Lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplifique o planejamento das suas viagens com ferramentas inteligentes e intuitivas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 text-center hover:shadow-card transition-smooth hover:scale-105 bg-card border-border/50"
              >
                <div className="w-12 h-12 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
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