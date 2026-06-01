import React, { useEffect, useState } from 'react';
import { getIBGEData } from '../services/ibge';
import { FormattedIBGEData } from '../types';

interface IBGEMunicipioStatsProps {
    codigoIBGE: string;
}

const IBGEMunicipioStats: React.FC<IBGEMunicipioStatsProps> = ({ codigoIBGE }) => {
    const [data, setData] = useState<FormattedIBGEData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIBGE = async () => {
            setIsLoading(true);
            const res = await getIBGEData(codigoIBGE);
            setData(res);
            setIsLoading(false);
        };
        fetchIBGE();
    }, [codigoIBGE]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const stats = [
        { label: 'População', value: data.populacao, unit: 'hab', icon: 'groups', color: 'text-blue-500' },
        { label: 'PIB per capita', value: `R$ ${parseFloat(data.pibPerCapita).toLocaleString('pt-BR')}`, unit: '', icon: 'payments', color: 'text-emerald-500' },
        { label: 'Área Territorial', value: data.area, unit: 'km²', icon: 'map', color: 'text-amber-500' },
        { label: 'Densidade', value: data.densidade, unit: 'hab/km²', icon: 'grid_view', color: 'text-indigo-500' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`material-symbols-outlined ${stat.color} text-xl`}>{stat.icon}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-navy-dark dark:text-white">{stat.value}</span>
                        <span className="text-[10px] font-medium text-slate-400">{stat.unit}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default IBGEMunicipioStats;
