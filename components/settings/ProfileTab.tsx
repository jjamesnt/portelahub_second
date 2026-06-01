import React, { useState } from 'react';
import { profileService } from '../../services/profileService';
import { Profile } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';
import SuccessModal from '../SuccessModal';

interface ProfileTabProps {
    profile: Profile | null;
    signOut: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, signOut }) => {
    const { setProfile } = useAppContext();
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-6 md:mb-8">
                <div>
                    <h3 className="text-lg md:text-xl font-black text-navy-dark dark:text-white">Informações do Perfil</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Gerencie suas informações pessoais.</p>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black hover:bg-rose-100 transition-all uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sair
                </button>
            </div>
            <form className="space-y-4 md:space-y-6 max-w-xl" onSubmit={async (e) => {
                e.preventDefault();
                const newName = (e.target as any)[0].value;
                if (!newName || !profile || saving) return;
                
                setSaving(true);
                try {
                    await profileService.updateProfile(profile.id, { full_name: newName });
                    setProfile(prev => prev ? { ...prev, full_name: newName } : null);
                    setShowSuccessModal(true);
                } catch (err) {
                    console.error(err);
                    alert('Erro ao atualizar perfil.');
                } finally {
                    setSaving(false);
                }
            }}>
                <div>
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <div className="flex gap-2 mt-1.5">
                        <input 
                            type="text" 
                            defaultValue={profile?.full_name || ''} 
                            disabled={saving}
                            className="w-full p-2.5 md:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-navy-dark dark:text-white focus:border-turquoise outline-none transition-all disabled:opacity-50" 
                        />
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="px-4 py-2 bg-turquoise text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-turquoise-dark transition-all shadow-md shadow-turquoise/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                            ) : null}
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input type="email" value={profile?.email || ''} disabled className="w-full mt-1.5 p-2.5 md:p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Cargo / Nível</label>
                    <div className="mt-1.5 inline-flex px-3 py-1 bg-turquoise/10 text-turquoise rounded-lg text-xs font-black uppercase tracking-wider">
                        {profile?.role}
                    </div>
                </div>
            </form>

            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                message="Seu nome de perfil foi atualizado com sucesso!"
            />
        </div>
    );
};
