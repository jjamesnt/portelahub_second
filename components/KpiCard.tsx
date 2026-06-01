
import React from 'react';

interface KpiCardProps {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend, trendDirection }) => {
    const trendColor = {
        up: 'text-emerald-500',
        down: 'text-red-500',
        neutral: 'text-slate-400'
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-1 md:mb-2">
                <div className="p-1.5 md:p-2 bg-turquoise/10 rounded-xl">
                    <span className="material-symbols-outlined text-turquoise text-sm md:text-lg">{icon}</span>
                </div>
                <span className={`${trendColor[trendDirection]} text-[9px] md:text-xs font-black flex items-center gap-0.5`}>
                    {trendDirection === 'up' && <span className="material-symbols-outlined text-[12px] md:text-sm">trending_up</span>}
                    {trendDirection === 'down' && <span className="material-symbols-outlined text-[12px] md:text-sm">trending_down</span>}
                    {trend}
                </span>
            </div>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
            <h3 className="text-xl md:text-3xl font-black mt-0.5 text-navy-dark dark:text-white truncate tracking-tight">{value}</h3>
        </div>
    );
};

export default KpiCard;
