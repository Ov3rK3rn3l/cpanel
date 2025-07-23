import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX, Users, Award, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Crown } from 'lucide-react';
import { formatDate, renderYesNoIcon, calculateDays, getPromotionDisplayInfo, PATENTE_ORDER_MAP, MERIT_PATENTS_START_ORDER } from '@/components/admin/members/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const SortableHeader = ({ children, columnKey, sortConfig, requestSort, className }) => {
  const isActive = sortConfig && sortConfig.key === columnKey;
  const Icon = isActive ? (sortConfig.direction === 'ascending' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead 
      className={`py-3 px-2 text-left whitespace-nowrap cursor-pointer hover:bg-primary/10 transition-colors ${className || ''}`}
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        <Icon className={`ml-1 h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );
};

const MembersTable = ({ members, onRowClick, onPromote, searchTerm, isProcessingAction, highlightedRow }) => {
  const { userRole } = useAuth();
  const [sortConfig, setSortConfig] = useState({ key: 'patente_atual', direction: 'descending' });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending'; 
    }
    setSortConfig({ key, direction });
  };

  const sortedMembers = useMemo(() => {
    let sortableMembers = [...members];
    if (sortConfig !== null) {
      sortableMembers.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'patente_atual') {
          aValue = PATENTE_ORDER_MAP[a.patente_atual] || 0;
          bValue = PATENTE_ORDER_MAP[b.patente_atual] || 0;
        } else if (sortConfig.key === 'dias_clube') {
          const aPatenteOrder = PATENTE_ORDER_MAP[a.patente_atual] || 0;
          const bPatenteOrder = PATENTE_ORDER_MAP[b.patente_atual] || 0;
          aValue = aPatenteOrder >= MERIT_PATENTS_START_ORDER ? calculateDays(a.data_ingresso) : calculateDays(a.ultima_presenca);
          bValue = bPatenteOrder >= MERIT_PATENTS_START_ORDER ? calculateDays(b.data_ingresso) : calculateDays(b.ultima_presenca);
          aValue = (typeof aValue === 'number' ? aValue : Infinity);
          bValue = (typeof bValue === 'number' ? bValue : Infinity);
        } else {
          aValue = a[sortConfig.key] || 0;
          bValue = b[sortConfig.key] || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        // Fallback to sorting by patente if primary sort keys are equal
        const aPatenteOrder = PATENTE_ORDER_MAP[a.patente_atual] || 0;
        const bPatenteOrder = PATENTE_ORDER_MAP[b.patente_atual] || 0;
        if (aPatenteOrder < bPatenteOrder) return 1;
        if (aPatenteOrder > bPatenteOrder) return -1;

        if ((a.codinome || '') < (b.codinome || '')) return -1;
        if ((a.codinome || '') > (b.codinome || '')) return 1;
        return 0;
      });
    }
    return sortableMembers;
  }, [members, sortConfig]);

  const getRowClass = (member) => {
    let baseClass = "cursor-pointer transition-colors duration-200";
    if (highlightedRow === member.id) {
      return `${baseClass} bg-green-500/30 hover:bg-green-200/40`;
    }
    
    const patenteOrder = PATENTE_ORDER_MAP[member.patente_atual] || 0;
    if (patenteOrder >= PATENTE_ORDER_MAP["General de Brigada"]) return `${baseClass} bg-yellow-500/20 hover:bg-yellow-500/30`;
    if (patenteOrder >= PATENTE_ORDER_MAP["Major"]) return `${baseClass} bg-orange-500/20 hover:bg-orange-500/30`;
    if (patenteOrder >= PATENTE_ORDER_MAP["Capitão"]) return `${baseClass} bg-purple-500/20 hover:bg-purple-500/30`;

    const promotionInfo = getPromotionDisplayInfo(member, userRole);
    if (promotionInfo.eligible && !promotionInfo.isMerit) {
      return `${baseClass} bg-yellow-500/10 hover:bg-yellow-500/20`;
    }
    return `${baseClass} hover:bg-accent/10`;
  };

  const getDaysBadge = (days, isHighRank) => {
    if (days === 'N/A' || days === 'Data Inválida' || days === null || days === undefined) return <Badge variant="secondary">N/A</Badge>;
    
    if (isHighRank) {
      return <Badge variant="outline" className="text-blue-300 border-blue-400 whitespace-nowrap text-xs px-1.5 py-0.5">{days}</Badge>;
    }

    let variant = "secondary";
    if (days >= 1 && days <= 3) variant = "success";
    else if (days >= 4 && days <= 9) variant = "warning";
    else if (days >= 10) variant = "destructive";
    
    return <Badge variant={variant} className="whitespace-nowrap text-xs px-1.5 py-0.5">{days}</Badge>;
  };
  
  return (
    <div className="overflow-auto max-h-[calc(100vh-350px)] custom-scrollbar glassmorphic rounded-lg shadow-lg w-full">
      <Table className="min-w-full">
        <TableCaption>
            {sortedMembers.length > 0 ? `Exibindo ${sortedMembers.length} membro(s) ativo(s).` : 
             (searchTerm ? 'Nenhum membro ativo encontrado para sua busca.' : 'Nenhum membro ativo na comunidade GERR.')}
        </TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
          <TableRow className="border-b-primary/40">
            <SortableHeader columnKey="codinome" sortConfig={sortConfig} requestSort={requestSort}>Nome</SortableHeader>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden md:table-cell">Discord ID</TableHead>
            <SortableHeader columnKey="total_presencas" sortConfig={sortConfig} requestSort={requestSort}>Presenças</SortableHeader>
            <SortableHeader columnKey="dias_clube" sortConfig={sortConfig} requestSort={requestSort}>Dias</SortableHeader>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden sm:table-cell">Status</TableHead>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell">Última Presença</TableHead>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell">Penúltima Presença</TableHead>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell">ESA</TableHead>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell">CFO</TableHead>
            <TableHead className="py-3 px-2 text-left whitespace-nowrap">Promoção</TableHead>
            <SortableHeader columnKey="patente_atual" sortConfig={sortConfig} requestSort={requestSort}>Patente Atual</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {sortedMembers.length === 0 && !searchTerm ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center h-40">
                  <Users size={40} className="mx-auto text-muted-foreground mb-3"/>
                  <p className="text-lg">Nenhum membro ativo encontrado.</p>
                  <p className="text-sm text-muted-foreground">Adicione novos membros ou carregue da planilha.</p>
                </TableCell>
              </TableRow>
            ) : sortedMembers.length === 0 && searchTerm ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center h-32">
                  <UserX size={32} className="mx-auto text-muted-foreground mb-2"/>
                  Nenhum membro ativo encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : sortedMembers.map((member) => {
              const promotionInfo = getPromotionDisplayInfo(member, userRole);
              const patenteOrder = PATENTE_ORDER_MAP[member.patente_atual] || 0;
              const isHighRank = patenteOrder >= MERIT_PATENTS_START_ORDER;
              const daysValue = isHighRank ? calculateDays(member.data_ingresso) : calculateDays(member.ultima_presenca);

              return (
                <motion.tr 
                  key={member.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  layout
                  className={`${getRowClass(member)} border-b border-primary/20 last:border-b-0`}
                  onClick={() => onRowClick(member)}
                >
                  <TableCell className="font-medium text-foreground whitespace-nowrap py-2 px-2 truncate" title={member.codinome || member.discord_nick}>{member.codinome || member.discord_nick}</TableCell>
                  <TableCell className="hidden md:table-cell py-2 px-2 whitespace-nowrap truncate" title={member.discord_id}>{member.discord_id}</TableCell>
                  <TableCell className="py-2 px-2 whitespace-nowrap">{isHighRank ? 'N/A' : (member.total_presencas ?? 0)}</TableCell>
                  <TableCell className="py-2 px-2 whitespace-nowrap">
                    {getDaysBadge(daysValue, isHighRank)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 px-2 whitespace-nowrap truncate" title={member.status}>{member.status || 'N/A'}</TableCell>
                  <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{formatDate(member.ultima_presenca)}</TableCell>
                  <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{formatDate(member.penultima_presenca)}</TableCell>
                  <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{renderYesNoIcon(member.esa)}</TableCell>
                  <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{renderYesNoIcon(member.cfo)}</TableCell>
                  <TableCell className="py-2 px-2 whitespace-nowrap">
                    {promotionInfo.eligible ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`border-2 text-xs px-2 py-1 h-auto whitespace-nowrap ${promotionInfo.isMerit ? 'btn-merit-outline' : 'btn-success-outline'}`}
                        onClick={(e) => { e.stopPropagation(); onPromote(member, promotionInfo.suggested);}}
                        disabled={isProcessingAction || (promotionInfo.isMerit && userRole !== 'admin')}
                        title={`Promover para ${promotionInfo.suggested}`}
                      >
                        {promotionInfo.isMerit ? <Crown className="mr-1 h-3 w-3" /> : <Award className="mr-1 h-3 w-3" />}
                        {promotionInfo.isMerit ? 'Mérito' : 'Promover'}
                      </Button>
                    ) : (
                      <span title={typeof promotionInfo.text === 'string' ? promotionInfo.text : ''} className="truncate block max-w-[180px] text-xs sm:text-sm">{promotionInfo.text}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-2 whitespace-nowrap truncate" title={member.patente_atual}>{member.patente_atual || 'N/A'}</TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
};

export default MembersTable;