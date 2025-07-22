import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const StatCard = ({ title, value, icon, description, delayIndex, className = "", valueClassName = "" }) => (
  <motion.div custom={delayIndex} variants={cardVariants} initial="hidden" animate="visible" className={className}>
    <Card className="glassmorphic h-full border-primary/40 hover:shadow-primary/20 transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-semibold text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold text-primary-foreground ${valueClassName}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

export default StatCard;