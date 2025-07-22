import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle, LayoutDashboard, Crown, ScanLine, Settings, LogOut } from "lucide-react";
import { motion } from 'framer-motion';

const ProfileDropdown = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
  const isAdminOrStaff = userRole === 'admin' || userRole === 'moderador' || userRole === 'recrutador';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-11 w-11 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            <UserCircle className="h-7 w-7 text-foreground/80 group-hover:text-primary transition-colors" />
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-60 glassmorphic border-primary/20 shadow-2xl shadow-primary/10" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">Meu Perfil</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userRole ? `Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` : ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-primary/10" />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => navigate('/dashboard')} className="focus:bg-primary/10 focus:text-primary-foreground">
            <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
            <span>Meu Dashboard</span>
          </DropdownMenuItem>
          {isAdminOrStaff && (
            <DropdownMenuItem onSelect={() => navigate('/admin/dashboard')} className="focus:bg-primary/10 focus:text-primary-foreground">
              <Crown className="mr-2 h-4 w-4 text-primary" />
              <span>Meu Painel</span>
            </DropdownMenuItem>
          )}
           <DropdownMenuItem onSelect={() => navigate('/steam-scanner')} className="focus:bg-primary/10 focus:text-primary-foreground">
            <ScanLine className="mr-2 h-4 w-4 text-primary" />
            <span>Scanner Steam</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/profile')} className="focus:bg-primary/10 focus:text-primary-foreground">
            <Settings className="mr-2 h-4 w-4 text-primary" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-primary/10" />
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;