import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, Edit, Save, XCircle as CloseIcon, Puzzle, FileQuestion, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATENTE_OPTIONS } from '@/components/admin/members/utils';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const QuizManagementPage = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const fetchQuestions = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar perguntas', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleNewQuestion = () => {
    setEditingQuestion({
      question_text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ],
      category: '',
      difficulty: 'Fácil',
      required_patente: PATENTE_OPTIONS[PATENTE_OPTIONS.length - 1].value // Default to Reservista
    });
  };

  const handleEdit = (question) => {
    setEditingQuestion(JSON.parse(JSON.stringify(question))); // Deep copy
  };
  
  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleQuestionChange = (field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...editingQuestion.options];
    if (field === 'isCorrect') {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setEditingQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (editingQuestion.options.length >= 6) {
        toast({ title: 'Limite de opções', description: 'Você pode adicionar no máximo 6 opções.', variant: 'default'});
        return;
    }
    setEditingQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const removeOption = (index) => {
    if (editingQuestion.options.length <= 2) {
      toast({ title: 'Mínimo de opções', description: 'São necessárias pelo menos 2 opções.', variant: 'default'});
      return;
    }
    const newOptions = editingQuestion.options.filter((_, i) => i !== index);
    if (!newOptions.some(opt => opt.isCorrect)) {
      newOptions[0].isCorrect = true;
    }
    setEditingQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingQuestion || !supabase) return;
    
    if (!editingQuestion.question_text.trim()) {
        toast({ title: 'Erro de Validação', description: 'O texto da pergunta não pode estar vazio.', variant: 'destructive'});
        return;
    }
    if (editingQuestion.options.some(opt => !opt.text.trim())) {
        toast({ title: 'Erro de Validação', description: 'Todas as opções devem ter um texto.', variant: 'destructive'});
        return;
    }
     if (!editingQuestion.options.some(opt => opt.isCorrect)) {
        toast({ title: 'Erro de Validação', description: 'Uma opção deve ser marcada como correta.', variant: 'destructive'});
        return;
    }
    if (!editingQuestion.required_patente) {
        toast({ title: 'Erro de Validação', description: 'Você deve selecionar uma patente para a pergunta.', variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...editingQuestion };
      if (!payload.id) {
        delete payload.id;
      }
      
      const { error } = await supabase.from('quiz_questions').upsert(payload);
      if (error) throw error;
      
      toast({ title: 'Sucesso!', description: `Pergunta ${payload.id ? 'atualizada' : 'criada'} com sucesso.` });
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast({ title: `Erro ao salvar pergunta`, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (questionId) => {
    try {
        const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
        if (error) throw error;
        toast({ title: 'Pergunta Excluída', description: 'A pergunta foi removida permanentemente.'});
        fetchQuestions();
    } catch(error) {
        toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive'});
    }
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <Puzzle className="mr-3 h-8 w-8 text-primary" /> Gerenciamento de Quiz
        </h1>
        {!editingQuestion && (
            <Button onClick={handleNewQuestion} className="btn-primary-dark w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Pergunta
            </Button>
        )}
      </div>

      <AnimatePresence>
        {editingQuestion && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle>{editingQuestion.id ? 'Editando Pergunta' : 'Nova Pergunta'}</CardTitle>
                        <CardDescription>Preencha os campos abaixo, marque a resposta correta e defina a patente alvo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="question_text">Texto da Pergunta</Label>
                                <Textarea id="question_text" value={editingQuestion.question_text} onChange={(e) => handleQuestionChange('question_text', e.target.value)} required className="input-dark min-h-[100px]"/>
                            </div>
                            <div className="space-y-3">
                                <Label>Opções de Resposta</Label>
                                {editingQuestion.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="radio" id={`option_correct_${index}`} name="correct_option" checked={option.isCorrect} onChange={() => handleOptionChange(index, 'isCorrect', true)} className="form-radio h-5 w-5 text-primary bg-secondary border-border focus:ring-primary"/>
                                        <Input type="text" placeholder={`Opção ${index + 1}`} value={option.text} onChange={(e) => handleOptionChange(index, 'text', e.target.value)} required className="input-dark"/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="btn-secondary-dark"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Opção</Button>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="required_patente">Patente Alvo</Label>
                                    <select id="required_patente" value={editingQuestion.required_patente} onChange={(e) => handleQuestionChange('required_patente', e.target.value)} required className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 input-dark">
                                        {PATENTE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="category">Categoria (Opcional)</Label>
                                    <Input id="category" value={editingQuestion.category || ''} onChange={(e) => handleQuestionChange('category', e.target.value)} className="input-dark" />
                                </div>
                                <div>
                                    <Label htmlFor="difficulty">Dificuldade</Label>
                                    <select id="difficulty" value={editingQuestion.difficulty} onChange={(e) => handleQuestionChange('difficulty', e.target.value)} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 input-dark">
                                        <option>Fácil</option>
                                        <option>Médio</option>
                                        <option>Difícil</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" onClick={handleCancelEdit} variant="outline" className="btn-secondary-dark">
                                    <CloseIcon className="mr-2 h-4 w-4"/> Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="btn-primary-dark">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                    Salvar Pergunta
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      <Card className="glassmorphic">
        <CardHeader>
            <CardTitle>Banco de Perguntas</CardTitle>
            <CardDescription>Lista de todas as perguntas cadastradas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="ml-3">Carregando perguntas...</p></div>
            ) : questions.length === 0 ? (
                <div className="text-center py-10">
                    <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                    <p className="text-muted-foreground">Nenhuma pergunta encontrada.</p>
                    <p className="text-sm text-muted-foreground">Clique em "Adicionar Pergunta" para começar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q.id} className="p-4 bg-card/60 rounded-lg border border-border/20 flex justify-between items-center">
                            <div className="flex-1">
                                <p className="font-semibold text-foreground line-clamp-2">{q.question_text}</p>
                                <div className="text-xs text-muted-foreground mt-1 space-x-3">
                                    <span className="flex items-center"><Shield className="h-3 w-3 mr-1 text-primary"/>{q.required_patente || 'N/A'}</span>
                                    {q.category && <span>Categoria: <span className="font-medium text-primary">{q.category}</span></span>}
                                    <span>Dificuldade: <span className="font-medium text-primary">{q.difficulty}</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(q)} className="text-primary hover:text-primary-light">
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-red-400">
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizManagementPage;