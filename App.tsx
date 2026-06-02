
import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Loader from './components/Loader';
const MunicipioDetalhesPage = React.lazy(() => import('./pages/MunicipioDetalhesPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const MunicipiosPage = React.lazy(() => import('./pages/MunicipiosPage'));
const LiderancasPage = React.lazy(() => import('./pages/LiderancasPage'));
const AssessoresPage = React.lazy(() => import('./pages/AssessoresPage'));
const AgendaPage = React.lazy(() => import('./pages/AgendaPage'));
const ConfiguracoesPage = React.lazy(() => import('./pages/ConfiguracoesPage'));
const GestaoRecursosPage = React.lazy(() => import('./pages/GestaoRecursosPage'));
const DemandasPage = React.lazy(() => import('./pages/DemandasPage'));
const DemandaMunicipioPage = React.lazy(() => import('./pages/DemandaMunicipioPage'));
const RecursosRelatorioPage = React.lazy(() => import('./pages/RecursosRelatorioPage'));
const ApoiadoresPage = React.lazy(() => import('./pages/ApoiadoresPage'));
const ApoiadorPerfilPage = React.lazy(() => import('./pages/ApoiadorPerfilPage'));

import SyncSpreadsheetModal from './components/SyncSpreadsheetModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { AppContext } from './context/AppContext';
import { syncSpreadsheetData } from './services/api';
import { useEffect, useRef } from 'react';

interface PageState {
  page: string;
  params?: { [key: string]: any };
}

const AppContent: React.FC = () => {
  const context = React.useContext(AppContext);
  const [currentPage, setCurrentPage] = useState<PageState>(() => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (params.get('report') === 'recursos') {
      return { page: 'RecursosRelatorio' };
    }

    const urlParams = Object.fromEntries(params.entries());

    if (path.includes('/municipios')) return { page: 'Municípios', params: urlParams };
    if (path.includes('/liderancas')) return { page: 'Lideranças', params: urlParams };
    if (path.includes('/assessores')) return { page: 'Assessores', params: urlParams };
    if (path.includes('/agenda')) return { page: 'Agenda', params: urlParams };
    if (path.includes('/recursos')) return { page: 'Recursos', params: urlParams };
    if (path.includes('/demandas')) return { page: 'Demandas', params: urlParams };
    if (path.includes('/configuracoes')) return { page: 'Configurações', params: urlParams };
    if (path.includes('/apoiador/')) return { page: 'ApoiadorPerfil', params: { id: path.split('/apoiador/')[1], ...urlParams } };
    if (path.includes('/apoiadores')) return { page: 'Apoiadores', params: urlParams };

    return { page: 'Dashboard' };
  });

  if (!context) return null;
  const { user, profile, isLoading, rolePermissions, toast, hideToast } = context;
  const hasSynced = useRef(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    const initSync = async () => {
      const url = localStorage.getItem('portela_hub_sync_url');
      if (user && profile?.role === 'master' && url && !hasSynced.current) {
        hasSynced.current = true;
        console.log('[App] Iniciando sincronização automática de login...');
        try {
          await syncSpreadsheetData(url);
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('portela_hub_last_sync', now);
          console.log('[App] Sincronização automática concluída.');
        } catch (err) {
          console.error('[App] Erro na sincronização de login:', err);
        }
      }
    };
    initSync();
  }, [user]);

  const navigateTo = (page: string, params?: { [key: string]: any }) => {
    setCurrentPage({ page, params });

    const pathMap: { [key: string]: string } = {
      'Dashboard': '/',
      'Municípios': '/municipios',
      'Lideranças': '/liderancas',
      'Assessores': '/assessores',
      'Agenda': '/agenda',
      'Recursos': '/recursos',
      'Demandas': '/demandas',
      'Configurações': '/configuracoes',
      'Apoiadores': '/apoiadores'
    };

    if (pathMap[page]) {
      window.history.pushState({}, '', pathMap[page]);
    } else if (page === 'ApoiadorPerfil' && params?.id) {
      window.history.pushState({}, '', `/apoiador/${params.id}`);
    }
  };



  const renderContent = () => {
    const role = profile?.role || 'user';
    const allowedModules = role === 'master'
        ? ['Dashboard', 'Municípios', 'Lideranças', 'Apoiadores', 'Assessores', 'Agenda', 'Recursos', 'Demandas', 'Configurações']
        : (profile?.permissions && profile.permissions.length > 0)
            ? profile.permissions
            : (rolePermissions[role] || []);
    
    // Mapeamento de sub-páginas para seus módulos principais
    const subPageMap: Record<string, string> = {
      'MunicipioDetalhes': 'Municípios',
      'RecursosRelatorio': 'Recursos',
      'DemandaMunicipio': 'Demandas',
      'ApoiadorPerfil': 'Apoiadores'
    };

    const currentModule = subPageMap[currentPage.page] || currentPage.page;

    // Se o módulo atual não for permitido, tenta ir para o primeiro permitido
    if (allowedModules.length > 0 && !allowedModules.includes(currentModule)) {
      const firstAllowed = allowedModules[0];
      // Para evitar loops infinitos, só navegamos se houver um destino válido
      if (firstAllowed && firstAllowed !== currentPage.page) {
        setTimeout(() => navigateTo(firstAllowed), 0);
        return <div className="h-full flex items-center justify-center"><Loader /></div>;
      }
    }

    if (allowedModules.length === 0 && !isLoading) {
       return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum módulo disponível para seu perfil</div>;
    }

    switch (currentPage.page) {
      case 'Dashboard':
        return <DashboardPage navigateTo={navigateTo} />;
      case 'Municípios':
        return <MunicipiosPage navigateTo={navigateTo} />;
      case 'MunicipioDetalhes':
        return <MunicipioDetalhesPage municipioId={currentPage.params?.id} navigateTo={navigateTo} />;
      case 'Lideranças':
        return <LiderancasPage navigateTo={navigateTo} params={currentPage.params} />;
      case 'Assessores':
        return <AssessoresPage navigateTo={navigateTo} />;
      case 'Agenda':
        return <AgendaPage navigateTo={navigateTo} params={currentPage.params} />;
      case 'Recursos':
        return <GestaoRecursosPage navigateTo={navigateTo} />;
      case 'RecursosRelatorio':
        return <RecursosRelatorioPage />;
      case 'Demandas':
        return <DemandasPage navigateTo={navigateTo} />;
      case 'DemandaMunicipio':
        return <DemandaMunicipioPage municipioId={currentPage.params?.municipioId} municipioNome={currentPage.params?.municipioNome || ''} demandaId={currentPage.params?.demandaId} navigateTo={navigateTo} />;
      case 'Configurações':
        return <ConfiguracoesPage navigateTo={navigateTo} />;
      case 'Apoiadores':
        return <ApoiadoresPage navigateTo={navigateTo} />;
      case 'ApoiadorPerfil':
        return <ApoiadorPerfilPage apoiadorId={currentPage.params?.id} navigateTo={navigateTo} />;
      default:
        return <div className="p-8 text-center text-slate-500 font-bold">Página não encontrada</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader />
      </div>
    );
  }

  // Fluxo de Autenticação e Autorização
  if (!user) {
    return <LoginPage />;
  }

  // Só mostramos a tela de Falha de Conexão se tivermos um erro explícito retornado
  if (!profile && context.profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md border border-slate-100 dark:border-slate-700 space-y-6 text-red-500">
          <span className="material-symbols-outlined text-6xl">cloud_off</span>
          <h2 className="text-2xl font-black">Falha de Conexão</h2>
          <p className="text-sm text-slate-500 font-medium">
            Não foi possível carregar seu perfil. Isso pode ocorrer por instabilidade na internet ou falhas de configuração.
            <br /><br />
            <strong>Diagnostic:</strong> {context.profileError || 'No error details'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-4"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => context.signOut()}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all ml-2 mt-4"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="size-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-amber-500 animate-pulse">hourglass_top</span>
          </div>
          <h2 className="text-2xl font-black text-navy-dark dark:text-white">Acesso Pendente</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Sua solicitação está em análise. Você receberá um e-mail assim que seu acesso for liberado pelo administrador.
          </p>
          <button
            onClick={() => context.signOut()}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md border border-slate-100 dark:border-slate-700 space-y-6 text-red-500">
          <span className="material-symbols-outlined text-6xl">block</span>
          <h2 className="text-2xl font-black">Acesso Bloqueado</h2>
          <p className="text-sm text-slate-500 font-medium">Contate o suporte para mais informações.</p>
        </div>
      </div>
    );
  }

  // Se estiver tudo OK (active), renderiza o app normal
  if (currentPage.page === 'RecursosRelatorio') {
    return (
      <main className="min-h-screen bg-white">
        <ErrorBoundary
          key={currentPage.page}
          mode="modular"
          onResetError={() => navigateTo('Dashboard')}
        >
          <React.Suspense fallback={<div className="h-full flex items-center justify-center p-12"><Loader /></div>}>
            {renderContent()}
          </React.Suspense>
        </ErrorBoundary>
        
        {/* Toast em Relatório */}
        {toast?.isOpen && (
          <div className="fixed top-6 right-6 z-[10005] animate-in slide-in-from-top-12 md:slide-in-from-right-12 fade-in duration-300">
            <div className={`flex items-center gap-3 pl-4 pr-5 py-3.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none max-w-sm ${
              toast.type === 'success' ? 'border-emerald-500/30 text-emerald-800 dark:text-emerald-300' :
              toast.type === 'error' ? 'border-rose-500/30 text-rose-800 dark:text-rose-300' :
              'border-sky-500/30 text-sky-800 dark:text-sky-300'
            }`}>
              <span className={`material-symbols-outlined text-[22px] shrink-0 ${
                toast.type === 'success' ? 'text-emerald-500' :
                toast.type === 'error' ? 'text-rose-500' :
                'text-sky-500'
              }`}>
                {toast.type === 'success' ? 'check_circle' :
                 toast.type === 'error' ? 'error' : 'info'}
              </span>
              <p className="text-xs font-bold leading-normal text-slate-700 dark:text-slate-200">
                {toast.message}
              </p>
              <button 
                onClick={hideToast}
                className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="flex h-screen-dynamic w-full overflow-hidden">
      <Sidebar 
        activePage={currentPage.page} 
        setActivePage={(page, params) => navigateTo(page, params)} 
        onSyncClick={() => setIsSyncModalOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background-light dark:bg-background-dark w-full px-safe-left px-safe-right">
          <ErrorBoundary
            key={currentPage.page}
            mode="modular"
            onResetError={() => navigateTo('Dashboard')}
          >
            <React.Suspense fallback={<div className="h-full flex items-center justify-center p-12"><Loader /></div>}>
              {renderContent()}
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Toast Notification Premium */}
      {toast?.isOpen && (
        <div className="fixed top-6 right-6 z-[10005] animate-in slide-in-from-top-12 md:slide-in-from-right-12 fade-in duration-300">
          <div className={`flex items-center gap-3 pl-4 pr-5 py-3.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none max-w-sm ${
            toast.type === 'success' ? 'border-emerald-500/30 text-emerald-800 dark:text-emerald-300' :
            toast.type === 'error' ? 'border-rose-500/30 text-rose-800 dark:text-rose-300' :
            'border-sky-500/30 text-sky-800 dark:text-sky-300'
          }`}>
            <span className={`material-symbols-outlined text-[22px] shrink-0 ${
              toast.type === 'success' ? 'text-emerald-500' :
              toast.type === 'error' ? 'text-rose-500' :
              'text-sky-500'
            }`}>
              {toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="text-xs font-bold leading-normal text-slate-700 dark:text-slate-200">
              {toast.message}
            </p>
            <button 
              onClick={hideToast}
              className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {profile?.role === 'master' && (
        <SyncSpreadsheetModal 
          isOpen={isSyncModalOpen} 
          onClose={() => setIsSyncModalOpen(false)} 
          onSuccess={() => {
            // Recarregar os dados na tela corrente
            if (currentPage.page === 'Apoiadores' || currentPage.page === 'Municípios') {
              navigateTo(currentPage.page, currentPage.params);
            }
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
