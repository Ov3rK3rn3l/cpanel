import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2, Edit, Store, Coins, Shield, Package, History, KeyRound, ListPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/components/admin/members/utils';
import { ItemForm } from '@/components/admin/store/ItemForm';
import { Textarea } from '@/components/ui/textarea';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const ManageKeysDialog = ({ item, isOpen, onClose, supabase, toast }) => {
  const [keys, setKeys] = useState([]);
  const [newKeys, setNewKeys] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_item_keys')
        .select('id, key_value, is_claimed, claimed_at, members(codinome)')
        .eq('item_id', item.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar chaves', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [item, supabase, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
    }
  }, [isOpen, fetchKeys]);

  const handleAddKeys = async () => {
    const keysToAdd = newKeys.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysToAdd.length === 0) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('add_keys_to_store_item', { p_item_id: item.id, p_keys: keysToAdd });
      if (error || !data.success) throw error || new Error(data.message);
      
      toast({ title: 'Chaves Adicionadas!', description: `${keysToAdd.length} chave(s) foram adicionadas com sucesso.` });
      setNewKeys('');
      fetchKeys();
    } catch (error) {
      toast({ title: 'Erro ao adicionar chaves', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Chaves: {item?.name}</DialogTitle>
          <DialogDescription>Adicione novas chaves e visualize o status das existentes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Adicionar Novas Chaves</h3>
            <Textarea
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
              placeholder="Cole uma chave por linha..."
              className="min-h-[120px]"
            />
            <Button onClick={handleAddKeys} disabled={saving || !newKeys.trim()} className="mt-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListPlus className="mr-2 h-4 w-4" />}
              Adicionar
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Chaves Existentes ({keys.length})</h3>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {keys.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma chave cadastrada.</p> : keys.map(k => (
                  <div key={k.id} className={`p-2 rounded-md text-sm flex justify-between items-center ${k.is_claimed ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                    <span className="font-mono truncate">{k.key_value}</span>
                    {k.is_claimed ? (
                      <span className="text-xs text-red-300 whitespace-nowrap">Reivindicada por {k.members?.codinome || 'N/A'}</span>
                    ) : (
                      <span className="text-xs text-green-300">Disponível</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StoreManagementPage = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isKeysDialogOpen, setIsKeysDialogOpen] = useState(false);
  const [itemForKeys, setItemForKeys] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*, store_item_keys(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar itens da loja', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleOpenItemForm = (item = null) => { setEditingItem(item); setIsItemFormOpen(true); };
  const handleCloseItemForm = () => { setIsItemFormOpen(false); setEditingItem(null); };
  const onFormSubmitSuccess = () => { handleCloseItemForm(); fetchItems(); };

  const handleOpenKeysDialog = (item) => { setItemForKeys(item); setIsKeysDialogOpen(true); };
  const handleCloseKeysDialog = () => { setIsKeysDialogOpen(false); setItemForKeys(null); fetchItems(); };

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
        <h1 className="text-3xl font-semibold text-foreground flex items-center"><Store className="mr-3 h-8 w-8 text-primary" /> Gerenciamento da Loja</h1>
        <Button onClick={() => handleOpenItemForm(null)} className="btn-primary-dark w-full sm:w-auto"><PlusCircle className="mr-2 h-5 w-5" /> Adicionar Item</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="glassmorphic">
          <CardHeader><CardTitle>Itens da Loja</CardTitle><CardDescription>Lista de todos os itens disponíveis para os membros.</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="ml-3">Carregando itens...</p></div>
            : items.length === 0 ? <div className="text-center py-10"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nenhum item na loja.</p><p className="text-sm text-muted-foreground">Clique em "Adicionar Item" para começar.</p></div>
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.id} variants={cardVariants} initial="hidden" animate="visible" exit="hidden">
                      <Card className={`h-full flex flex-col glassmorphic hover:shadow-primary/20 ${!item.is_active ? 'opacity-50' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl text-primary break-all">{item.name}</CardTitle>
                            <div className="flex items-center text-lg font-bold text-yellow-400"><Coins className="h-5 w-5 mr-1" /> {item.price}</div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mt-2">
                            {item.item_type === 'key' && <span className="badge-key"><KeyRound className="h-3 w-3 mr-1"/>Chave</span>}
                            {item.is_exclusive && <span className="badge-exclusive">Exclusivo</span>}
                            {item.required_patente && <span className="badge-patente"><Shield className="h-3 w-3 mr-1"/>{item.required_patente}</span>}
                            <span className="badge-limit">Limite: {item.purchase_limit === 0 ? 'Ilimitado' : item.purchase_limit}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow"><p className="text-foreground whitespace-pre-wrap break-words line-clamp-3">{item.description}</p></CardContent>
                        <div className="p-4 pt-2 border-t border-border mt-auto flex justify-end space-x-2">
                          {item.item_type === 'key' && <Button variant="outline" size="icon" onClick={() => handleOpenKeysDialog(item)} className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10"><KeyRound className="h-4 w-4" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenItemForm(item)} className="text-primary hover:text-primary-light"><Edit className="h-4 w-4" /></Button>
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
            }
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardHeader><CardTitle className="flex items-center"><History className="mr-2 h-6 w-6 text-primary" /> Histórico de Compras</CardTitle><CardDescription>Compras mais recentes realizadas pelos membros.</CardDescription></CardHeader>
          <CardContent><PurchaseLog supabase={supabase} toast={toast} /></CardContent>
        </Card>
      </div>

      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-primary">{editingItem ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Atualize os detalhes do item.' : 'Preencha os detalhes do novo item da loja.'}</DialogDescription>
          </DialogHeader>
          <ItemForm itemData={editingItem} onSuccess={onFormSubmitSuccess} onCancel={handleCloseItemForm} />
        </DialogContent>
      </Dialog>

      <ManageKeysDialog item={itemForKeys} isOpen={isKeysDialogOpen} onClose={handleCloseKeysDialog} supabase={supabase} toast={toast} />
    </motion.div>
  );
};

const PurchaseLog = ({ supabase, toast }) => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('purchase_history').select('*, members(codinome), store_items(name)').order('purchase_date', { ascending: false }).limit(20);
      if (error) throw error;
      setLog(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar histórico de compras', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  if (loading) return <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>;
  if (log.length === 0) return <p className="text-center text-muted-foreground py-10">Nenhuma compra registrada ainda.</p>;

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {log.map(entry => (
        <div key={entry.id} className="flex items-center justify-between p-3 bg-card/60 rounded-lg border border-primary/20">
          <div className="flex-1">
            <p className="text-sm text-foreground"><span className="font-bold text-primary">{entry.members?.codinome || 'Membro desconhecido'}</span> comprou <span className="font-semibold text-primary-light">"{entry.store_items?.name || 'Item desconhecido'}"</span></p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.purchase_date, 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <div className="flex items-center text-yellow-400 font-semibold"><Coins className="h-4 w-4 mr-1" /> {entry.cost}</div>
        </div>
      ))}
    </div>
  );
};

export default StoreManagementPage;