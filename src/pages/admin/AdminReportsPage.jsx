import React, { useState, useEffect, useCallback } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
    import { Loader2, FileText, ShieldAlert, UserCheck } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Badge } from '@/components/ui/badge';

    const AdminReportsPage = () => {
      const { supabase, user } = useAuth();
      const { toast } = useToast();
      const [appliedAdvertencias, setAppliedAdvertencias] = useState([]);
      const [isLoading, setIsLoading] = useState(true);

      const fetchAppliedAdvertencias = useCallback(async () => {
        if (!supabase || !user) return;
        setIsLoading(true);

        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, codinome, advertencias');

        if (membersError) {
          toast({ title: "Erro ao buscar dados de membros", description: membersError.message, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const myAdvertencias = [];
        membersData.forEach(member => {
          if (member.advertencias && member.advertencias.length > 0) {
            member.advertencias.forEach(adv => {
              if (adv.aplicada_por_id === user.id) {
                myAdvertencias.push({
                  memberCodinome: member.codinome,
                  memberId: member.id,
                  ...adv
                });
              }
            });
          }
        });
        
        myAdvertencias.sort((a, b) => new Date(b.data) - new Date(a.data));
        setAppliedAdvertencias(myAdvertencias);
        setIsLoading(false);

      }, [supabase, user, toast]);

      useEffect(() => {
        fetchAppliedAdvertencias();
      }, [fetchAppliedAdvertencias]);
      
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', { dateStyle: 'short' });
      };

      const getAdvertenciaTipoBadge = (tipo) => {
          let variant = "secondary";
          if (tipo === "Nivel 1") variant = "warning";
          else if (tipo === "Nivel 2") variant = "destructive";
          return <Badge variant={variant} className="whitespace-nowrap text-xs">{tipo}</Badge>;
      }


      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="ml-4 text-xl text-muted-foreground">Carregando seus relatórios...</p>
          </div>
        );
      }

      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-8 px-2 sm:px-4"
        >
          <Card className="glassmorphic border border-primary/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl text-primary flex items-center">
                <FileText className="mr-3 h-8 w-8" /> Meus Relatórios de Atividade
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Visualize as ações administrativas que você realizou, como advertências aplicadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center">
                  <ShieldAlert className="mr-2 h-6 w-6 text-yellow-500" /> Advertências Aplicadas Por Você
                </h2>
                {appliedAdvertencias.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <Table>
                      <TableCaption>Total de {appliedAdvertencias.length} advertência(s) aplicada(s) por você.</TableCaption>
                      <TableHeader>
                        <TableRow className="border-b-primary/40">
                          <TableHead>Data</TableHead>
                          <TableHead>Membro Advertido</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appliedAdvertencias.map((adv, index) => (
                          <TableRow key={index} className="border-b border-primary/20 hover:bg-accent/10">
                            <TableCell className="text-muted-foreground">{formatDate(adv.data)}</TableCell>
                            <TableCell className="font-medium">{adv.memberCodinome}</TableCell>
                            <TableCell>{getAdvertenciaTipoBadge(adv.tipo)}</TableCell>
                            <TableCell className="max-w-sm truncate" title={adv.motivo}>{adv.motivo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-secondary/20 rounded-md">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Você ainda não aplicou nenhuma advertência.</p>
                  </div>
                )}
              </section>
              
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    export default AdminReportsPage;