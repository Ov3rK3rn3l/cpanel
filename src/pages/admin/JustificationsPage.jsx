import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ServerCrash, Laptop as NotebookText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const JustificationsPage = () => {
  const { supabase } = useAuth();
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJustifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('justifications')
          .select('*')
          .order('start_date', { ascending: false });

        if (error) throw error;
        
        setJustifications(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching justifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJustifications();
  }, [supabase]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openJustifications = justifications.filter(j => new Date(j.end_date) >= today);
  const expiredJustifications = justifications.filter(j => new Date(j.end_date) < today);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('pt-BR');
  };

  const renderTable = (data, title) => (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <NotebookText className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Membro</TableHead>
                  <TableHead className="font-semibold">Motivo</TableHead>
                  <TableHead className="font-semibold text-center">Início</TableHead>
                  <TableHead className="font-semibold text-center">Término</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(j => (
                  <TableRow key={j.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{j.member_name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={j.reason}>{j.reason}</TableCell>
                    <TableCell className="text-center">{formatDate(j.start_date)}</TableCell>
                    <TableCell className="text-center">{formatDate(j.end_date)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={new Date(j.end_date) < today ? "secondary" : "default"}>
                        {j.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma justificativa encontrada nesta categoria.</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-destructive bg-destructive/10 rounded-lg p-4">
        <ServerCrash className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Erro ao Carregar Justificativas</h2>
        <p className="text-center mt-2">Não foi possível buscar os dados. Verifique sua conexão ou contate o suporte.</p>
        <p className="text-sm mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-1">
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Abertas ({openJustifications.length})</TabsTrigger>
          <TabsTrigger value="expired">Vencidas ({expiredJustifications.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {renderTable(openJustifications, "Justificativas em Aberto")}
        </TabsContent>
        <TabsContent value="expired" className="mt-4">
          {renderTable(expiredJustifications, "Justificativas Vencidas")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JustificationsPage;