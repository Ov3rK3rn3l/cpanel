import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const DailyCheckinCard = ({ memberData, onCheckin }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!supabase || !memberData?.id) return;
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_checkin')
        .select('id')
        .eq('member_id', memberData.id)
        .eq('checkin_date', today)
        .maybeSingle();

      if (error) throw error;
      setIsCheckedIn(!!data);
    } catch (error) {
      toast({ title: "Erro ao verificar check-in", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, memberData?.id, toast]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleCheckin = async () => {
    if (!supabase || !memberData?.id) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('log_daily_checkin', {
        p_member_id: memberData.id
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        toast({ title: "Check-in Confirmado!", description: data.message, variant: "default" });
        setIsCheckedIn(true);
        if (onCheckin) onCheckin();
      } else {
        toast({ title: "Check-in Falhou", description: data.message, variant: "destructive" });
        if (data.message.includes('já realizado')) {
          setIsCheckedIn(true);
        }
      }
    } catch (error) {
      toast({ title: "Erro no Check-in", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glassmorphic-dark-glow h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <CalendarCheck className="mr-2 h-6 w-6 text-primary"/>
          Check-in Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <CalendarCheck className="h-20 w-20 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))] mb-4" />
        </motion.div>
        <p className="text-muted-foreground mb-6">
          Marque sua presença diária e ganhe +10 pontos para o ranking!
        </p>
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Button 
            className="btn-primary-dark group w-full max-w-xs"
            onClick={handleCheckin}
            disabled={isCheckedIn || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isCheckedIn ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check-in de hoje concluído!
              </>
            ) : (
              "Confirmar Presença Diária"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyCheckinCard;