import React from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const ProgressChart = ({ presencasData }) => {
  return (
    <div className="h-48 md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={presencasData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
            itemStyle={{ color: 'hsl(var(--primary-foreground))' }}
            cursor={{fill: 'hsl(var(--primary)/0.1)'}}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Bar dataKey="presencas" name="Presenças" fill="url(#colorPresencas)" radius={[4, 4, 0, 0]} barSize={30} />
          <defs>
            <linearGradient id="colorPresencas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary-light))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary-dark))" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;