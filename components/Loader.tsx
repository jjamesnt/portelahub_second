
import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex justify-center items-center p-12">
            <div className="size-8 border-4 border-slate-200 dark:border-slate-700 border-t-turquoise rounded-full animate-spin"></div>
        </div>
    );
};

export default Loader;
