import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Play } from 'lucide-react';

const QuizSetup = ({ onStart }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    category: 'all',
    difficulty: 'all',
    numQuestions: 5,
  });

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('quiz_questions')
        .select('category');
      if (catError) throw catError;
      const uniqueCategories = [...new Set(catData.map(q => q.category).filter(Boolean))];
      setCategories(uniqueCategories);

      const { data: diffData, error: diffError } = await supabase
        .from('quiz_questions')
        .select('difficulty');
      if (diffError) throw diffError;
      const uniqueDifficulties = [...new Set(diffData.map(q => q.difficulty).filter(Boolean))];
      setDifficulties(uniqueDifficulties);

    } catch (error) {
      toast({ title: "Erro ao carregar filtros", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (value) => {
    handleSettingChange('numQuestions', value[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(settings);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="category-select" className="text-lg text-slate-300 mb-2 block">Categoria</Label>
          <Select value={settings.category} onValueChange={(val) => handleSettingChange('category', val)}>
            <SelectTrigger id="category-select" className="input-dark text-base py-6">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="difficulty-select" className="text-lg text-slate-300 mb-2 block">Dificuldade</Label>
          <Select value={settings.difficulty} onValueChange={(val) => handleSettingChange('difficulty', val)}>
            <SelectTrigger id="difficulty-select" className="input-dark text-base py-6">
              <SelectValue placeholder="Selecione a dificuldade" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todas as Dificuldades</SelectItem>
              {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="num-questions-slider" className="text-lg text-slate-300 mb-4 block">
          Número de Perguntas: <span className="font-bold text-primary">{settings.numQuestions}</span>
        </Label>
        <Slider
          id="num-questions-slider"
          min={1}
          max={20}
          step={1}
          value={[settings.numQuestions]}
          onValueChange={handleSliderChange}
        />
      </div>
      <div className="flex justify-center pt-4">
        <Button type="submit" size="lg" className="btn-primary-dark text-xl font-bold py-8 px-12 rounded-full shadow-xl transform hover:scale-105 transition-transform">
          <Play className="mr-3 h-6 w-6" /> Iniciar Quiz
        </Button>
      </div>
    </form>
  );
};

export default QuizSetup;