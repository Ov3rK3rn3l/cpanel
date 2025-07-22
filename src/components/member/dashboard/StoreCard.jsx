import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const StoreCard = () => {
  return (
    <Card className="glassmorphic-dark-glow h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-xl text-primary-foreground/90 flex items-center">
          <Store className="mr-2 h-6 w-6 text-primary"/>
          Loja do Clã
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Store className="h-20 w-20 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))] mb-4" />
        </motion.div>
        <p className="text-muted-foreground mb-6">
          Use suas moedas para adquirir itens, vantagens e muito mais!
        </p>
        <Button asChild className="btn-primary-dark group">
          <Link to="/store">
            Acessar a Loja
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default StoreCard;