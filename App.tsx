
import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Loader from './components/Loader';
import MunicipioDetalhesPage from './pages/MunicipioDetalhesPage';
import DashboardPage from './pages/DashboardPage';
import MunicipiosPage from './pages/MunicipiosPage';
import LiderancasPage from './pages/LiderancasPage';
import AssessoresPage from './pages/AssessoresPage';
import AgendaPage from './pages/AgendaPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import GestaoRecursosPage from './pages/GestaoRecursosPage';
import DemandasPage from './pages/DemandasPage';
import DemandaMunicipioPage from './pages/DemandaMunicipioPage';
import RecursosRelatorioPage from './pages/RecursosRelatorioPage';
import ApoiadoresPage from './pages/ApoiadoresPage';
import ApoiadorPerfilPage from './pages/ApoiadorPerfilPage';

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
  const { user, profile, isLoading, rolePermissions } = context;
  const hasSynced = useRef(false);

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
    return <main className="min-h-screen bg-white">{renderContent()}</main>;
  }

  return (
    <div className="flex h-screen-dynamic w-full overflow-hidden">
      <Sidebar activePage={currentPage.page} setActivePage={(page, params) => navigateTo(page, params)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background-light dark:bg-background-dark w-full px-safe-left px-safe-right">
          {renderContent()}
        </main>
      </div>
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
