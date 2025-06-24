import React from 'react';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Search, Award } from 'lucide-react';

    const PROMOTION_SUGGESTED_OPTIONS = [
        { value: 'all', label: 'Promoção: Todos' },
        { value: 'yes', label: 'Sim, Sugerido' },
        { value: 'no', label: 'Não Sugerido' },
    ];

    const MemberFilters = ({ filters, onFilterChange, onSearchTermChange }) => {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 p-4 bg-card/50 rounded-lg border border-border/30 shadow-sm">
          <div className="relative col-span-1 md:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por Nome, Discord ID..."
              value={filters.searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="input-dark pl-10 w-full"
            />
          </div>
          
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <label htmlFor="promotion-filter" className="text-sm font-medium text-muted-foreground flex items-center mb-1">
              <Award className="mr-2 h-4 w-4 text-primary" /> Sugerido Promoção
            </label>
            <Select value={filters.promotionSuggested} onValueChange={(value) => onFilterChange('promotionSuggested', value)}>
              <SelectTrigger id="promotion-filter" className="input-dark">
                <SelectValue placeholder="Promoção: Todos" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {PROMOTION_SUGGESTED_OPTIONS
                  .filter(opt => opt.value !== null && opt.value !== undefined && opt.value !== "")
                  .map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    };

    export default MemberFilters;