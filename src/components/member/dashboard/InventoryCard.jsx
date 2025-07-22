import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Calendar, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/components/admin/members/utils';

const InventoryCard = ({ memberData }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!supabase || !memberData?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_history')
        .select('id, purchase_date, cost, store_items(*)')
        .eq('member_id', memberData.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Erro ao buscar inventário:", error);
      toast({ title: "Erro ao carregar inventário", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, memberData?.id, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
            <Package className="mr-2 h-6 w-6 text-primary"/>
            Seu Inventário
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic border-primary/30 h-full">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Package className="mr-2 h-6 w-6 text-primary"/>
          Seu Inventário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {inventory.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">Seu inventário está vazio.</p>
            <p className="text-xs text-muted-foreground mt-1">Visite a loja para adquirir itens!</p>
          </div>
        ) : (
          <AnimatePresence>
            {inventory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-card/60 rounded-lg border border-primary/20 flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-card/80 rounded-md flex items-center justify-center flex-shrink-0">
                  {item.store_items?.image_url ? (
                    <img-replace src={item.store_items.image_url} alt={item.store_items.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-primary text-sm">{item.store_items?.name || 'Item desconhecido'}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.store_items?.description}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {formatDate(item.purchase_date, 'dd/MM/yyyy')}</span>
                    <span className="flex items-center font-semibold text-yellow-500"><Coins className="mr-1 h-3 w-3" /> {item.cost}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryCard;