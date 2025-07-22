import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Pencil, ExternalLink, UserPlus, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const statusOptions = [
  { value: 'EM ANÁLISE', label: 'Em Análise' },
  { value: 'ACEITO-RECRUTAMENTO', label: 'Apto para Entrevista' },
  { value: 'RECUSADO', label: 'Recusado' },
  { value: 'ACEITO', label: 'Aceito (Membro Criado)' },
];

const RecruitmentManagementPage = () => {
  const { toast } = useToast();
  const { user: recruiterUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [status, setStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, recruiter:recruited_by(nome, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar candidaturas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsProcessing(true);

    try {
        let interviewDateUTC = null;
        if (status === 'ACEITO-RECRUTAMENTO' && interviewDate) {
            const localDate = new Date(interviewDate);
            const offset = 3 * 60; // Brasília Time (UTC-3)
            const utcDate = new Date(localDate.getTime() + offset * 60 * 1000);
            interviewDateUTC = utcDate.toISOString();
        }

        const updateData = {
            status,
            recruiter_notes: recruiterNotes,
            interview_date: interviewDateUTC,
        };

        const { error } = await supabase.from('applications').update(updateData).eq('id', selectedApp.id);
        if (error) throw error;

        toast({ title: 'Sucesso', description: 'Candidatura atualizada.' });
        fetchApplications();
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAcceptAndCreateMember = async () => {
    if (!selectedApp || !selectedApp.password_hash || !recruiterUser) return;
    setIsProcessing(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: selectedApp.email,
        password: selectedApp.password_hash,
        options: {
          data: {
            role: 'member',
            nome: selectedApp.codinome,
          }
        }
      });
      if (authError) throw new Error(`Erro ao criar usuário: ${authError.message}`);
      if (!authData.user) throw new Error("A criação do usuário não retornou um usuário.");

      const { error: memberError } = await supabase.from('members').insert([{
        user_id: authData.user.id,
        codinome: selectedApp.codinome,
        discord_id: selectedApp.discord_id,
        discord_nick: selectedApp.discord_nick,
        email: selectedApp.email,
        steam_id: selectedApp.steam_id,
        steam_profile_url: selectedApp.steam_profile_url,
        data_ingresso: new Date().toISOString().split('T')[0],
        patente_atual: 'Reservista',
        status: 'Ativo',
        points: 0,
        coins: 0,
      }]);
      if (memberError) throw new Error(`Erro ao criar membro: ${memberError.message}`);

      const { error: appUpdateError } = await supabase.from('applications').update({
        status: 'ACEITO',
        recruited_by: recruiterUser.id,
        user_id: authData.user.id
      }).eq('id', selectedApp.id);
      if (appUpdateError) throw new Error(`Erro ao atualizar aplicação: ${appUpdateError.message}`);

      toast({ title: 'Membro Criado!', description: `${selectedApp.codinome} agora é parte do clã.` });
      fetchApplications();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro no Processo', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDialog = (app) => {
    setSelectedApp(app);
    setStatus(app.status || '');
    
    let localInterviewDate = '';
    if (app.interview_date) {
        const utcDate = new Date(app.interview_date);
        const offset = 3 * 60; // Brasília Time (UTC-3)
        const localDate = new Date(utcDate.getTime() - offset * 60 * 1000);
        localInterviewDate = localDate.toISOString().slice(0, 16);
    }
    setInterviewDate(localInterviewDate);

    setRecruiterNotes(app.recruiter_notes || '');
    setIsDialogOpen(true);
  };
  
  const filteredApplications = applications.filter(app =>
    (app.codinome && app.codinome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.discord_id && app.discord_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACEITO-RECRUTAMENTO': return "bg-sky-500/20 text-sky-400";
      case 'ACEITO': return "bg-green-500/20 text-green-400";
      case 'RECUSADO': return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto py-12 px-4 md:px-8"
    >
      <Card className="glassmorphic-dark border-primary/40">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Gerenciamento de Recrutamento</CardTitle>
          <CardDescription>Visualize e gerencie as candidaturas ao clã.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nick ou Discord ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-dark"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Discord</TableHead>
                  <TableHead>Recrutado por</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan="5" className="text-center py-10"><Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" /></TableCell></TableRow>
                ) : filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.codinome}</TableCell>
                      <TableCell>{app.discord_nick} ({app.discord_id})</TableCell>
                      <TableCell>{app.recruiter?.nome || 'N/A'}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>{app.status.replace('-', ' ')}</span></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDialog(app)}>
                          <Pencil className="h-4 w-4 mr-2" /> Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan="5" className="text-center py-10">Nenhuma candidatura encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gray-900/80 backdrop-blur-sm border-primary/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Gerenciar Candidatura de {selectedApp?.codinome}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <p><strong>Email:</strong> {selectedApp.email}</p>
                    <p><strong>Senha:</strong> <span className="italic text-muted-foreground">(Armazenada para criação de conta)</span></p>
                    <p><strong>Steam ID:</strong> {selectedApp.steam_id} 
                      <a href={selectedApp.steam_profile_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">
                        <ExternalLink className="inline h-4 w-4"/>
                      </a>
                    </p>
                    <p><strong>Como conheceu:</strong> {selectedApp.how_found}</p>
                    <p><strong>Disponibilidade:</strong> {selectedApp.availability}</p>
                    <p><strong>Tempo de Jogo:</strong> {selectedApp.total_play_time || 'N/A'}</p>
                    <p className="border p-2 rounded-md bg-background/30"><strong>Motivo:</strong> {selectedApp.application_reason}</p>
                  </div>

                  {/* Right Column */}
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                      <Label htmlFor="status" className="text-lg">Status</Label>
                       <Select value={status} onValueChange={setStatus} disabled={selectedApp.status === 'ACEITO'}>
                        <SelectTrigger className="input-dark">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} disabled={opt.value === 'ACEITO'}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {status === 'ACEITO-RECRUTAMENTO' && (
                      <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}>
                        <Label htmlFor="interviewDate" className="text-lg">Data e Hora da Entrevista</Label>
                        <Input 
                          id="interviewDate"
                          type="datetime-local" 
                          value={interviewDate} 
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="input-dark"
                          disabled={selectedApp.status === 'ACEITO'}
                        />
                      </motion.div>
                    )}
                    
                    <div>
                      <Label htmlFor="recruiterNotes" className="text-lg">Notas do Recrutador</Label>
                      <Textarea 
                        id="recruiterNotes"
                        value={recruiterNotes}
                        onChange={(e) => setRecruiterNotes(e.target.value)}
                        placeholder="Adicione observações aqui..."
                        className="input-dark"
                        disabled={selectedApp.status === 'ACEITO'}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full btn-secondary-dark" disabled={isProcessing || selectedApp.status === 'ACEITO'}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Pencil className="mr-2 h-4 w-4" />}
                        Atualizar Status/Notas
                    </Button>
                  </form>
              </div>

              <div className="border-t border-primary/30 pt-4">
                  <Button
                    onClick={handleAcceptAndCreateMember}
                    className="w-full btn-success-dark text-lg"
                    disabled={isProcessing || selectedApp.status === 'ACEITO'}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                    {selectedApp.status === 'ACEITO' ? 'Membro Já Aceito' : 'ACEITAR E CRIAR MEMBRO'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Esta ação irá criar a conta do usuário e o perfil de membro, marcando a aplicação como finalizada.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default RecruitmentManagementPage;