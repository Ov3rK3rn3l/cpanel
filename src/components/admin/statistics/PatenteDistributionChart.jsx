import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
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

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#AF19FF'];

const PatenteDistributionChart = ({ stats }) => {
  return (
    <motion.div variants={cardVariants} custom={6} initial="hidden" animate="visible">
      <Card className="glassmorphic h-full border border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <PieIcon className="mr-2 h-6 w-6"/>
            Distribuição por Patente
          </CardTitle>
          <CardDescription>Como os membros ativos se distribuem nas patentes.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] sm:h-[400px]">
          {stats.patenteDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.patenteDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.patenteDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  itemStyle={{ color: 'hsl(var(--primary-foreground))' }}
                />
                <Legend wrapperStyle={{fontSize: "10px", marginTop: "10px"}} layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10">Nenhum membro ativo para exibir distribuição.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatenteDistributionChart;