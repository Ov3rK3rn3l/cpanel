import React, { useState, useEffect, useCallback } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { UserPlus, Search, Loader2 } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';
    import UserManagementTable from '@/components/admin/UserManagementTable';
    import UserManagementForm from '@/components/admin/UserManagementForm';
    import UnlinkedMembersSection from '@/components/admin/UnlinkedMembersSection';
    import DeleteUserDialog from '@/components/admin/DeleteUserDialog';

    const UserManagementPage = () => {
      const { supabase } = useAuth();
      const { toast } = useToast();
      
      const [users, setUsers] = useState([]);
      const [filteredUsers, setFilteredUsers] = useState([]);
      const [membersWithoutPanelAccount, setMembersWithoutPanelAccount] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [isFormProcessing, setIsFormProcessing] = useState(false); // Specific for form
      const [isLinking, setIsLinking] = useState(false); // Specific for linking
      const [searchTerm, setSearchTerm] = useState('');

      const [isFormOpen, setIsFormOpen] = useState(false);
      const [isEditing, setIsEditing] = useState(false);
      const [currentUser, setCurrentUser] = useState(null);

      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [userToDelete, setUserToDelete] = useState(null);

      const fetchPanelUsersAndUnlinkedMembers = useCallback(async () => {
        setIsLoading(true);
        try {
          const { data: panelUsersData, error: panelUsersError } = await supabase
            .from('users')
            .select('*')
            .order('email', { ascending: true });

          if (panelUsersError) throw panelUsersError;
          
          setUsers(panelUsersData || []);
          setFilteredUsers(panelUsersData || []);

          const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('id, codinome, email, user_id')
            .is('data_saida', null) // Apenas membros ativos
            .or('user_id.is.null,email.is.null'); // Membros sem user_id OU sem email cadastrado na tabela 'members'

          if (membersError) throw membersError;
          
          const unlinked = (membersData || []).filter(member => {
            const panelUserExistsForEmail = member.email ? panelUsersData.some(pu => pu.email === member.email && pu.id === member.user_id) : false;
            return (!member.user_id && member.email && !panelUserExistsForEmail) || // Tem email na members, mas não está vinculado ou não existe user no painel com esse email
                   (!member.user_id && !member.email); // Sem user_id e sem email na members
          });
          setMembersWithoutPanelAccount(unlinked);

        } catch (error) {
          toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      }, [supabase, toast]);

      useEffect(() => {
        fetchPanelUsersAndUnlinkedMembers();
      }, [fetchPanelUsersAndUnlinkedMembers]);

      useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = users.filter(item => 
          item.email?.toLowerCase().includes(lowercasedFilter) ||
          item.nome?.toLowerCase().includes(lowercasedFilter) ||
          item.role?.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredUsers(filteredData);
      }, [searchTerm, users]);

      const openCreateForm = () => {
        setCurrentUser(null);
        setIsEditing(false);
        setIsFormOpen(true);
      };

      const openEditForm = (userToEdit) => {
        setCurrentUser(userToEdit);
        setIsEditing(true);
        setIsFormOpen(true);
      };
      
      const handleFormSubmit = async (formData) => {
        setIsFormProcessing(true);
        try {
          const { data: functionResponse, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
            body: JSON.stringify(formData),
          });

          if (functionError) throw functionError;
          if (functionResponse.error) throw new Error(functionResponse.error);

          toast({ 
            title: `Usuário ${formData.userId ? 'Atualizado' : 'Criado'}!`, 
            description: `${functionResponse.message || (formData.userId ? `Usuário ${formData.email} atualizado.` : `Usuário ${formData.email} criado.`)}`, 
            variant: "default" 
          });
          
          setIsFormOpen(false);
          fetchPanelUsersAndUnlinkedMembers(); 
        } catch (err) {
          toast({ title: `Erro ao ${formData.userId ? 'atualizar' : 'criar'} usuário`, description: err.message, variant: "destructive" });
        } finally {
          setIsFormProcessing(false);
        }
      };

      const openDeleteDialog = (user) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
      };

      const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsFormProcessing(true); // Re-use form processing state or create a new one
        try {
          const { data: deleteResponse, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
            body: JSON.stringify({ userIdToDelete: userToDelete.id }),
          });
          
          if (functionError) throw functionError;
          if (deleteResponse.error) throw new Error(deleteResponse.error)

          toast({ title: "Usuário Removido", description: deleteResponse.message || `Usuário ${userToDelete.email} removido.`, variant: "default" });
          fetchPanelUsersAndUnlinkedMembers();
        } catch (err) {
          toast({ title: "Erro ao deletar usuário", description: err.message, variant: "destructive" });
        } finally {
          setIsFormProcessing(false);
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        }
      };

      const handleLinkOrCreatePanelUserForMember = async (member, newEmailForMember = null) => {
        setIsLinking(true);
        const emailToUse = newEmailForMember || member.email;
        
        if (!emailToUse) {
          toast({ title: "Email Necessário", description: `Forneça um email para ${member.codinome} para criar/vincular conta.`, variant: "destructive" });
          setIsLinking(false);
          return;
        }

        if (newEmailForMember && member.email !== newEmailForMember) {
            const { error: memberUpdateError } = await supabase.from('members').update({ email: newEmailForMember }).eq('id', member.id);
            if (memberUpdateError) {
                toast({ title: "Erro ao Atualizar Email do Membro", description: memberUpdateError.message, variant: "destructive" });
                setIsLinking(false); return;
            }
            member.email = newEmailForMember;
        }

        try {
            const { data: existingPanelUser } = await supabase.from('users').select('id').eq('email', emailToUse).maybeSingle();
            if (existingPanelUser) {
                const { error: linkError } = await supabase.from('members').update({ user_id: existingPanelUser.id, email: emailToUse }).eq('id', member.id);
                if (linkError) throw linkError;
                toast({ title: "Vinculado!", description: `${member.codinome} vinculado a ${emailToUse}.`, variant: "default" });
            } else {
                const defaultPassword = `Gerr@${new Date().getFullYear()}!`; 
                const { data: functionData, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
                    body: JSON.stringify({ email: emailToUse, password: defaultPassword, role: 'member', nome: member.codinome }),
                });
                if (functionError) throw functionError;
                if (functionData.error) throw new Error(functionData.error);
                
                const newPanelUserId = functionData.userId;
                if (!newPanelUserId) throw new Error("ID do painel não retornado.");

                const { error: linkError } = await supabase.from('members').update({ user_id: newPanelUserId, email: emailToUse }).eq('id', member.id);
                if (linkError) throw linkError;
                toast({ title: "Conta Criada e Vinculada!", description: `Conta para ${member.codinome} (${emailToUse}) criada. Senha padrão: ${defaultPassword}.`, variant: "default", duration: 10000 });
            }
            fetchPanelUsersAndUnlinkedMembers();
        } catch (err) {
            toast({ title: "Erro na Operação", description: err.message, variant: "destructive" });
        } finally {
            setIsLinking(false);
        }
    };

      return (
        <motion.div 
          className="p-4 sm:p-6 space-y-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Gerenciamento de Usuários do Painel</CardTitle>
                  <CardDescription className="text-muted-foreground">Crie, edite e gerencie os usuários que acessam este painel.</CardDescription>
                </div>
                <Button onClick={openCreateForm} className="btn-primary-dark w-full sm:w-auto" disabled={isFormProcessing || isLinking}>
                  <UserPlus className="mr-2 h-5 w-5" /> Criar Novo Usuário
                </Button>
              </div>
            </CardHeader>
          </Card>

          <AnimatePresence>
            <UserManagementForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSubmit={handleFormSubmit}
              isLoading={isFormProcessing}
              isEditing={isEditing}
              currentUserData={currentUser}
            />
          </AnimatePresence>
          
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Usuários do Painel Existentes</CardTitle>
               <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por email, nome ou role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-dark"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && users.length === 0 && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {!isLoading && filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum usuário encontrado.</p>}
              {filteredUsers.length > 0 && (
                <UserManagementTable 
                  users={filteredUsers}
                  onEdit={openEditForm}
                  onDelete={openDeleteDialog}
                  isLoading={isFormProcessing || isLinking}
                />
              )}
            </CardContent>
          </Card>

          <UnlinkedMembersSection
            members={membersWithoutPanelAccount}
            onLinkOrCreate={handleLinkOrCreatePanelUserForMember}
            isLoading={isLinking}
          />

          <DeleteUserDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            userEmail={userToDelete?.email}
            onConfirmDelete={handleDeleteUser}
            isLoading={isFormProcessing}
          />
        </motion.div>
      );
    };
    export default UserManagementPage;