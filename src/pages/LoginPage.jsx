import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { Mail, Lock, Shield, Loader2 } from 'lucide-react';

    const LoginPage = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const navigate = useNavigate();
      const { login, user, userRole, loading } = useAuth();
      const { toast } = useToast();

      const logoUrl = "gerr-clan-logo.png"; 

      useEffect(() => {
        if (!loading && user) {
          toast({
            title: "Login bem-sucedido!",
            description: "Redirecionando...",
            variant: "default",
          });
          
          if (userRole === 'member') {
            navigate('/dashboard', { replace: true });
          } else if (['admin', 'moderador', 'recrutador'].includes(userRole)) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true }); 
          }
        }
      }, [user, userRole, loading, navigate, toast]);


      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
          await login(email, password);
        } catch (error) {
          console.error("Login error:", error);
          let description = error.message || "Não foi possível fazer login. Verifique suas credenciais.";
          if (error.message && error.message.toLowerCase().includes("email not confirmed")) {
            description = "Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada (e spam) pelo link de confirmação.";
          } else if (error.message && error.message.toLowerCase().includes("invalid login credentials")) {
            description = "Email ou senha incorretos. Por favor, tente novamente.";
          }
          toast({
            title: "Erro no Login",
            description: description,
            variant: "destructive",
          });
          setIsLoading(false);
        }
      };


      return (
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
           <motion.div
            className="absolute inset-0 overflow-hidden -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-10"
              poster="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80"
            >
              <source src="/videos/gerr_hero_background.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="relative z-10"
          >
            <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-md border-border/50 glassmorphic">
              <CardHeader className="text-center">
                <motion.div 
                  initial={{ scale:0, opacity: 0 }} 
                  animate={{ scale:1, opacity: 1 }} 
                  transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness:150 }}
                  className="mx-auto mb-6"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Clã GERR" className="h-20 w-20 animate-float" />
                  ) : (
                    <Shield className="h-20 w-20 text-primary animate-float" />
                  )}
                </motion.div>
                <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                  Área de Membros
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Acesse seu painel GERR.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div 
                    className="space-y-2"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  >
                    <Label htmlFor="email" className="text-muted-foreground flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-primary" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-dark"
                    />
                  </motion.div>
                  <motion.div 
                    className="space-y-2"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  >
                    <Label htmlFor="password" className="text-muted-foreground flex items-center">
                      <Lock className="mr-2 h-4 w-4 text-primary" /> Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-dark"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full btn-primary-dark py-3 text-lg" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Entrar'}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
              <CardFooter className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Painel exclusivo para membros do Clã GERR.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default LoginPage;