import React from 'react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Loader2, Link2 } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';

    const UnlinkedMembersSection = ({ members, onLinkOrCreate, isLoading }) => {
      const { toast } = useToast();

      if (!members || members.length === 0) {
        return null; // Não renderiza nada se não houver membros desvinculados
      }

      return (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-orange-400">Membros Ativos Sem Conta no Painel ou Email</CardTitle>
            <CardDescription className="text-muted-foreground">
              Estes membros ativos não têm um email cadastrado na tabela 'members', ou o email não está vinculado a uma conta de acesso ao painel.
              Você pode definir um email e/ou criar/vincular uma conta para eles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Codinome</TableHead>
                    <TableHead className="font-semibold">Email Atual (na tabela members)</TableHead>
                    <TableHead className="font-semibold text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="py-3">{member.codinome}</TableCell>
                      <TableCell className="py-3">
                        {member.email || <span className="italic text-orange-500">Email não cadastrado</span>}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const newEmail = prompt(`Digite o email para ${member.codinome}:`, member.email || '');
                            if (newEmail === null) return; // User cancelled
                            if (newEmail.trim() === "" && !member.email) {
                                toast({title: "Email Necessário", description: "É preciso fornecer um email.", variant: "destructive"});
                                return;
                            }
                            onLinkOrCreate(member, newEmail.trim() === "" ? null : newEmail.trim());
                          }}
                          className="hover:border-green-500 hover:text-green-500"
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Link2 className="h-4 w-4 mr-1"/>} 
                          {member.email ? 'Vincular/Recriar Conta' : 'Definir Email e Criar Conta'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      );
    };

    export default UnlinkedMembersSection;