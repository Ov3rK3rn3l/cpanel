import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { TrendingUp, PlusCircle, FileText, Edit3, Trash2, Filter } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';

    const OtherTransactionsSection = ({
      transactions,
      loading,
      searchTerm,
      onSearchTermChange,
      filterType,
      onFilterTypeChange,
      onAddTransaction,
      onEditTransaction,
      onDeleteTransaction,
      onOpenProofModal
    }) => {
      const filterOptions = [
        { value: "all", label: "Todas" },
        { value: "income", label: "Receitas" },
        { value: "expense", label: "Despesas" },
      ];

      return (
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-xl flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-green-500"/> Outras Transações</CardTitle>
              <CardDescription>(Doações, VIPs, Despesas Avulsas)</CardDescription>
            </div>
            <Button onClick={onAddTransaction} className="btn-primary-dark w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Transação
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input 
                type="text"
                placeholder="Buscar por descrição ou membro..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="input-dark flex-grow"
              />
              <Select value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="input-dark sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {filterOptions
                    .filter(opt => opt.value !== null && opt.value !== undefined && opt.value !== "")
                    .map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="p-2 text-left font-semibold text-muted-foreground">Data</th>
                    <th className="p-2 text-left font-semibold text-muted-foreground">Categoria</th>
                    <th className="p-2 text-left font-semibold text-muted-foreground">Descrição</th>
                    <th className="p-2 text-left font-semibold text-muted-foreground">Membro</th>
                    <th className="p-2 text-right font-semibold text-muted-foreground">Valor (R$)</th>
                    <th className="p-2 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="p-2 text-center font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((transaction) => (
                      <motion.tr 
                        key={transaction.id} 
                        className="border-b border-border/20 hover:bg-secondary/20"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="p-2 text-foreground/80">{new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2 text-foreground/80">{transaction.treasury_categories?.name || 'N/A'}</td>
                        <td className="p-2 text-foreground/80 truncate max-w-xs" title={transaction.description}>{transaction.description}</td>
                        <td className="p-2 text-foreground/80">{transaction.members?.codinome || '-'}</td>
                        <td className={`p-2 text-right font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseFloat(transaction.amount).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {transaction.treasury_categories?.type === 'expense' ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${transaction.is_paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {transaction.is_paid ? 'Pago' : 'Pendente'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center space-x-1">
                          {transaction.proof_url && (
                            <Button variant="ghost" size="icon" onClick={() => onOpenProofModal(transaction.proof_url)} title="Ver Comprovante">
                              <FileText className="h-4 w-4 text-blue-400" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => onEditTransaction(transaction)} title="Editar">
                            <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteTransaction(transaction.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {transactions.length === 0 && !loading && (
                <p className="text-center py-4 text-muted-foreground">Nenhuma transação encontrada para os filtros atuais.</p>
              )}
               {loading && transactions.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">Carregando transações...</p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    };

    export default OtherTransactionsSection;