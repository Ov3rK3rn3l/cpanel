import React from 'react';
    import { Button } from '@/components/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Edit3, Trash2 } from 'lucide-react';

    const UserManagementTable = ({ users, onEdit, onDelete, isLoading }) => {
      return (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(userEntry => (
                <TableRow key={userEntry.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="py-3">{userEntry.nome || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell className="py-3">{userEntry.email}</TableCell>
                  <TableCell className="py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      userEntry.role === 'admin' ? 'bg-destructive/20 text-destructive-foreground' :
                      userEntry.role === 'moderador' ? 'bg-yellow-400/20 text-yellow-300' :
                      userEntry.role === 'recrutador' ? 'bg-blue-400/20 text-blue-300' :
                      'bg-green-400/20 text-green-300'
                    }`}>
                      {userEntry.role}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(userEntry)} className="hover:border-primary hover:text-primary" disabled={isLoading}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(userEntry)} className="hover:border-destructive hover:text-destructive" disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    };

    export default UserManagementTable;