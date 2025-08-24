import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentTrips } from "@/components/dashboard/RecentTrips";
import { Button } from "@/components/ui/button";
import { Plus, Bot, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalSpent: 0,
    upcomingTrips: 0,
    savedPlaces: 0,
    collaborators: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't redirect while authentication is still loading
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    loadDashboardData();
  }, [user, authLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      // Load trips
      const { data: trips, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const activeTrips = trips?.filter(trip => {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        return start <= now && end >= now;
      }).length || 0;

      const upcomingTrips = trips?.filter(trip => {
        const start = new Date(trip.start_date);
        return start > now;
      }).length || 0;

      const totalSpent = trips?.reduce((sum, trip) => sum + (trip.total_budget || 0), 0) || 0;

      setStats({
        totalTrips: trips?.length || 0,
        activeTrips,
        upcomingTrips,
        totalSpent,
        savedPlaces: 0, // TODO: implement when places feature exists
        collaborators: 0 // TODO: implement when collaboration feature exists
      });

      setRecentTrips(trips || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dashboardActions = (
    <div className="flex items-center gap-3">
      <Button 
        onClick={() => navigate("/concierge")}
        variant="outline"
        size="sm"
        className="hidden sm:flex"
      >
        <Bot className="w-4 h-4 mr-2" />
        Concierge IA
      </Button>
      <Button 
        onClick={() => navigate("/nova-viagem")}
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova Viagem
      </Button>
    </div>
  );

  return (
    <MainLayout 
      title="Dashboard"
      subtitle="Bem-vindo de volta! Veja o resumo das suas viagens."
      actions={dashboardActions}
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Olá, {user.email?.split('@')[0]}! 👋
              </h2>
              <p className="text-white/90 mb-4">
                Pronto para a próxima aventura? Vamos planejar juntos!
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => navigate("/nova-viagem")}
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Viagem
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate("/concierge")}
                  className="text-white border-white/30 hover:bg-white/20"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Assistente IA
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <DashboardStats stats={stats} />

        {/* Recent Trips and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTrips trips={recentTrips} />
          </div>
          
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => navigate("/nova-viagem")}
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Criar Nova Viagem
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => navigate("/concierge")}
                >
                  <Bot className="w-4 h-4 mr-3" />
                  Concierge IA
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => navigate("/minhas-viagens")}
                >
                  <TrendingUp className="w-4 h-4 mr-3" />
                  Ver Todas as Viagens
                </Button>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-card border-0 bg-gradient-to-br from-highlight/10 to-highlight/5">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  💡 Dica do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use nosso Concierge IA para descobrir restaurantes locais autênticos e atrações escondidas no seu destino!
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigate("/concierge")}
                >
                  Experimentar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
