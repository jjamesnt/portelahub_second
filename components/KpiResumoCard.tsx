
import React from 'react';

interface KpiResumoCardProps {
    title: string;
    value: string;
    trend?: string;
    meta?: string;
    isValueSmall?: boolean;
    children: React.ReactNode;
}

const KpiResumoCard: React.FC<KpiResumoCardProps> = ({ title, value, trend, meta, isValueSmall, children }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h4 className={`text-navy-custom dark:text-white font-black ${isValueSmall ? 'text-2xl' : 'text-3xl'}`}>{value}</h4>
                {trend && <span className="text-primary text-[11px] font-bold px-1.5 py-0.5 bg-primary/10 rounded">{trend}</span>}
                {meta && <span className="text-slate-400 text-[11px] font-bold">{meta}</span>}
            </div>
            {children}
        </div>
    );
};

export default KpiResumoCard;
