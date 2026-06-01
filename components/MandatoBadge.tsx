import React from 'react';

interface MandatoBadgeProps {
    origem: 'Alê Portela' | 'Lincoln Portela' | string;
    className?: string;
}

const MandatoBadge: React.FC<MandatoBadgeProps> = ({ origem, className = "" }) => {
    const isAle = origem === 'Alê Portela';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAle
                ? 'bg-turquoise/10 text-turquoise border border-turquoise/20'
                : 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
            } ${className}`}>
            <span className="material-symbols-outlined text-[12px]">
                {isAle ? 'person' : 'person_4'}
            </span>
            {origem}
        </span>
    );
};

export default MandatoBadge;
