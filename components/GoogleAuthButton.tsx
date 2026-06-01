
import React, { useState, useEffect } from 'react';
import { initGoogleClient, signIn, signOut, isSignedIn } from '../services/googleCalendar';

const GoogleAuthButton: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initGoogleClient();
                // Check initial status
                setIsLoggedIn(isSignedIn());

                // Listen for sign-in state changes
                window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsLoggedIn);
            } catch (error) {
                console.error("Google Auth Init Failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const handleAuth = async () => {
        if (isLoggedIn) {
            await signOut();
        } else {
            await signIn();
        }
    };

    if (isLoading) return <div className="animate-pulse h-8 w-8 bg-slate-200 rounded-full"></div>;

    return (
        <button
            onClick={handleAuth}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isLoggedIn
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
            title={isLoggedIn ? "Desconectar Google Calendar" : "Conectar Google Calendar"}
        >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
            {isLoggedIn ? 'Desconectar' : 'Conectar Agenda'}
        </button>
    );
};

export default GoogleAuthButton;
