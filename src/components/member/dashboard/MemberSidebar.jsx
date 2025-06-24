import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Package, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryCard from '@/components/member/dashboard/InventoryCard';
import StoreCard from '@/components/member/dashboard/StoreCard';

const MemberSidebar = ({ isOpen, setIsOpen, memberData }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card/95 backdrop-blur-lg z-50 p-6 border-l border-primary/20 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-primary">Recursos</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <Tabs defaultValue="inventory" className="w-full flex-grow flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inventory"><Package className="mr-2 h-4 w-4"/>Inventário</TabsTrigger>
                <TabsTrigger value="store"><Store className="mr-2 h-4 w-4"/>Loja</TabsTrigger>
              </TabsList>
              <TabsContent value="inventory" className="flex-grow mt-4">
                <InventoryCard memberData={memberData} />
              </TabsContent>
              <TabsContent value="store" className="flex-grow mt-4">
                <StoreCard />
              </TabsContent>
            </Tabs>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberSidebar;