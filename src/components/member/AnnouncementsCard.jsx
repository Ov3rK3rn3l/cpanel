import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, CalendarDays, UserCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AnnouncementsCard = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncementsAndUsers = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    
    try {
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      const userIds = [...new Set(announcementsData.map(ann => ann.user_id).filter(id => id))];
      if (userIds.length > 0) {
        const { data: usersInfo, error: usersError } = await supabase
          .from('users')
          .select('id, email, nome')
          .in('id', userIds);

        if (usersError) {
          console.error("Erro ao buscar dados dos usuários:", usersError);
        } else {
          const usersMap = usersInfo.reduce((acc, u) => {
            acc[u.id] = u.nome || u.email;
            return acc;
          }, {});
          setUsersData(usersMap);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar comunicados:", error);
      toast({ title: "Erro ao carregar comunicados", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchAnnouncementsAndUsers();
  }, [fetchAnnouncementsAndUsers]);

  const getAuthorDisplay = (ann) => {
    if (ann.user_id && usersData[ann.user_id]) {
      return usersData[ann.user_id];
    }
    if (ann.user_email) return ann.user_email;
    return "Comando";
  };

  if (isLoading) {
    return (
      <Card className="glassmorphic border-primary/30 h-full">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
            <Megaphone className="mr-2 h-6 w-6 text-primary"/>
            Comunicados Importantes
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
          <Megaphone className="mr-2 h-6 w-6 text-primary"/>
          Comunicados Importantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-80 overflow-y-auto">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
            <p className="text-muted-foreground">Nenhum comunicado recente.</p>
          </div>
        ) : (
          <AnimatePresence>
            {announcements.map((ann, index) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-card/50 rounded-lg border border-primary/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-primary text-sm">{ann.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ann.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-3 mb-2">{ann.content}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <UserCircle className="mr-1 h-3 w-3" />
                  Por: {getAuthorDisplay(ann)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsCard;