import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plane, Mail, Lock, User, MapPin, Compass, Camera, Heart } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let canceled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!canceled && session) {
        // Defer navigation to avoid potential render race conditions
        setTimeout(() => navigate("/"), 0);
      }
    };

    init();

    // Listen for auth changes (deferred navigation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setTimeout(() => navigate("/"), 0);
      }
    });

    return () => {
      canceled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Erro no login com Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique seu email para redefinir a senha.",
        });
        setShowResetPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-ocean rounded-full blur-sm animate-pulse"></div>
          <div className="absolute top-1/3 right-20 w-12 h-12 bg-gradient-sunset rounded-full blur-sm animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-gradient-nature rounded-full blur-sm animate-pulse delay-500"></div>
          <div className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-ocean rounded-full blur-sm animate-pulse delay-700"></div>
        </div>

        <Card className="w-full max-w-md shadow-travel border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center shadow-travel">
                <Lock className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Digite seu email para receber as instruções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Button type="submit" className="w-full bg-gradient-ocean hover:shadow-travel transition-smooth" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar instruções"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setShowResetPassword(false)}
                >
                  Voltar ao login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-ocean rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-12 h-12 bg-gradient-sunset rounded-full blur-sm animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-gradient-nature rounded-full blur-sm animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-ocean rounded-full blur-sm animate-pulse delay-700"></div>
        
        {/* Travel Icons */}
        <MapPin className="absolute top-32 right-1/4 w-8 h-8 text-primary/20 animate-bounce" />
        <Compass className="absolute bottom-32 left-1/3 w-6 h-6 text-accent/20 animate-pulse delay-300" />
        <Camera className="absolute top-1/2 left-20 w-7 h-7 text-highlight/20 animate-bounce delay-1000" />
        <Heart className="absolute bottom-1/3 right-16 w-5 h-5 text-destructive/20 animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md shadow-travel border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-ocean rounded-full flex items-center justify-center shadow-travel animate-scale-in">
              <Plane className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Travel Manager
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Sua próxima aventura começa aqui ✈️
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-gradient-ocean data-[state=active]:text-primary-foreground">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-ocean data-[state=active]:text-primary-foreground">
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6 mt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Bem-vindo de volta! 👋</h3>
                <p className="text-sm text-muted-foreground">Continue planejando suas aventuras</p>
              </div>
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm p-0 h-auto text-primary hover:text-primary-glow transition-smooth"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
                
                <Button type="submit" className="w-full bg-gradient-ocean hover:shadow-travel transition-smooth" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar na aventura 🚀"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6 mt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Comece sua jornada! ✨</h3>
                <p className="text-sm text-muted-foreground">Crie sua conta e explore o mundo</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-primary/20 focus:border-primary transition-smooth"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-gradient-nature hover:shadow-travel transition-smooth" disabled={loading}>
                  {loading ? "Criando conta..." : "Começar minha jornada 🌟"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">
                  ou continue com
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full mt-6 h-12 border-2 border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-smooth"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">
                {loading ? "Conectando..." : "Continuar com Google"}
              </span>
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Ao criar uma conta, você concorda com nossos{" "}
              <span className="text-primary hover:text-primary-glow cursor-pointer transition-smooth">
                Termos de Uso
              </span>{" "}
              e{" "}
              <span className="text-primary hover:text-primary-glow cursor-pointer transition-smooth">
                Política de Privacidade
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}