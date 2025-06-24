import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

import TreasurySummary from '@/components/admin/treasury/TreasurySummary.jsx';
import MonthlyExpensesSection from '@/components/admin/treasury/MonthlyExpensesSection.jsx';
import OtherTransactionsSection from '@/components/admin/treasury/OtherTransactionsSection.jsx';
import TransactionFormDialog from '@/components/admin/treasury/TransactionFormDialog.jsx';
import ProofViewerDialog from '@/components/admin/treasury/ProofViewerDialog.jsx';

const TreasuryPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [currentProofUrl, setCurrentProofUrl] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const initialFormData = {
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    is_paid: false,
    proof_file: null,
    member_id: null,
  };
  const [formData, setFormData] = useState(initialFormData);
  
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);

  const VIP_CATEGORY_NAMES_TO_EXCLUDE = ["Vip Squad (Receita)", "Vip Arma Reforger (Receita)"];

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('treasury_categories').select('*').order('name');
    if (error) {
      toast({ title: 'Erro ao buscar categorias', description: error.message, variant: 'destructive' });
    } else {
      // Filtrar categorias VIP aqui
      const filteredCategories = data?.filter(cat => !VIP_CATEGORY_NAMES_TO_EXCLUDE.includes(cat.name)) || [];
      setCategories(filteredCategories);
    }
  }, [toast]);

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase.from('members').select('id, codinome').order('codinome');
    if (error) {
      toast({ title: 'Erro ao buscar membros', description: error.message, variant: 'destructive' });
    } else {
      setMembers(data || []);
    }
  }, [toast]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('treasury_transactions')
      .select('*, treasury_categories(id, name, type), members(id, codinome)')
      .order('transaction_date', { ascending: false });

    // Excluir transações de categorias VIP do cálculo geral da tesouraria
    query = query.not('treasury_categories.name', 'in', `(${VIP_CATEGORY_NAMES_TO_EXCLUDE.map(name => `"${name}"`).join(',')})`);


    if (filterType !== 'all') {
      query = query.filter('treasury_categories.type', 'eq', filterType);
    }
    if (searchTerm) {
      query = query.or(`description.ilike.%${searchTerm}%,members.codinome.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Erro ao buscar transações', description: error.message, variant: 'destructive' });
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, [toast, filterType, searchTerm]);

  const generateMonthlyExpenses = useCallback(() => {
    const recurringExpensesCategories = categories.filter(c => c.type === 'expense' && c.default_amount !== null && !VIP_CATEGORY_NAMES_TO_EXCLUDE.includes(c.name));
    const expenses = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 16);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      const existingMonthTransactions = transactions.filter(t => 
        t.transaction_date && t.transaction_date.startsWith(monthKey) && t.treasury_categories?.type === 'expense' && !VIP_CATEGORY_NAMES_TO_EXCLUDE.includes(t.treasury_categories?.name)
      );

      const monthData = {
        date: monthDate,
        displayDate: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        items: []
      };

      recurringExpensesCategories.forEach(cat => {
        const existingTransaction = existingMonthTransactions.find(t => t.category_id === cat.id);
        if (existingTransaction) {
          monthData.items.push({
            id: existingTransaction.id,
            categoryId: cat.id,
            name: cat.name,
            amount: parseFloat(existingTransaction.amount),
            is_paid: existingTransaction.is_paid,
            proof_url: existingTransaction.proof_url,
            isRecurringPlaceholder: false,
          });
        } else {
           monthData.items.push({
            id: `placeholder-${cat.id}-${monthKey}`,
            categoryId: cat.id,
            name: cat.name,
            amount: parseFloat(cat.default_amount),
            is_paid: false,
            proof_url: null,
            isRecurringPlaceholder: true,
          });
        }
      });
      expenses.push(monthData);
    }
    setMonthlyExpenses(expenses);
  }, [categories, transactions]); // transactions já é filtrado para excluir VIPs

  useEffect(() => {
    fetchCategories();
    fetchMembers();
  }, [fetchCategories, fetchMembers]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  useEffect(() => {
    // generateMonthlyExpenses depende de categories e transactions (ambos filtrados)
    if (categories.length > 0 || transactions.length > 0) { 
      generateMonthlyExpenses();
    }
  }, [categories, transactions, generateMonthlyExpenses]);

  const resetFormData = () => {
    setFormData(initialFormData);
    setEditingTransaction(null);
  };

  const handleFormSubmit = async (submittedData) => {
    if (!user) {
      toast({ title: 'Erro de autenticação', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    const selectedCategory = categories.find(c => c.id === submittedData.category_id);
    if (selectedCategory && VIP_CATEGORY_NAMES_TO_EXCLUDE.includes(selectedCategory.name)) {
        toast({ title: 'Ação Inválida', description: 'Categorias VIP devem ser gerenciadas na seção "Controle de VIPs".', variant: 'destructive' });
        return;
    }

    let proofUrl = editingTransaction?.proof_url || null;
    if (submittedData.proof_file) {
      const file = submittedData.proof_file;
      const fileName = `${user.id}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('treasury_proofs')
        .upload(fileName, file);

      if (uploadError) {
        toast({ title: 'Erro no upload do comprovante', description: uploadError.message, variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from('treasury_proofs').getPublicUrl(uploadData.path);
      proofUrl = urlData.publicUrl;
    }
    
    let finalAmount = parseFloat(submittedData.amount);
    if (selectedCategory && selectedCategory.type === 'expense' && finalAmount > 0) {
      finalAmount = -finalAmount;
    } else if (selectedCategory && selectedCategory.type === 'income' && finalAmount < 0) {
      finalAmount = Math.abs(finalAmount);
    }

    const transactionPayload = {
      category_id: submittedData.category_id,
      transaction_date: submittedData.transaction_date,
      description: submittedData.description,
      amount: finalAmount,
      is_paid: selectedCategory?.type === 'expense' ? submittedData.is_paid : null,
      proof_url: proofUrl,
      member_id: submittedData.member_id || null,
      created_by: user.id,
    };

    let error;
    if (editingTransaction) {
      ({ error } = await supabase.from('treasury_transactions').update(transactionPayload).eq('id', editingTransaction.id));
    } else {
      ({ error } = await supabase.from('treasury_transactions').insert(transactionPayload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar transação', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Transação ${editingTransaction ? 'atualizada' : 'adicionada'}!`, variant: 'success' });
      setIsFormOpen(false);
      resetFormData();
      fetchTransactions(); // Re-fetch para atualizar a lista e os totais
    }
  };
  
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    const category = categories.find(c => c.id === transaction.category_id);
    setFormData({
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      description: transaction.description || '',
      amount: Math.abs(parseFloat(transaction.amount)),
      is_paid: category?.type === 'expense' ? transaction.is_paid : false,
      proof_file: null,
      member_id: transaction.member_id || null,
    });
    setIsFormOpen(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    const { error } = await supabase.from('treasury_transactions').delete().eq('id', transactionId);
    if (error) {
      toast({ title: 'Erro ao excluir transação', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Transação excluída!', variant: 'success' });
      fetchTransactions(); // Re-fetch para atualizar a lista e os totais
    }
  };

  const handleTogglePaidStatus = async (item, monthDate) => {
    if (!user) {
      toast({ title: 'Erro de autenticação', variant: 'destructive' });
      return;
    }
    
    const newPaidStatus = !item.is_paid;
    let error;

    if (item.isRecurringPlaceholder) {
      const transactionData = {
        category_id: item.categoryId,
        transaction_date: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(monthDate.getDate()).padStart(2, '0')}`,
        description: item.name,
        amount: -Math.abs(item.amount), // Certificar que despesas são negativas
        is_paid: newPaidStatus,
        created_by: user.id,
      };
      ({ error } = await supabase.from('treasury_transactions').insert(transactionData));
    } else {
      ({ error } = await supabase.from('treasury_transactions')
        .update({ is_paid: newPaidStatus })
        .eq('id', item.id));
    }

    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status de pagamento atualizado!', variant: 'success' });
      fetchTransactions(); // Re-fetch para atualizar a lista e os totais
    }
  };

  const openProofModal = (url) => {
    setCurrentProofUrl(url);
    setIsProofModalOpen(true);
  };

  // Cálculos de total baseados nas transações filtradas (que já excluem VIPs)
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.amount < 0 && t.is_paid).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const clanBalance = totalIncome + totalExpenses;

  if (loading && transactions.length === 0 && categories.length === 0 && members.length === 0) {
    return <div className="flex justify-center items-center h-64"><DollarSign className="h-12 w-12 animate-pulse text-primary" /> <p className="ml-4 text-xl">Carregando dados da Tesouraria...</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <TreasurySummary
        clanBalance={clanBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />

      <MonthlyExpensesSection
        monthlyExpenses={monthlyExpenses}
        onTogglePaidStatus={handleTogglePaidStatus}
        onEditTransaction={(item) => handleEditTransaction(transactions.find(t => t.id === item.id))}
        onOpenProofModal={openProofModal}
        transactions={transactions}
      />
      
      <OtherTransactionsSection
        transactions={transactions}
        loading={loading}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        onAddTransaction={() => { resetFormData(); setIsFormOpen(true); }}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onOpenProofModal={openProofModal}
      />

      <TransactionFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetFormData();
        }}
        onSubmit={handleFormSubmit}
        editingTransaction={editingTransaction}
        formData={formData}
        setFormData={setFormData}
        categories={categories} // Categorias já filtradas
        members={members} 
      />

      <ProofViewerDialog
        isOpen={isProofModalOpen}
        onOpenChange={setIsProofModalOpen}
        proofUrl={currentProofUrl}
      />
    </motion.div>
  );
};

export default TreasuryPage;