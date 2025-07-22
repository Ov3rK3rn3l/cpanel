import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, CalendarDays, UserCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AnnouncementsCard = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncementsAndAuthors = useCallback(async () => {
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
        const { data: membersInfo, error: membersError } = await supabase
          .from('members')
          .select('user_id, codinome')
          .in('user_id', userIds);

        if (membersError) {
          console.error("Erro ao buscar codinomes dos autores:", membersError);
        } else {
          const authorsMap = membersInfo.reduce((acc, m) => {
            if (m.user_id) acc[m.user_id] = m.codinome;
            return acc;
          }, {});
          setAuthorsData(authorsMap);
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
    fetchAnnouncementsAndAuthors();
  }, [fetchAnnouncementsAndAuthors]);

  const getAuthorDisplay = (ann) => {
    return authorsData[ann.user_id] || ann.user_email || "Comando";
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
    <Card className="glassmorphic border-primary/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Megaphone className="mr-2 h-6 w-6 text-primary"/>
          Comunicados Importantes
        </CardTitle>
        <CardDescription>As últimas notícias e atualizações do comando.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-80 overflow-y-auto flex-grow">
        {announcements.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center justify-center h-full">
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
                className="p-4 bg-card/50 rounded-lg border border-primary/20 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-primary text-base">{ann.title}</h4>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {new Date(ann.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{ann.content}</p>
                <div className="flex items-center text-xs text-muted-foreground pt-1 border-t border-primary/10">
                  <UserCircle className="mr-1 h-3 w-3" />
                  <span>Publicado por: {getAuthorDisplay(ann)}</span>
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