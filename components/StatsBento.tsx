import React from 'react';
import { Stats } from '../types';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface StatsBentoProps {
  stats: Stats;
}

const StatsBento: React.FC<StatsBentoProps> = ({ stats }) => {
  const chartData = [
    { name: 'Applied', value: stats.totalApplied },
    { name: 'Interviews', value: stats.interviews },
    { name: 'Offers', value: stats.offers },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Main Stat - Total Applied */}
      <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Applications</h3>
        <p className="text-5xl font-bold text-white mt-2 group-hover:scale-105 transition-transform duration-300">
          {stats.totalApplied}
        </p>
        <div className="mt-4 h-16 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
        </div>
      </div>

      {/* Stat - Response Rate */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col justify-between">
        <div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Response Rate</h3>
            <div className="flex items-end gap-2 mt-2">
                <p className="text-4xl font-bold text-emerald-400">{stats.responseRate}%</p>
            </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${stats.responseRate}%` }}></div>
        </div>
      </div>

      {/* Stat - Active Interviews */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center items-center relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl"></div>
         <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Active Interviews</h3>
         <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400 mt-2">
            {stats.interviews}
         </p>
      </div>
    </div>
  );
};

export default StatsBento;