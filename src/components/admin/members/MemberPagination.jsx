import React from 'react';
    import { Button } from '@/components/ui/button';
    import { ChevronLeft, ChevronRight } from 'lucide-react';

    const MemberPagination = ({ currentPage, totalPages, onPageChange, isLoading }) => {
      if (totalPages <= 1) return null;

      return (
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            variant="outline"
            className="btn-outline-dark"
            size="sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            variant="outline"
            className="btn-outline-dark"
            size="sm"
          >
            Próxima <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      );
    };

    export default MemberPagination;