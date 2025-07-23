import React from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

    const TransactionFormDialog = ({
      isOpen,
      onOpenChange,
      onSubmit,
      editingTransaction,
      formData,
      setFormData,
      categories,
      members
    }) => {

      const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
          setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
          setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
      };

      const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
         if (name === 'category_id') {
          const selectedCategory = categories.find(c => c.id === value);
          if (selectedCategory && selectedCategory.default_amount) {
            setFormData(prev => ({ ...prev, amount: Math.abs(selectedCategory.default_amount) }));
          } else if (!editingTransaction) { 
             setFormData(prev => ({ ...prev, amount: '' }));
          }
        }
      };

      const handleSubmitForm = (e) => {
        e.preventDefault();
        onSubmit(formData);
      };
      
      const selectedCategoryDetails = categories.find(c => c.id === formData.category_id);

      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[525px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-primary">{editingTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da transação financeira.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitForm} className="grid gap-4 py-4">
              <div>
                <Label htmlFor="category_id_form" className="text-muted-foreground">Categoria</Label>
                <Select name="category_id" value={formData.category_id} onValueChange={(value) => handleSelectChange('category_id', value)} required>
                  <SelectTrigger id="category_id_form" className="input-dark">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories
                      .filter(cat => cat.id !== null && cat.id !== undefined && cat.id !== "")
                      .map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name} ({cat.type === 'income' ? 'Receita' : 'Despesa'})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {(selectedCategoryDetails?.type === 'income' && (selectedCategoryDetails?.name.toLowerCase().includes('doação') || selectedCategoryDetails?.name.toLowerCase().includes('vip'))) && (
                <div>
                  <Label htmlFor="member_id_form" className="text-muted-foreground">Membro (Opcional)</Label>
                  <Select name="member_id" value={formData.member_id || 'none'} onValueChange={(value) => handleSelectChange('member_id', value === 'none' ? null : value)}>
                    <SelectTrigger id="member_id_form" className="input-dark">
                      <SelectValue placeholder="Selecione um membro (se aplicável)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {members
                        .filter(member => member.id !== null && member.id !== undefined && member.id !== "")
                        .map(member => <SelectItem key={member.id} value={member.id}>{member.codinome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}


              <div>
                <Label htmlFor="transaction_date_form" className="text-muted-foreground">Data da Transação</Label>
                <Input id="transaction_date_form" name="transaction_date" type="date" value={formData.transaction_date} onChange={handleInputChange} className="input-dark" required />
              </div>
              <div>
                <Label htmlFor="description_form" className="text-muted-foreground">Descrição</Label>
                <Input id="description_form" name="description" value={formData.description} onChange={handleInputChange} className="input-dark" placeholder="Ex: Doação de Fulano, Pagamento Servidor Squad" />
              </div>
              <div>
                <Label htmlFor="amount_form" className="text-muted-foreground">Valor (R$)</Label>
                <Input id="amount_form" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} className="input-dark" placeholder="Ex: 50.00" required />
              </div>
              
              {selectedCategoryDetails?.type === 'expense' && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_paid_form" name="is_paid" checked={formData.is_paid} onCheckedChange={(checked) => setFormData(prev => ({...prev, is_paid: Boolean(checked)}))} />
                  <Label htmlFor="is_paid_form" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                    Marcado como Pago?
                  </Label>
                </div>
              )}

              <div>
                <Label htmlFor="proof_file_form" className="text-muted-foreground">Comprovante (PNG, JPG, PDF)</Label>
                <Input id="proof_file_form" name="proof_file" type="file" onChange={handleInputChange} className="input-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" accept=".png,.jpg,.jpeg,.pdf"/>
                {editingTransaction?.proof_url && !formData.proof_file && (
                  <p className="text-xs text-muted-foreground mt-1">Comprovante atual: <a href={editingTransaction.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver arquivo</a>. Envie um novo para substituir.</p>
                )}
              </div>
              
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="btn-secondary-dark">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="btn-primary-dark">{editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };

    export default TransactionFormDialog;