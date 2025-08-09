import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Planejamento() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 md:p-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/viagens")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Planejamento</h1>
              <p className="text-muted-foreground">
                Organize e planeje suas próximas viagens
              </p>
            </div>
          </div>

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