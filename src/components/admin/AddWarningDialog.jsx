import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

const WARNING_TYPES = ["Verbal", "Escrita", "Suspensão"];

const AddWarningDialog = ({ isOpen, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState(WARNING_TYPES[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "O motivo da advertência não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const newWarning = {
      tipo,
      motivo,
    };

    onSave(newWarning);
    setIsLoading(false);
    onOpenChange(false);
    setMotivo('');
    setTipo(WARNING_TYPES[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-destructive/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-destructive">Adicionar Advertência</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova advertência. Ela será adicionada ao histórico do membro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <Label htmlFor="tipo" className="text-muted-foreground">Tipo de Advertência</Label>
            <Select name="tipo" value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="input-dark mt-1">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {WARNING_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="motivo" className="text-muted-foreground">Motivo</Label>
            <Textarea
              id="motivo"
              name="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="input-dark mt-1 min-h-[100px]"
              placeholder="Descreva detalhadamente o motivo da advertência..."
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Advertência'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarningDialog;