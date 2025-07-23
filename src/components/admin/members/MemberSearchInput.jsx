import React from 'react';
    import { Input } from '@/components/ui/input';
    import { Search } from 'lucide-react';

    const MemberSearchInput = ({ searchTerm, onSearchTermChange }) => {
      return (
        <div className="mb-4 relative">
          <Input 
            type="text"
            placeholder="Buscar por Codinome, ID Discord, Jogo, Status, Patente, ESA, CFO..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 input-dark"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      );
    };

    export default MemberSearchInput;