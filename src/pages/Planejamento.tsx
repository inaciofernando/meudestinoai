import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Planejamento() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Planejamento"
        subtitle="Organize e planeje suas próximas viagens"
        onBack={() => navigate("/viagens")}
      >
        <div className="space-y-6">
          {/* Under Construction Card */}
          <div className="p-4 md:p-6">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Em Construção</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Em desenvolvimento</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/viagens")}
                  className="w-full"
                >
                  Voltar ao Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}