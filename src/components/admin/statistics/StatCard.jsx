import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const StatCard = ({ title, value, icon, description, color = "text-primary", delayIndex }) => (
  <motion.div custom={delayIndex} variants={cardVariants} initial="hidden" animate="visible">
    <Card className="glassmorphic hover:shadow-primary/20 transition-all duration-300 h-full border border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
        {React.cloneElement(icon, { className: `h-5 w-5 ${color}` })}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

export default StatCard;