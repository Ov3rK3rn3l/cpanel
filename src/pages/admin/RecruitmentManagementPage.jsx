import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Search, Edit, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const RecruitmentManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [status, setStatus] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`codinome.ilike.%${searchTerm}%,discord_nick.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar candidaturas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openDialog = (application) => {
    setSelectedApplication(application);
    setNotes(application.recruiter_notes || '');
    setInterviewDate(application.interview_date ? application.interview_date.substring(0, 16) : '');
    setStatus(application.status || 'EM ANÁLISE');
    setIsDialogOpen(true);
  };

  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;
    setLoading(true);

    try {
      const updateData = {
        status,
        recruiter_notes: notes,
        interview_date: interviewDate || null,
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', selectedApplication.id);

      if (error) throw error;
      
      toast({
        title: "Candidatura Atualizada!",
        description: "As informações da candidatura foram salvas.",
      });

      if (status === 'ACEITO-RECRUTAMENTO') {
        await handleApproveRecruitment(selectedApplication.id);
      }

      fetchApplications();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecruitment = async (applicationId) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-update-panel-user', {
        body: JSON.stringify({
          applicationId: applicationId,
          recruiterId: user.id,
        }),
      });

      if (error) throw new Error(`Erro na Edge Function: ${error.message}`);
      if (data.error) throw new Error(`Erro na lógica da Edge Function: ${data.error}`);
      
      toast({
        title: "Membro Aprovado!",
        description: "O novo membro foi criado e adicionado ao clã.",
        className: "bg-green-600 text-white",
      });

    } catch (error) {
       toast({
        title: "Erro ao aprovar membro",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACEITO-RECRUTAMENTO':
      case 'ACEITO':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'RECUSADO':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'EM ANÁLISE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Gestão de Recrutamento
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Analise, gerencie e aprove as novas candidaturas para o GERR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nick ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-dark"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="overflow-x-auto"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codinome</TableHead>
                      <TableHead>Discord</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.codinome}</TableCell>
                        <TableCell>{app.discord_nick}</TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusVariant(app.status)}`}>
                            {app.status.replace('-', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-primary/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Detalhes da Candidatura</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <p><strong>Codinome:</strong> {selectedApplication.codinome}</p>
              <p><strong>Discord:</strong> {selectedApplication.discord_nick} ({selectedApplication.discord_id})</p>
              <p><strong>Email:</strong> {selectedApplication.email}</p>
              <p><strong>Steam:</strong> <a href={selectedApplication.steam_profile_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{selectedApplication.steam_id}</a></p>
              <p><strong>Como conheceu:</strong> {selectedApplication.how_found}</p>
              <p><strong>Disponibilidade:</strong> {selectedApplication.availability}</p>
              <p><strong>Motivo da candidatura:</strong> {selectedApplication.application_reason}</p>
              <div className="space-y-2">
                <label>Status da Candidatura</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="EM ANÁLISE">EM ANÁLISE</SelectItem>
                    <SelectItem value="ACEITO-RECRUTAMENTO">ACEITO-RECRUTAMENTO</SelectItem>
                    <SelectItem value="RECUSADO">RECUSADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="interviewDate">Data da Entrevista</label>
                <Input
                  id="interviewDate"
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="recruiterNotes">Observações do Recrutador</label>
                <Textarea
                  id="recruiterNotes"
                  placeholder="Adicione suas anotações aqui..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateApplication} disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruitmentManagementPage;