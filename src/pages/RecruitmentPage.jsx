import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, FileText, User, Gamepad, MessageSquare, HelpCircle, Search, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import YouTubeEmbed from '@/components/shared/YouTubeEmbed';

const applicationSchema = z.object({
  codinome: z.string().min(3, "O nick in-game é obrigatório."),
  discord_nick: z.string().min(2, "O nick do Discord é obrigatório."),
  discord_id: z.string().regex(/^\d{17,19}$/, "Insira um ID do Discord válido."),
  steam_id: z.string().regex(/^\d{17}$/, "Insira um SteamID64 válido."),
  steam_profile_url: z.string().url("Insira um URL de perfil Steam válido."),
  how_found: z.string().min(5, "Conte-nos como nos conheceu."),
  availability: z.string().min(10, "Detalhe sua disponibilidade."),
  email: z.string().email("Insira um e-mail válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  total_play_time: z.string().optional(),
  application_reason: z.string().min(10, "O motivo é obrigatório."),
});

const SupportButton = () => (
  <motion.div
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.5, duration: 0.5 }}
    className="fixed bottom-5 right-5 z-50 group"
  >
    <div className="absolute right-full mr-4 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      <p className="font-bold">👨‍💻 Suporte Exclusivo</p>
      <p>Este canal é para dúvidas ou problemas com o alistamento automático. Clique apenas se necessário.</p>
    </div>
    <Link to="https://discord.com/channels/1122569383655510066/1238567838932013158" target="_blank" rel="noopener noreferrer">
      <Button
        className="rounded-full w-16 h-16 bg-gradient-to-tr from-red-500 to-red-700 text-white shadow-2xl hover:scale-110 hover:shadow-red-500/50 transition-all duration-300 redux-hover"
      >
        <HelpCircle className="w-8 h-8" />
      </Button>
    </Link>
  </motion.div>
);

const RecruitmentPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { password, ...applicationData } = formData;
      const { error: appError } = await supabase
        .from('applications')
        .insert([{ 
          ...applicationData,
          password_hash: password, 
          status: 'EM ANÁLISE'
        }]);
      
      if (appError) throw new Error(`Erro ao salvar formulário: ${appError.message}`);

      toast({
        title: "Formulário Enviado!",
        description: "Sua candidatura foi recebida. Boa sorte, recruta!",
        className: "bg-green-600 text-white",
      });
      setSubmitted(true);
      setApplicationStatus({ status: 'EM ANÁLISE' });
    } catch (error) {
      toast({
        title: "Erro no Envio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStatus = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearching(true);
    setApplicationStatus(null);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status, interview_date, recruiter_notes')
        .eq('email', searchEmail)
        .single();
      
      if (error || !data) throw new Error("Aplicação não encontrada ou e-mail incorreto.");
      
      setApplicationStatus(data);

    } catch (error) {
      toast({
        title: "Erro na Busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACEITO-RECRUTAMENTO': return 'text-green-400';
      case 'ACEITO': return 'text-green-400';
      case 'RECUSADO': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Card className="glassmorphic-dark border-primary/40 shadow-2xl">
          <CardHeader className="text-center">
            <FileText className="mx-auto h-16 w-16 text-primary" />
            <CardTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Formulário de Ingresso GERR
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Preencha os campos abaixo para se candidatar ao nosso clã.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {submitted || applicationStatus ? (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-6"
                >
                  <h3 className="text-2xl font-bold text-green-400">Formulário Enviado com Sucesso!</h3>
                  <p className="text-muted-foreground">Você será notificado em nosso Discord sobre os próximos passos.</p>
                  
                  <Card className="max-w-md mx-auto bg-background/50">
                    <CardHeader>
                      <CardTitle>Status da sua Aplicação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-lg">
                        Status: <span className={`font-bold ${getStatusColor(applicationStatus?.status)}`}>{applicationStatus?.status?.replace('-', ' ')}</span>
                      </p>
                      {applicationStatus?.status === 'ACEITO-RECRUTAMENTO' && applicationStatus.interview_date && (
                        <p className="text-lg">
                          Entrevista: <span className="font-bold text-cyan-400">{new Date(applicationStatus.interview_date).toLocaleString('pt-BR')}</span>
                        </p>
                      )}
                       {applicationStatus?.recruiter_notes && (
                        <p className="text-sm italic text-muted-foreground">
                          Observação: {applicationStatus.recruiter_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold border-b border-primary/30 pb-2 flex items-center"><User className="mr-2 text-primary"/>INFORMAÇÕES PESSOAIS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label htmlFor="codinome">Nick (in-game)</Label><Input id="codinome" {...register("codinome")} />{errors.codinome && <p className="text-red-500 text-sm">{errors.codinome.message}</p>}</div>
                      <div><Label htmlFor="discord_nick">Nick (Discord)</Label><Input id="discord_nick" {...register("discord_nick")} />{errors.discord_nick && <p className="text-red-500 text-sm">{errors.discord_nick.message}</p>}</div>
                      <div><Label htmlFor="discord_id">Discord ID</Label><Input id="discord_id" {...register("discord_id")} />{errors.discord_id && <p className="text-red-500 text-sm">{errors.discord_id.message}</p>}</div>
                      <div><Label htmlFor="steam_id">SteamID64</Label><Input id="steam_id" {...register("steam_id")} />{errors.steam_id && <p className="text-red-500 text-sm">{errors.steam_id.message}</p>}</div>
                      <div className="md:col-span-2"><Label htmlFor="steam_profile_url">URL do Perfil Steam</Label><Input id="steam_profile_url" {...register("steam_profile_url")} />{errors.steam_profile_url && <p className="text-red-500 text-sm">{errors.steam_profile_url.message}</p>}</div>
                      <div className="md:col-span-2"><Label htmlFor="how_found">Como conheceu o GERR?</Label><Input id="how_found" {...register("how_found")} />{errors.how_found && <p className="text-red-500 text-sm">{errors.how_found.message}</p>}</div>
                      <div className="md:col-span-2"><Label htmlFor="availability">Disponibilidade (dias e horários)</Label><Input id="availability" {...register("availability")} />{errors.availability && <p className="text-red-500 text-sm">{errors.availability.message}</p>}</div>
                      <div><Label htmlFor="email">E-mail (para login)</Label><Input type="email" id="email" {...register("email")} />{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}</div>
                      <div><Label htmlFor="password">Senha (para login)</Label><Input type="password" id="password" {...register("password")} />{errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <h3 className="text-2xl font-semibold border-b border-primary/30 pb-2 flex items-center"><Gamepad className="mr-2 text-primary"/>INFORMAÇÕES DE JOGOS</h3>
                     <div>
                       <Label htmlFor="total_play_time">Tempo total de jogo no Squad (ou outro jogo principal)</Label>
                       <Input id="total_play_time" {...register("total_play_time")} />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-2xl font-semibold border-b border-primary/30 pb-2 flex items-center"><MessageSquare className="mr-2 text-primary"/>RESUMO PESSOAL</h3>
                     <div>
                       <Label htmlFor="application_reason">Motivo ao se candidatar</Label>
                       <Textarea id="application_reason" {...register("application_reason")} />
                       {errors.application_reason && <p className="text-red-500 text-sm">{errors.application_reason.message}</p>}
                     </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full btn-primary-dark text-lg py-6">
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
                    Enviar Candidatura
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mt-12"
      >
        <Card className="glassmorphic-dark border-primary/40 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              <Youtube className="mr-2 text-primary"/> COMO ENCONTRAR SEU STEAMID64
            </CardTitle>
          </CardHeader>
          <CardContent>
            <YouTubeEmbed videoId="r1kG1b_2d-A" title="Como encontrar seu SteamID64" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="mt-12"
      >
        <Card className="glassmorphic-dark border-primary/40 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              <Search className="mr-2 text-primary"/> Consultar Status da Candidatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchStatus} className="flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto">
              <Input 
                type="email"
                placeholder="Digite seu e-mail de cadastro"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="input-dark flex-grow"
              />
              <Button type="submit" disabled={searching} className="btn-secondary-dark w-full sm:w-auto">
                {searching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <SupportButton />
    </div>
  );
};

export default RecruitmentPage;