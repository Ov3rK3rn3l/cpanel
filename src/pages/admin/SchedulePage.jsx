import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Calendar as CalendarIcon, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const CalendarView = ({ events, onDayClick, currentDate }) => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const firstDayOfCalendar = startOfWeek(firstDayOfMonth);
    const lastDayOfCalendar = endOfWeek(lastDayOfMonth);
    const days = eachDayOfInterval({ start: firstDayOfCalendar, end: lastDayOfCalendar });
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const eventsByDate = useMemo(() => {
        const map = new Map();
        events.forEach(event => {
            if (event.status === 'Ativo') {
                const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey).push(event);
            }
        });
        return map;
    }, [events]);

    return (
        <div className="p-2 sm:p-4 bg-background/30 rounded-lg border border-primary/20">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm font-semibold text-primary mb-2">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const hasEvent = eventsByDate.has(dateKey);
                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(day)}
                            className={cn(
                                "relative aspect-square flex items-center justify-center rounded-md sm:rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-primary",
                                !isSameMonth(day, currentDate) && "text-muted-foreground/40",
                                isSameDay(day, new Date()) && "bg-primary/20",
                                hasEvent && "bg-green-500/80 hover:bg-green-500",
                            )}
                        >
                            <span className={cn("z-10 font-medium text-xs sm:text-sm", hasEvent ? "text-white" : "text-foreground")}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SchedulePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('Ativo');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, author:users(nome)')
        .order('start_time', { ascending: true });
      if (error) throw error;
      setEvents(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar eventos', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resetForm = () => {
    setCurrentEvent(null);
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setStatus('Ativo');
  };

  const openDialog = (event = null) => {
    if (event) {
      setCurrentEvent(event);
      setTitle(event.title);
      setDescription(event.description || '');
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      setStartTime(new Date(eventStart.getTime() - eventStart.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setEndTime(new Date(eventEnd.getTime() - eventEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setStatus(event.status || 'Ativo');
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (eventId) => {
    if (!user) return;
    try {
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Evento excluído.' });
        fetchEvents();
    } catch (error) {
        toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast({ title: 'Erro de Validação', description: 'A data de término deve ser posterior à data de início.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    try {
        const { data: conflictingEvents, error: conflictError } = await supabase
            .from('events')
            .select('id, title')
            .eq('status', 'Ativo')
            .neq('id', currentEvent?.id || '00000000-0000-0000-0000-000000000000')
            .filter('start_time', 'lt', end.toISOString())
            .filter('end_time', 'gt', start.toISOString());
        
        if (conflictError) throw conflictError;

        if (status === 'Ativo' && conflictingEvents && conflictingEvents.length > 0) {
            toast({
                title: 'Conflito de Agendamento',
                description: `Já existe um evento ativo ("${conflictingEvents[0].title}") neste horário.`,
                variant: 'destructive',
            });
            setIsProcessing(false);
            return;
        }

        const eventData = {
            title,
            description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status,
            created_by: user.id,
        };

        if (currentEvent) {
            const { error } = await supabase.from('events').update(eventData).eq('id', currentEvent.id);
            if (error) throw error;
            toast({ title: 'Sucesso', description: 'Evento atualizado.' });
        } else {
            const { error } = await supabase.from('events').insert(eventData);
            if (error) throw error;
            toast({ title: 'Sucesso', description: 'Evento criado.' });
        }
        
        fetchEvents();
        setIsDialogOpen(false);
        resetForm();

    } catch (error) {
        toast({ title: 'Erro ao salvar evento', description: error.message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
  };

  const eventsForSelectedDate = useMemo(() => {
    return events.filter(event => isSameDay(new Date(event.start_time), selectedDate)).sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
  }, [events, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto py-8 px-2 sm:px-4 md:px-6"
    >
      <Card className="glassmorphic-dark border-primary/40">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">Agenda de Eventos</CardTitle>
            <CardDescription>Organize e visualize as instruções e eventos do clã.</CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="btn-primary-dark mt-4 md:mt-0">
            <PlusCircle className="mr-2 h-5 w-5" /> Novo Evento
          </Button>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

          {loading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          ) : (
            <>
                <CalendarView events={events} onDayClick={setSelectedDate} currentDate={currentDate} />
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-primary mb-4 border-b border-primary/20 pb-2">
                        Eventos para {format(selectedDate, 'PPP', { locale: ptBR })}
                    </h3>
                    {eventsForSelectedDate.length > 0 ? (
                        <div className="space-y-4">
                            {eventsForSelectedDate.map(event => (
                                <Card key={event.id} className="bg-background/50 hover:bg-background/70 transition-colors duration-300 border-l-4 border-primary">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl text-primary-foreground">{event.title}</CardTitle>
                                            <Badge variant={event.status === 'Ativo' ? 'success' : 'destructive'}>
                                                {event.status === 'Ativo' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                {event.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground pt-1">
                                            {format(new Date(event.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(event.end_time), 'HH:mm', { locale: ptBR })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-foreground/80">{event.description || 'Sem descrição.'}</p>
                                        <p className="text-xs text-muted-foreground">Criado por: {event.author?.nome || 'Desconhecido'}</p>
                                        <div className="flex justify-end space-x-2 pt-2">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(event)}><Edit className="h-4 w-4 text-blue-400"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Nenhum evento para esta data.</p>
                        </div>
                    )}
                </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gray-900/80 backdrop-blur-sm border-primary/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">{currentEvent ? 'Editar Evento' : 'Criar Novo Evento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="title">Título do Evento</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-dark"/>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="(Opcional)" className="input-dark"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start_time">Início</Label>
                    <Input id="start_time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="input-dark"/>
                </div>
                <div>
                    <Label htmlFor="end_time">Fim</Label>
                    <Input id="end_time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="input-dark"/>
                </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="input-dark">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="btn-primary-dark" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {currentEvent ? 'Salvar Alterações' : 'Criar Evento'}
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SchedulePage;