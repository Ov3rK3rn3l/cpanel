import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { PATENTE_OPTIONS } from '@/components/admin/members/utils';

export const ItemForm = ({ itemData, onSuccess, onCancel }) => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    banner_image_url: '',
    is_exclusive: false,
    required_patente: null,
    purchase_limit: 1,
    is_active: true,
    is_featured: false,
    item_type: 'regular',
  });
  const [keysToAdd, setKeysToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemData) {
      setFormData({
        ...itemData,
        price: itemData.price || 0,
        purchase_limit: itemData.purchase_limit === null ? 1 : itemData.purchase_limit,
        item_type: itemData.item_type || 'regular',
      });
    } else {
        setFormData({
            name: '',
            description: '',
            price: 0,
            image_url: '',
            banner_image_url: '',
            is_exclusive: false,
            required_patente: null,
            purchase_limit: 1,
            is_active: true,
            is_featured: false,
            item_type: 'regular',
        });
    }
  }, [itemData]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.required_patente === 'none' || payload.required_patente === '') {
        payload.required_patente = null;
      }
      
      const { data: upsertData, error } = await supabase.from('store_items').upsert(payload).select().single();
      if (error) throw error;
      
      const newItemId = upsertData.id;
      const keysArray = keysToAdd.split('\n').map(k => k.trim()).filter(Boolean);

      if (formData.item_type === 'key' && keysArray.length > 0) {
        const { error: keysError } = await supabase.rpc('add_keys_to_store_item', {
          p_item_id: newItemId,
          p_keys: keysArray
        });
        if (keysError) throw keysError;
      }
      
      toast({ title: 'Sucesso!', description: `Item ${payload.id ? 'atualizado' : 'criado'} com sucesso.` });
      if(onSuccess) onSuccess();
    } catch (error) {
      toast({ title: `Erro ao salvar item`, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nome do Item</Label>
        <Input id="name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} required className="input-dark" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} className="input-dark min-h-[80px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">Preço (Moedas)</Label>
          <Input id="price" type="number" value={formData.price} onChange={(e) => handleFormChange('price', parseInt(e.target.value, 10) || 0)} required className="input-dark" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="purchase_limit">Limite de Compra por Membro</Label>
          <Input id="purchase_limit" type="number" value={formData.purchase_limit} onChange={(e) => handleFormChange('purchase_limit', parseInt(e.target.value, 10) || 0)} required className="input-dark" />
          <p className="text-xs text-muted-foreground">Use 0 para ilimitado.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="required_patente">Patente Mínima</Label>
          <Select value={formData.required_patente || 'none'} onValueChange={(value) => handleFormChange('required_patente', value)}>
            <SelectTrigger className="input-dark"><SelectValue placeholder="Selecione uma patente..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {PATENTE_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="item_type">Tipo de Item</Label>
          <Select value={formData.item_type} onValueChange={(value) => handleFormChange('item_type', value)}>
            <SelectTrigger className="input-dark"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="key">Chave de Jogo</SelectItem>
              <SelectItem value="visual_effect">Efeito Visual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.item_type === 'key' && (
        <div className="space-y-1">
          <Label htmlFor="keys_to_add">Chaves de Jogo (uma por linha)</Label>
          <Textarea 
            id="keys_to_add"
            value={keysToAdd}
            onChange={(e) => setKeysToAdd(e.target.value)}
            className="input-dark min-h-[100px]"
            placeholder="Cole aqui as chaves de jogo..."
          />
           <p className="text-xs text-muted-foreground">Estas chaves serão adicionadas ao estoque do item.</p>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="image_url">URL da Imagem do Item (Opcional)</Label>
        <Input id="image_url" value={formData.image_url || ''} onChange={(e) => handleFormChange('image_url', e.target.value)} className="input-dark" />
      </div>
       <div className="space-y-1">
        <Label htmlFor="banner_image_url">URL da Imagem do Banner (Opcional)</Label>
        <Input id="banner_image_url" value={formData.banner_image_url || ''} onChange={(e) => handleFormChange('banner_image_url', e.target.value)} className="input-dark" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleFormChange('is_active', checked)} />
          <Label htmlFor="is_active">Ativo na Loja</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="is_exclusive" checked={formData.is_exclusive} onCheckedChange={(checked) => handleFormChange('is_exclusive', checked)} />
          <Label htmlFor="is_exclusive">Exclusivo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => handleFormChange('is_featured', checked)} />
          <Label htmlFor="is_featured">Em Destaque</Label>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></DialogClose>
        <Button type="submit" disabled={isSubmitting} className="btn-primary-dark">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {formData.id ? 'Salvar Alterações' : 'Adicionar Item'}
        </Button>
      </DialogFooter>
    </form>
  )
}