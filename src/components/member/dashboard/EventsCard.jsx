import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, Info, CheckCircle, XCircle } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const EventsCard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'Ativo')
                .gt('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(3);

            if (error) {
                console.error('Error fetching events:', error);
                setEvents([]);
            } else {
                setEvents(data);
            }
        } catch (error) {
            console.error('Error in fetchEvents:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <Card className="h-full flex flex-col glassmorphic-dark border-primary/40">
            <CardHeader>
                <CardTitle className="flex items-center text-primary text-2xl">
                    <Calendar className="mr-3 h-6 w-6" />
                    Próximos Eventos do Clã
                </CardTitle>
                <CardDescription>
                    Fique por dentro das próximas instruções e atividades.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                ) : events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map((event, index) => (
                             <motion.div 
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.15 }}
                            >
                                <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-primary/80">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary-foreground text-lg">{event.title}</h4>
                                        <Badge variant={event.status === 'Ativo' ? 'success' : 'destructive'} className="text-xs">
                                            {event.status === 'Ativo' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {format(new Date(event.start_time), "eeee, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                    {event.description && (
                                        <p className="text-sm text-foreground/80 mt-2 italic">"{event.description}"</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-center">
                        <Info className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Nenhum evento programado no momento.</p>
                        <p className="text-xs text-muted-foreground/70">Fique atento para novas atividades!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EventsCard;