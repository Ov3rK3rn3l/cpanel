import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle, Trash2, Edit, Store, Coins, Shield, Package, History, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATENTE_OPTIONS, formatDate } from '@/components/admin/members/utils';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const PurchaseLog = ({ supabase, toast }) => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_history')
        .select('*, members(codinome), store_items(name)')
        .order('purchase_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLog(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar histórico de compras', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>;
  }

  if (log.length === 0) {
    return <p className="text-center text-muted-foreground py-10">Nenhuma compra registrada ainda.</p>;
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {log.map(entry => (
        <div key={entry.id} className="flex items-center justify-between p-3 bg-card/60 rounded-lg border border-primary/20">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-bold text-primary">{entry.members?.codinome || 'Membro desconhecido'}</span> comprou <span className="font-semibold text-primary-light">"{entry.store_items?.name || 'Item desconhecido'}"</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(entry.purchase_date, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <div className="flex items-center text-yellow-400 font-semibold">
            <Coins className="h-4 w-4 mr-1" /> {entry.cost}
          </div>
        </div>
      ))}
    </div>
  );
};

const StoreManagementPage = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar itens da loja', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openDialog = (item = null) => {
    setEditingItem(item ? { ...item } : {
      name: '',
      description: '',
      price: 0,
      image_url: '',
      is_exclusive: false,
      required_patente: null,
      purchase_limit: 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setEditingItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem || !supabase) return;

    setIsSubmitting(true);
    try {
      const payload = { ...editingItem };
      if (payload.required_patente === 'none') {
        payload.required_patente = null;
      }
      
      const { error } = await supabase.from('store_items').upsert(payload);
      if (error) throw error;
      
      toast({ title: 'Sucesso!', description: `Item ${payload.id ? 'atualizado' : 'criado'} com sucesso.` });
      setIsDialogOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      toast({ title: `Erro ao salvar item`, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const { error } = await supabase.from('store_items').delete().eq('id', itemId);
      if (error) throw error;
      toast({ title: 'Item Excluído', description: 'O item foi removido da loja.' });
      fetchItems();
    } catch (error) {
      toast({ title: 'Erro ao excluir', description: "Não foi possível excluir o item. Verifique se ele não possui histórico de compras associado.", variant: 'destructive' });
    }
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <Store className="mr-3 h-8 w-8 text-primary" /> Gerenciamento da Loja
        </h1>
        <Button onClick={() => openDialog()} className="btn-primary-dark w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Item
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle>Itens da Loja</CardTitle>
            <CardDescription>Lista de todos os itens disponíveis para os membros.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="ml-3">Carregando itens...</p></div>
            ) : items.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum item na loja.</p>
                <p className="text-sm text-muted-foreground">Clique em "Adicionar Item" para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.id} variants={cardVariants} initial="hidden" animate="visible" exit="hidden">
                      <Card className={`h-full flex flex-col glassmorphic hover:shadow-primary/20 ${!item.is_active ? 'opacity-50' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl text-primary break-all">{item.name}</CardTitle>
                            <div className="flex items-center text-lg font-bold text-yellow-400">
                              <Coins className="h-5 w-5 mr-1" /> {item.price}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mt-2">
                            {item.is_exclusive && <span className="badge-exclusive">Exclusivo</span>}
                            {item.required_patente && <span className="badge-patente"><Shield className="h-3 w-3 mr-1"/>{item.required_patente}</span>}
                            <span className="badge-limit">Limite: {item.purchase_limit === 0 ? 'Ilimitado' : item.purchase_limit}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-foreground whitespace-pre-wrap break-words line-clamp-3">{item.description}</p>
                        </CardContent>
                        <div className="p-4 pt-2 border-t border-border mt-auto flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(item)} className="text-primary hover:text-primary-light"><Edit className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-red-400"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o item "{item.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center"><History className="mr-2 h-6 w-6 text-primary" /> Histórico de Compras</CardTitle>
            <CardDescription>Compras mais recentes realizadas pelos membros.</CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseLog supabase={supabase} toast={toast} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-primary">{editingItem?.id ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
            <DialogDescription>{editingItem?.id ? 'Atualize os detalhes do item.' : 'Preencha os detalhes do novo item da loja.'}</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nome do Item</Label>
                <Input id="name" value={editingItem.name} onChange={(e) => handleFormChange('name', e.target.value)} required className="input-dark" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={editingItem.description} onChange={(e) => handleFormChange('description', e.target.value)} className="input-dark min-h-[80px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="price">Preço (Moedas)</Label>
                  <Input id="price" type="number" value={editingItem.price} onChange={(e) => handleFormChange('price', parseInt(e.target.value, 10) || 0)} required className="input-dark" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="image_url">URL da Imagem (Opcional)</Label>
                  <Input id="image_url" value={editingItem.image_url} onChange={(e) => handleFormChange('image_url', e.target.value)} className="input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="required_patente">Patente Mínima</Label>
                  <Select value={editingItem.required_patente || 'none'} onValueChange={(value) => handleFormChange('required_patente', value)}>
                    <SelectTrigger className="input-dark"><SelectValue placeholder="Selecione uma patente..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {PATENTE_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="purchase_limit">Limite de Compra por Membro</Label>
                  <Input id="purchase_limit" type="number" value={editingItem.purchase_limit} onChange={(e) => handleFormChange('purchase_limit', parseInt(e.target.value, 10) || 0)} required className="input-dark" />
                  <p className="text-xs text-muted-foreground">Use 0 para ilimitado.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="is_exclusive" checked={editingItem.is_exclusive} onCheckedChange={(checked) => handleFormChange('is_exclusive', checked)} />
                <Label htmlFor="is_exclusive">Item Exclusivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="is_active" checked={editingItem.is_active} onCheckedChange={(checked) => handleFormChange('is_active', checked)} />
                <Label htmlFor="is_active">Item Ativo na Loja</Label>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting} className="btn-primary-dark">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingItem?.id ? 'Salvar Alterações' : 'Adicionar Item'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StoreManagementPage;