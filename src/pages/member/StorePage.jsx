import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Store, Coins, Shield, Package, Lock, ShoppingCart, CheckCircle, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATENTE_ORDER_MAP } from '@/components/admin/members/utils';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
  })
};

const StorePage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [memberData, setMemberData] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(null);
  const [visualEffects, setVisualEffects] = useState({});

  const fetchData = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoading(true);
    try {
      const memberPromise = supabase.from('members').select('id, patente_atual, coins').eq('user_id', user.id).single();
      const itemsPromise = supabase.from('store_items').select('*, store_item_keys(count), visual_effects(id, name, css_class)').eq('is_active', true).order('price', { ascending: true });
      
      const [{ data: member, error: memberError }, { data: storeItems, error: itemsError }] = await Promise.all([memberPromise, itemsPromise]);

      if (memberError && memberError.code !== 'PGRST116') throw memberError;
      if (itemsError) throw itemsError;
      
      setMemberData(member);
      setItems(storeItems || []);

      const effectsMap = (storeItems || [])
        .filter(item => item.item_type === 'visual_effect' && item.visual_effects)
        .reduce((acc, item) => {
          acc[item.id] = item.visual_effects;
          return acc;
        }, {});
      setVisualEffects(effectsMap);

      if (member) {
        const { data: historyData, error: historyError } = await supabase
          .from('purchase_history')
          .select('item_id')
          .eq('member_id', member.id);
        
        if (historyError) throw historyError;
        
        const historyMap = (historyData || []).reduce((acc, purchase) => {
          acc[purchase.item_id] = (acc[purchase.item_id] || 0) + 1;
          return acc;
        }, {});

        setPurchaseHistory(historyMap);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar a loja', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePurchase = async (item) => {
    if (!memberData) return;
    setIsPurchasing(item.id);
    try {
      const { data, error } = await supabase.rpc('purchase_item', {
        p_member_id: memberData.id,
        p_item_id: item.id
      });

      if (error) throw new Error(error.message);
      
      if (data && data.success) {
        toast({ title: 'Compra Realizada!', description: data.message, variant: 'default' });
        fetchData(); // Refresh data
      } else {
        throw new Error(data.message || 'Ocorreu um erro desconhecido.');
      }

    } catch (error) {
      toast({ title: 'Falha na Compra', description: error.message, variant: 'destructive' });
    } finally {
      setIsPurchasing(null);
    }
  };

  const getPurchaseStatus = (item) => {
    if (!memberData) return { canBuy: false, reason: 'Carregando dados...' };
    
    const memberPatenteOrder = PATENTE_ORDER_MAP[memberData.patente_atual] || 0;
    const requiredPatenteOrder = item.required_patente ? PATENTE_ORDER_MAP[item.required_patente] || 99 : 0;
    
    if (memberPatenteOrder < requiredPatenteOrder) {
      return { canBuy: false, reason: `Requer: ${item.required_patente}` };
    }

    if ((memberData.coins || 0) < item.price) {
      return { canBuy: false, reason: 'Moedas insuficientes' };
    }

    const purchasesMade = purchaseHistory[item.id] || 0;
    if (item.purchase_limit > 0 && purchasesMade >= item.purchase_limit) {
      return { canBuy: false, reason: 'Limite de compras atingido' };
    }
    
    if (item.item_type === 'key') {
        const availableKeys = item.store_item_keys[0]?.count || 0;
        if (availableKeys <= 0) {
            return { canBuy: false, reason: 'Esgotado' };
        }
    }

    return { canBuy: true, reason: '' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto py-8 px-2 sm:px-4">
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent mb-3 flex items-center justify-center"
        >
          <Store className="h-10 w-10 mr-4" /> Loja do Clã G.E.R.R
        </motion.h1>
        <motion.p 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground"
        >
          Use suas moedas para adquirir itens exclusivos e recompensas.
        </motion.p>
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-4 inline-flex items-center justify-center bg-card/80 border border-primary/30 rounded-full px-6 py-2 text-lg font-semibold text-yellow-400"
        >
          <Coins className="h-6 w-6 mr-2" /> Seu Saldo: {isLoading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : (memberData?.coins || 0)}
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /><p className="ml-4 text-xl">Carregando itens...</p></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground">Loja Vazia por Enquanto</h2>
          <p className="text-muted-foreground mt-2">Nenhum item disponível no momento. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {items.map((item, i) => {
              const { canBuy, reason } = getPurchaseStatus(item);
              const purchasesMade = purchaseHistory[item.id] || 0;
              const isSoldOutByLimit = item.purchase_limit > 0 && purchasesMade >= item.purchase_limit;
              const isSoldOutByKey = item.item_type === 'key' && (item.store_item_keys[0]?.count || 0) <= 0;
              const isVisualEffect = item.item_type === 'visual_effect';
              const effect = visualEffects[item.id];

              return (
                <motion.div key={item.id} variants={cardVariants} initial="hidden" animate="visible" custom={i}>
                  <Card className={cn(
                    "h-full flex flex-col glassmorphic-dark-glow group", 
                    (isSoldOutByLimit || isSoldOutByKey) && 'opacity-60',
                    isVisualEffect && 'border-yellow-400/50'
                  )}>
                    <CardHeader className="relative">
                      <div className="aspect-video bg-card/80 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {isVisualEffect && effect ? (
                           <div className={cn("w-full h-full flex items-center justify-center", effect.css_class)}>
                              <div className="w-24 h-24 rounded-full flex items-center justify-center bg-transparent">
                                <Sparkles className="w-12 h-12 text-yellow-300"/>
                              </div>
                           </div>
                        ) : item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <Package className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-xl text-primary break-all">{item.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 text-xs mt-2">
                        {item.item_type === 'key' && <span className="badge-key"><KeyRound className="h-3 w-3 mr-1"/>Chave</span>}
                        {item.item_type === 'visual_effect' && <span className="badge-exclusive"><Sparkles className="h-3 w-3 mr-1"/>Efeito Visual</span>}
                        {item.is_exclusive && item.item_type !== 'visual_effect' && <span className="badge-exclusive">Exclusivo</span>}
                        {item.required_patente && <span className="badge-patente"><Shield className="h-3 w-3 mr-1"/>{item.required_patente}</span>}
                        {item.purchase_limit > 0 && <span className="badge-limit">Restam: {item.purchase_limit - purchasesMade}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">{item.description}</p>
                    </CardContent>
                    <div className="p-4 pt-2 mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-2xl font-bold text-yellow-400">
                          <Coins className="h-6 w-6 mr-2" /> {item.price}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="w-full btn-primary-dark" disabled={!canBuy || isPurchasing === item.id}>
                            {isPurchasing === item.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                             isSoldOutByLimit ? <><CheckCircle className="h-5 w-5 mr-2"/>Adquirido</> :
                             !canBuy ? <><Lock className="h-5 w-5 mr-2"/>{reason}</> : 
                             <><ShoppingCart className="h-5 w-5 mr-2"/>Comprar</>}
                          </Button>
                        </AlertDialogTrigger>
                        {canBuy && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Compra</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você está prestes a comprar "{item.name}" por <span className="font-bold text-yellow-400">{item.price} moedas</span>. Esta ação é irreversível. Deseja continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePurchase(item)} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
       <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button asChild variant="link" className="text-primary-light hover:text-primary transition-colors text-lg">
            <Link to="/dashboard">Voltar ao Painel Principal</Link>
          </Button>
      </motion.div>
    </motion.div>
  );
};

export default StorePage;