import { useState, useEffect } from "react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Settings, LogOut, Moon, Sun, ChevronRight, Bell, Edit } from "lucide-react";
import { AISettings } from "@/components/AISettings";
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
        ai_api_key: ''
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
      <PWALayout showHeader={true}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/viagens")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Perfil</h1>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {getInitials(profile?.full_name || 'Usuario')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{profile?.full_name || 'Nome não informado'}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-muted-foreground">{profile?.phone || 'Telefone não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações da Conta</h3>
              
              <Card>
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-14 px-4 rounded-none"
                    onClick={() => setIsEditing(true)}
                  >
                    <div className="flex items-center gap-3">
                      <Edit className="w-5 h-5" />
                      <span>Editar Perfil</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon className="w-5 h-5" />
                      ) : (
                        <Sun className="w-5 h-5" />
                      )}
                      <div>
                        <p className="font-medium">Modo Escuro</p>
                        <p className="text-sm text-muted-foreground">
                          Alterne entre modo claro e escuro
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Settings */}
              <AISettings 
                profile={profile}
                setProfile={setProfile}
                onSave={handleSaveProfile}
                saving={saving}
              />

              {/* Support Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Suporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Precisa de ajuda? Entre em contato conosco
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}