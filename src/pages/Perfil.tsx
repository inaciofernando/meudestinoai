import { useState, useEffect } from "react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Settings, LogOut, Moon, Sun, ChevronRight, Bell, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  theme_mode: 'light' | 'dark';
  ai_model: string;
  ai_api_key: string;
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      // Se não existe perfil, criar um novo
      if (!data) {
        await createProfile();
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const newProfile = {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: '',
        theme_mode: 'light' as const,
        ai_model: 'gemini-2.5-flash',
        ai_api_key: '',
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      setProfile(data as Profile);
      toast.success('Perfil criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      toast.error('Erro ao criar perfil');
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          theme_mode: profile.theme_mode,
          ai_model: profile.ai_model,
          ai_api_key: profile.ai_api_key,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Atualizar no perfil local também
    if (profile) {
      setProfile({ ...profile, theme_mode: newTheme });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="p-4 md:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (isEditing) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">Editar Perfil</h1>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Edit Form */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={profile?.full_name || ''}
                      onChange={(e) => profile && setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profile?.phone || ''}
                      onChange={(e) => profile && setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Digite seu telefone"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Minha Conta"
        onBack={() => navigate("/viagens")}
      >
        <div className="space-y-0">
          {/* Profile Header with Avatar */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(profile?.full_name || 'Usuario')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{profile?.full_name || 'Fernando'}</h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Main Action Cards Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3">
              <Card 
                className="p-4 text-center cursor-pointer hover:bg-muted/50"
                onClick={() => setIsEditing(true)}
              >
                <CardContent className="p-0">
                  <Edit className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Meu Perfil</span>
                </CardContent>
              </Card>
              
              <Card 
                className="p-4 text-center cursor-pointer hover:bg-muted/50" 
                onClick={() => navigate("/minhas-viagens")}
              >
                <CardContent className="p-0">
                  <Settings className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Minhas Viagens</span>
                </CardContent>
              </Card>

              <Card className="p-4 text-center cursor-pointer hover:bg-muted/50">
                <CardContent className="p-0">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Notificações</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="bg-background">
            <div className="space-y-0">
              {/* AI Settings */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Configurações de IA</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Theme Toggle */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Modo Escuro</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>

              {/* Edit Profile */}
              <div 
                className="px-6 py-4 border-b border-border flex items-center justify-between cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Editar Perfil</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Support */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Suporte</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Privacy */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Privacidade</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* About */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Sobre o App</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Sign Out */}
              <div 
                className="px-6 py-4 border-b border-border flex items-center justify-between cursor-pointer"
                onClick={handleSignOut}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Sair da Conta</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}