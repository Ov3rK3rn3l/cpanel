import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const VIBRANT_RED = '#ef4444';

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

const RevenueChart = ({ 
  stats, 
  revenueFilterMonth, 
  setRevenueFilterMonth, 
  revenueFilterYear, 
  setRevenueFilterYear,
  monthOptions,
  yearOptions 
}) => {
  return (
    <motion.div variants={cardVariants} custom={5} initial="hidden" animate="visible" className="lg:col-span-2">
      <Card className="glassmorphic h-full border border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <LineChartIcon className="mr-2 h-6 w-6"/>
            Tendência de Receita do Clã
          </CardTitle>
          <CardDescription>Receitas da tesouraria e VIPs ao longo do tempo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Select value={revenueFilterMonth} onValueChange={setRevenueFilterMonth}>
              <SelectTrigger className="input-dark w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por Mês" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={revenueFilterYear} onValueChange={setRevenueFilterYear}>
              <SelectTrigger className="input-dark w-full sm:w-[150px]">
                <SelectValue placeholder="Filtrar por Ano" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os Anos</SelectItem>
                {yearOptions.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 sm:p-4 bg-card/70 rounded-lg text-center border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Movimentado (Período Filtrado)</p>
            <p className="text-3xl font-bold text-green-400">R$ {stats.totalClanRevenue.toFixed(2)}</p>
          </div>
          {stats.revenueTrend.length > 0 ? (
            <div className="h-[250px] sm:h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenueTrend} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `R${value}`}/>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    itemStyle={{ color: 'hsl(var(--primary-foreground))' }}
                    formatter={(value) => `R${value.toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Line type="monotone" dataKey="Receita" stroke={VIBRANT_RED} strokeWidth={2} dot={{ r: 4, fill: VIBRANT_RED }} activeDot={{ r: 6, stroke: VIBRANT_RED }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum dado de receita para o período selecionado.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueChart;