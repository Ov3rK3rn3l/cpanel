import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const VipPurchaseFormDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  editingPurchase,
  members,
  vipTypeOptions
}) => {
  const initialFormData = {
    member_id: '',
    vip_type: vipTypeOptions.length > 0 ? vipTypeOptions[0] : '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '', // Novo campo
    quantity: '1',
    unit_price: '15.00', 
    proof_file: null,
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  const calculateExpiryDate = (purchaseDateStr) => {
    if (!purchaseDateStr) return '';
    try {
      const purchaseDate = new Date(purchaseDateStr + 'T00:00:00Z'); // Assegura que é UTC para consistência
      if (isNaN(purchaseDate.getTime())) return '';
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate.toISOString().split('T')[0];
    } catch (e) {
      return ''; // Em caso de data inválida
    }
  };

  useEffect(() => {
    if (editingPurchase) {
      const purchaseDate = editingPurchase.purchase_date || new Date().toISOString().split('T')[0];
      setFormData({
        member_id: editingPurchase.member_id || '',
        vip_type: editingPurchase.vip_type,
        purchase_date: purchaseDate,
        expiry_date: calculateExpiryDate(purchaseDate),
        quantity: editingPurchase.quantity.toString(),
        unit_price: parseFloat(editingPurchase.unit_price).toFixed(2),
        proof_file: null,
        notes: editingPurchase.notes || ''
      });
    } else {
      const defaultPurchaseDate = new Date().toISOString().split('T')[0];
      setFormData({
        ...initialFormData,
        purchase_date: defaultPurchaseDate,
        expiry_date: calculateExpiryDate(defaultPurchaseDate)
      });
    }
  }, [editingPurchase, isOpen, vipTypeOptions]);

  useEffect(() => {
    // Atualiza data de vencimento quando data de compra muda
    setFormData(prev => ({
      ...prev,
      expiry_date: calculateExpiryDate(prev.purchase_date)
    }));
  }, [formData.purchase_date]);


  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    // Excluir expiry_date do formData antes de submeter, pois não é salvo no banco
    const { expiry_date, ...dataToSubmit } = formData;
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">{editingPurchase ? 'Editar Compra de VIP' : 'Adicionar Nova Compra de VIP'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da compra de VIP. A data de vencimento é calculada automaticamente (30 dias).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitForm} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="member_id_vip_form" className="text-muted-foreground">Membro (Opcional)</Label>
            <Select name="member_id" value={formData.member_id || ''} onValueChange={(value) => handleSelectChange('member_id', value === 'none' ? null : value)}>
              <SelectTrigger id="member_id_vip_form" className="input-dark">
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="none">Nenhum / Anônimo</SelectItem>
                {members.map(member => <SelectItem key={member.id} value={member.id}>{member.codinome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vip_type_form" className="text-muted-foreground">Tipo de VIP</Label>
            <Select name="vip_type" value={formData.vip_type} onValueChange={(value) => handleSelectChange('vip_type', value)} required>
              <SelectTrigger id="vip_type_form" className="input-dark">
                <SelectValue placeholder="Selecione o tipo de VIP" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {vipTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_date_vip_form" className="text-muted-foreground">Data da Compra</Label>
              <Input id="purchase_date_vip_form" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} className="input-dark" required />
            </div>
            <div>
              <Label htmlFor="expiry_date_vip_form" className="text-muted-foreground">Data de Vencimento (VIP)</Label>
              <Input id="expiry_date_vip_form" name="expiry_date" type="date" value={formData.expiry_date} className="input-dark" readOnly disabled />
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity_vip_form" className="text-muted-foreground">Quantidade</Label>
              <Input id="quantity_vip_form" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleInputChange} className="input-dark" required />
            </div>
            <div>
              <Label htmlFor="unit_price_vip_form" className="text-muted-foreground">Preço Unitário (R$)</Label>
              <Input id="unit_price_vip_form" name="unit_price" type="number" step="0.01" min="0" value={formData.unit_price} onChange={handleInputChange} className="input-dark" placeholder="Ex: 15.00" required />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes_vip_form" className="text-muted-foreground">Notas (Opcional)</Label>
            <Textarea id="notes_vip_form" name="notes" value={formData.notes} onChange={handleInputChange} className="input-dark" placeholder="Ex: VIP Squad referente a Maio, etc." />
          </div>

          <div>
            <Label htmlFor="proof_file_vip_form" className="text-muted-foreground">Comprovante (PNG, JPG, PDF)</Label>
            <Input id="proof_file_vip_form" name="proof_file" type="file" onChange={handleInputChange} className="input-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" accept=".png,.jpg,.jpeg,.pdf"/>
            {editingPurchase?.proof_url && !formData.proof_file && (
              <p className="text-xs text-muted-foreground mt-1">Comprovante atual: <a href={editingPurchase.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver arquivo</a>. Envie um novo para substituir.</p>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="btn-secondary-dark">Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="btn-primary-dark">{editingPurchase ? 'Salvar Alterações' : 'Adicionar Compra'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VipPurchaseFormDialog;