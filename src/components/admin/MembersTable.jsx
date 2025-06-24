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
    import { UserX, Users, Award, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
    import { formatDate, renderYesNoIcon, calculateDaysSinceLastPresence, getPromotionDisplayInfo, PATENTE_ORDER_MAP } from '@/components/admin/members/utils';
    import { Badge } from '@/components/ui/badge';

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

    const MembersTable = ({ members, onRowClick, onPromote, searchTerm, isProcessingAction }) => {
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
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'patente_atual') {
              aValue = PATENTE_ORDER_MAP[aValue] || 0;
              bValue = PATENTE_ORDER_MAP[bValue] || 0;
            } else if (sortConfig.key === 'total_presencas') {
              aValue = aValue || 0;
              bValue = bValue || 0;
            } else if (sortConfig.key === 'dias_inatividade') {
              aValue = calculateDaysSinceLastPresence(a.ultima_presenca);
              bValue = calculateDaysSinceLastPresence(b.ultima_presenca);
              aValue = (typeof aValue === 'number' ? aValue : Infinity);
              bValue = (typeof bValue === 'number' ? bValue : Infinity);
            }


            if (aValue < bValue) {
              return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
              return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            if ((a.codinome || '') < (b.codinome || '')) return -1;
            if ((a.codinome || '') > (b.codinome || '')) return 1;
            return 0;
          });
        }
        return sortableMembers;
      }, [members, sortConfig]);

      const getRowClass = (member) => {
        let baseClass = "cursor-pointer";
        const promotionInfo = getPromotionDisplayInfo(member);
        if (promotionInfo.eligible) {
          return `${baseClass} bg-yellow-500/10 hover:bg-yellow-500/20`;
        }
        return `${baseClass} hover:bg-accent/10`;
      };

      const getDaysInactiveBadgeVariant = (days) => {
        if (days === 'N/A' || days === 'Data Inválida' || days === null || days === undefined) return "secondary";
        if (days >= 1 && days <= 3) return "success";
        if (days >= 4 && days <= 9) return "warning";
        if (days >= 10 && days <= 15) return "destructive";
        if (days > 15) return "destructive";
        return "secondary";
      };
      
      return (
        <div className="overflow-auto max-h-[calc(100vh-350px)] glassmorphic rounded-lg shadow-lg border border-primary/30 w-full">
          <Table className="min-w-full">
            <TableCaption>
                {sortedMembers.length > 0 ? `Exibindo ${sortedMembers.length} membro(s) ativo(s).` : 
                 (searchTerm ? 'Nenhum membro ativo encontrado para sua busca.' : 'Nenhum membro ativo na comunidade GERR.')}
            </TableCaption>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow className="border-b-primary/40">
                <SortableHeader columnKey="codinome" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[180px] max-w-[250px]">Nome</SortableHeader>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden md:table-cell min-w-[150px] max-w-[200px]">Discord ID</TableHead>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden lg:table-cell min-w-[130px] max-w-[150px]">Última Presença</TableHead>
                <SortableHeader columnKey="total_presencas" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[100px] max-w-[120px]">Presenças</SortableHeader>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell min-w-[130px] max-w-[150px]">Penúltima</TableHead>
                <SortableHeader columnKey="dias_inatividade" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[120px] max-w-[140px]">Dias Inativo</SortableHeader>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden sm:table-cell min-w-[100px] max-w-[130px]">Status</TableHead>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell min-w-[70px] max-w-[90px]">ESA</TableHead>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap hidden xl:table-cell min-w-[70px] max-w-[90px]">CFO</TableHead>
                <TableHead className="py-3 px-2 text-left whitespace-nowrap min-w-[180px] max-w-[250px]">Promoção</TableHead>
                <SortableHeader columnKey="patente_atual" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[150px] max-w-[200px]">Patente Atual</SortableHeader>
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
                  const promotionInfo = getPromotionDisplayInfo(member);
                  const daysInactive = calculateDaysSinceLastPresence(member.ultima_presenca);
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
                      <TableCell className="hidden lg:table-cell py-2 px-2 whitespace-nowrap">{formatDate(member.ultima_presenca)}</TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap">{member.total_presencas ?? 0}</TableCell>
                      <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{formatDate(member.penultima_presenca)}</TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap">
                        <Badge variant={getDaysInactiveBadgeVariant(daysInactive)} className="whitespace-nowrap text-xs px-1.5 py-0.5">
                          {daysInactive} Dias
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2 px-2 whitespace-nowrap truncate" title={member.status}>{member.status || 'N/A'}</TableCell>
                      <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{renderYesNoIcon(member.esa)}</TableCell>
                      <TableCell className="hidden xl:table-cell py-2 px-2 whitespace-nowrap">{renderYesNoIcon(member.cfo)}</TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap">
                        {promotionInfo.eligible ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="btn-success-outline border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-xs px-2 py-1 h-auto whitespace-nowrap" 
                            onClick={(e) => { e.stopPropagation(); onPromote(member, promotionInfo.suggested);}}
                            disabled={isProcessingAction}
                            title={`Promover para ${promotionInfo.suggested}`}
                          >
                            <Award className="mr-1 h-3 w-3" /> {promotionInfo.text}
                          </Button>
                        ) : (
                          <span title={promotionInfo.text} className="truncate block max-w-[180px] text-xs sm:text-sm">{promotionInfo.text}</span>
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