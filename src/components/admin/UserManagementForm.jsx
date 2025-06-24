import React, { useState, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Loader2 } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { useToast } from '@/components/ui/use-toast';

    const UserManagementForm = ({ isOpen, onOpenChange, onSubmit, isLoading, isEditing, currentUserData }) => {
      const { toast } = useToast();
      const [formEmail, setFormEmail] = useState('');
      const [formPassword, setFormPassword] = useState('');
      const [formRole, setFormRole] = useState('member');
      const [formNome, setFormNome] = useState('');

      useEffect(() => {
        if (isEditing && currentUserData) {
          setFormEmail(currentUserData.email || '');
          setFormRole(currentUserData.role || 'member');
          setFormNome(currentUserData.nome || '');
          setFormPassword(''); // Senha não é preenchida na edição por segurança
        } else {
          setFormEmail('');
          setFormPassword('');
          setFormRole('member');
          setFormNome('');
        }
      }, [isEditing, currentUserData, isOpen]);

      if (!isOpen) return null;

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!formEmail || !formRole || (!isEditing && !formPassword)) {
          toast({ title: "Campos obrigatórios", description: "Email, role e senha (para novos usuários) são necessários.", variant: "destructive" });
          return;
        }
        onSubmit({
          email: formEmail,
          password: formPassword,
          role: formRole,
          nome: formNome,
          userId: isEditing ? currentUserData?.id : undefined,
        });
      };

      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{isEditing ? 'Editar Usuário do Painel' : 'Criar Novo Usuário do Painel'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="formNomePanelUser" className="text-muted-foreground">Nome (Opcional)</Label>
                  <Input id="formNomePanelUser" value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome Completo" className="input-dark"/>
                </div>
                <div>
                  <Label htmlFor="formEmailPanelUser" className="text-muted-foreground">Email</Label>
                  <Input id="formEmailPanelUser" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required placeholder="usuario@example.com" className="input-dark"/>
                </div>
                <div>
                  <Label htmlFor="formPasswordPanelUser" className="text-muted-foreground">
                    Senha {isEditing && '(Deixe em branco para não alterar)'}
                  </Label>
                  <Input id="formPasswordPanelUser" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required={!isEditing} placeholder="••••••••" className="input-dark"/>
                </div>
                <div>
                  <Label htmlFor="formRolePanelUser" className="text-muted-foreground">Role (Permissão)</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger id="formRolePanelUser" className="input-dark"><SelectValue placeholder="Selecione a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="recrutador">Recrutador</SelectItem>
                      <SelectItem value="moderador">Moderador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    export default UserManagementForm;