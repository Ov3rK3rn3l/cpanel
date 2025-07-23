import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { motion } from 'framer-motion';
    import { ShoppingCart, PlusCircle, FileText, Edit3, Trash2, Filter, BarChartBig, CalendarClock } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import VipPurchaseFormDialog from '@/components/admin/vips/VipPurchaseFormDialog';
    import ProofViewerDialog from '@/components/admin/treasury/ProofViewerDialog.jsx'; 

    const VipControlPage = () => {
      const { toast } = useToast();
      const { user } = useAuth();
      const [vipPurchases, setVipPurchases] = useState([]);
      const [members, setMembers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [editingPurchase, setEditingPurchase] = useState(null);
      const [isProofModalOpen, setIsProofModalOpen] = useState(false);
      const [currentProofUrl, setCurrentProofUrl] = useState('');

      const [searchTerm, setSearchTerm] = useState('');
      const [filterVipType, setFilterVipType] = useState('all');
      const [filterMonth, setFilterMonth] = useState('all');
      const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

      const vipTypeOptions = ["Squad VIP", "Reforger VIP", "Outro VIP"]; 
      const currentYear = new Date().getFullYear();
      const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
      const monthOptions = [
        { value: 'all', label: 'Todos os Meses' },
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
      ];

      const calculateExpiryDateDisplay = (purchaseDateStr) => {
        if (!purchaseDateStr) return 'N/A';
        try {
          const purchaseDate = new Date(purchaseDateStr + 'T00:00:00Z');
          if (isNaN(purchaseDate.getTime())) return 'Data Inválida';
          const expiryDate = new Date(purchaseDate);
          expiryDate.setDate(expiryDate.getDate() + 30);
          return expiryDate.toLocaleDateString('pt-BR');
        } catch (e) {
          return 'Erro ao calcular';
        }
      };

      const fetchMembers = useCallback(async () => {
        const { data, error } = await supabase.from('members').select('id, codinome').order('codinome');
        if (error) {
          toast({ title: 'Erro ao buscar membros', description: error.message, variant: 'destructive' });
        } else {
          setMembers(data || []);
        }
      }, [toast]);

      const fetchVipPurchases = useCallback(async () => {
        setLoading(true);
        let query = supabase
          .from('vip_purchases')
          .select('*, members(id, codinome)')
          .order('purchase_date', { ascending: false });

        if (searchTerm) {
          query = query.or(`notes.ilike.%${searchTerm}%,members.codinome.ilike.%${searchTerm}%,vip_type.ilike.%${searchTerm}%`);
        }
        if (filterVipType !== 'all') {
          query = query.filter('vip_type', 'eq', filterVipType);
        }
        if (filterYear !== 'all') {
          if (filterMonth !== 'all') {
            const startDate = `${filterYear}-${filterMonth}-01`;
            const endDate = new Date(filterYear, parseInt(filterMonth), 0).toISOString().split('T')[0]; 
            query = query.gte('purchase_date', startDate).lte('purchase_date', endDate);
          } else {
             query = query.gte('purchase_date', `${filterYear}-01-01`).lte('purchase_date', `${filterYear}-12-31`);
          }
        }

        const { data, error } = await query;
        if (error) {
          toast({ title: 'Erro ao buscar compras de VIP', description: error.message, variant: 'destructive' });
        } else {
          setVipPurchases(data || []);
        }
        setLoading(false);
      }, [toast, searchTerm, filterVipType, filterMonth, filterYear]);

      useEffect(() => {
        fetchMembers();
      }, [fetchMembers]);

      useEffect(() => {
        fetchVipPurchases();
      }, [fetchVipPurchases]);

      const resetFormData = () => {
        setEditingPurchase(null);
      };
      
      const handleFormSubmit = async (submittedData) => {
         if (!user) {
          toast({ title: 'Erro de autenticação', description: 'Você precisa estar logado.', variant: 'destructive' });
          return;
        }

        let proofUrl = editingPurchase?.proof_url || null;
        if (submittedData.proof_file) {
          const file = submittedData.proof_file;
          const fileName = `vip_${user.id}_${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('treasury_proofs') 
            .upload(fileName, file);

          if (uploadError) {
            toast({ title: 'Erro no upload do comprovante VIP', description: uploadError.message, variant: 'destructive' });
            return;
          }
          const { data: urlData } = supabase.storage.from('treasury_proofs').getPublicUrl(uploadData.path);
          proofUrl = urlData.publicUrl;
        }
        
        const purchasePayload = {
          member_id: submittedData.member_id || null,
          vip_type: submittedData.vip_type,
          purchase_date: submittedData.purchase_date,
          quantity: parseInt(submittedData.quantity) || 1,
          unit_price: parseFloat(submittedData.unit_price),
          proof_url: proofUrl,
          notes: submittedData.notes,
          created_by: user.id,
        };
        
        let error;
        if (editingPurchase) {
          ({ error } = await supabase.from('vip_purchases').update(purchasePayload).eq('id', editingPurchase.id));
        } else {
          ({ error } = await supabase.from('vip_purchases').insert(purchasePayload));
        }

        if (error) {
          toast({ title: 'Erro ao salvar compra de VIP', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: `Compra de VIP ${editingPurchase ? 'atualizada' : 'adicionada'}!`, variant: 'success' });
          setIsFormOpen(false);
          resetFormData();
          fetchVipPurchases();
        }
      };

      const handleEditPurchase = (purchase) => {
        setEditingPurchase(purchase);
        setIsFormOpen(true);
      };

      const handleDeletePurchase = async (purchaseId) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro de compra de VIP?')) return;
        const { error } = await supabase.from('vip_purchases').delete().eq('id', purchaseId);
        if (error) {
          toast({ title: 'Erro ao excluir compra de VIP', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Compra de VIP excluída!', variant: 'success' });
          fetchVipPurchases();
        }
      };

      const openProofModal = (url) => {
        setCurrentProofUrl(url);
        setIsProofModalOpen(true);
      };

      const totalVipsSold = vipPurchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalVipRevenue = vipPurchases.reduce((sum, p) => sum + p.total_amount, 0);

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-border/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-primary-foreground/90">
                <BarChartBig className="mr-2 h-7 w-7 text-primary"/> Resumo do Controle de VIPs
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Controle de VIPs vendidos e valores gerados (não afeta o saldo da Tesouraria).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-background/30 rounded-lg text-center border border-border/20">
                <p className="text-sm text-muted-foreground">Total de VIPs Vendidos (Período Filtrado)</p>
                <p className="text-3xl font-bold text-primary">
                  {totalVipsSold}
                </p>
              </div>
              <div className="p-4 bg-background/30 rounded-lg text-center border border-border/20">
                <p className="text-sm text-muted-foreground">Valor Total Gerado por VIPs (Período Filtrado)</p>
                <p className="text-3xl font-bold text-primary">R$ {totalVipRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <CardTitle className="text-xl flex items-center text-primary-foreground/90"><ShoppingCart className="mr-2 h-6 w-6 text-primary"/> Registros de Compras de VIP</CardTitle>
                <CardDescription className="text-muted-foreground">Adicione e gerencie os registros de VIPs comprados.</CardDescription>
              </div>
              <Button onClick={() => { resetFormData(); setIsFormOpen(true); }} className="btn-primary-dark w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Compra de VIP
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Input
                  type="text"
                  placeholder="Buscar por membro, tipo ou nota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-dark"
                />
                <Select value={filterVipType} onValueChange={setFilterVipType}>
                  <SelectTrigger className="input-dark"><SelectValue placeholder="Filtrar por Tipo VIP" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {vipTypeOptions
                      .filter(type => type !== null && type !== undefined && type !== "")
                      .map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="input-dark"><SelectValue placeholder="Filtrar por Mês" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {monthOptions
                      .filter(opt => opt.value !== null && opt.value !== undefined && opt.value !== "")
                      .map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="input-dark"><SelectValue placeholder="Filtrar por Ano" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    {yearOptions
                      .filter(year => year !== null && year !== undefined && year !== "")
                      .map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="p-2 text-left font-semibold text-muted-foreground">Data Compra</th>
                      <th className="p-2 text-left font-semibold text-muted-foreground">Data Venc.</th>
                      <th className="p-2 text-left font-semibold text-muted-foreground">Membro</th>
                      <th className="p-2 text-left font-semibold text-muted-foreground">Tipo VIP</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground">Qtd.</th>
                      <th className="p-2 text-right font-semibold text-muted-foreground">Preço Unit.</th>
                      <th className="p-2 text-right font-semibold text-muted-foreground">Valor Total</th>
                      <th className="p-2 text-left font-semibold text-muted-foreground">Notas</th>
                      <th className="p-2 text-center font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && vipPurchases.length === 0 && (
                      <tr><td colSpan="9" className="text-center p-4 text-muted-foreground">Carregando registros de VIP...</td></tr>
                    )}
                    {!loading && vipPurchases.length === 0 && (
                      <tr><td colSpan="9" className="text-center p-4 text-muted-foreground">Nenhum registro de VIP encontrado para os filtros atuais.</td></tr>
                    )}
                    {vipPurchases.map((purchase) => (
                      <motion.tr
                        key={purchase.id}
                        className="border-b border-border/20 hover:bg-secondary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="p-2 text-foreground/80">{new Date(purchase.purchase_date + 'T00:00:00Z').toLocaleDateString('pt-BR')}</td>
                        <td className="p-2 text-foreground/80 flex items-center"><CalendarClock size={14} className="mr-1 text-muted-foreground"/>{calculateExpiryDateDisplay(purchase.purchase_date)}</td>
                        <td className="p-2 text-foreground/80">{purchase.members?.codinome || 'N/A'}</td>
                        <td className="p-2 text-foreground/80">{purchase.vip_type}</td>
                        <td className="p-2 text-center text-foreground/80">{purchase.quantity}</td>
                        <td className="p-2 text-right text-foreground/80">R$ {parseFloat(purchase.unit_price).toFixed(2)}</td>
                        <td className="p-2 text-right font-medium text-accent">R$ {parseFloat(purchase.total_amount).toFixed(2)}</td>
                        <td className="p-2 text-foreground/80 truncate max-w-[150px]" title={purchase.notes}>{purchase.notes || '-'}</td>
                        <td className="p-2 text-center space-x-1">
                          {purchase.proof_url && (
                            <Button variant="ghost" size="icon" onClick={() => openProofModal(purchase.proof_url)} title="Ver Comprovante">
                              <FileText className="h-4 w-4 text-blue-400" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEditPurchase(purchase)} title="Editar">
                            <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePurchase(purchase.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <VipPurchaseFormDialog
            isOpen={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) resetFormData();
            }}
            onSubmit={handleFormSubmit}
            editingPurchase={editingPurchase}
            members={members}
            vipTypeOptions={vipTypeOptions}
          />

          <ProofViewerDialog
            isOpen={isProofModalOpen}
            onOpenChange={setIsProofModalOpen}
            proofUrl={currentProofUrl}
          />

        </motion.div>
      );
    };

    export default VipControlPage;