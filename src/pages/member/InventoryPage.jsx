import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, Calendar, Coins, KeyRound, Eye, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/components/admin/members/utils';
import { Link } from 'react-router-dom';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
  })
};

const InventoryPage = () => {
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchInventory = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) throw memberError || new Error("Membro não encontrado.");

      const { data, error } = await supabase
        .from('purchase_history')
        .select('id, purchase_date, cost, store_items(*), claimed_key_id, store_item_keys(key_value)')
        .eq('member_id', memberData.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      toast({ title: "Erro ao carregar inventário", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRevealKey = (purchaseId) => {
    setRevealedKeys(prev => ({ ...prev, [purchaseId]: true }));
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: "Chave Copiada!", description: "A chave do jogo foi copiada para a área de transferência." });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto py-8 px-2 sm:px-4">
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-accent mb-3 flex items-center justify-center"
        >
          <Package className="h-10 w-10 mr-4" /> Meu Inventário
        </motion.h1>
        <motion.p 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground"
        >
          Aqui estão todos os itens que você adquiriu na loja do clã.
        </motion.p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /><p className="ml-4 text-xl">Carregando seu inventário...</p></div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground">Seu inventário está vazio.</h2>
          <p className="text-muted-foreground mt-2">Visite a loja para adquirir itens e eles aparecerão aqui!</p>
          <Button asChild className="mt-6">
            <Link to="/store">Ir para a Loja</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inventory.map((purchase, i) => (
            <motion.div key={purchase.id} variants={cardVariants} initial="hidden" animate="visible" custom={i}>
              <Card className="h-full flex flex-col glassmorphic-dark-glow group">
                <CardHeader>
                  <div className="aspect-video bg-card/80 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {purchase.store_items?.image_url ? (
                      <img src={purchase.store_items.image_url} alt={purchase.store_items.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-xl text-primary break-all">{purchase.store_items?.name || 'Item desconhecido'}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">{purchase.store_items?.description}</p>
                </CardContent>
                <div className="p-4 pt-2 mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {formatDate(purchase.purchase_date, 'dd/MM/yyyy')}</span>
                    <span className="flex items-center font-semibold text-yellow-400"><Coins className="mr-1.5 h-4 w-4" /> {purchase.cost}</span>
                  </div>
                  {purchase.store_items?.item_type === 'key' && purchase.claimed_key_id && (
                    <div className="pt-3 border-t border-primary/20">
                      {revealedKeys[purchase.id] ? (
                        <div className="p-2 bg-background rounded-md flex items-center justify-between gap-2">
                          <span className="font-mono text-green-400 truncate">{purchase.store_item_keys?.key_value || 'CHAVE-INDISPONIVEL'}</span>
                          <Button size="icon" variant="ghost" onClick={() => handleCopyKey(purchase.store_item_keys?.key_value)}>
                            {copiedKey === purchase.store_item_keys?.key_value ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full" variant="outline" onClick={() => handleRevealKey(purchase.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Revelar Chave
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
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

export default InventoryPage;