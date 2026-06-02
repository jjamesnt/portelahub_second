import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  mode?: 'global' | 'modular';
  onResetError?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary Catch]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onResetError) {
      this.props.onResetError();
    }
  };

  private handleClearCacheAndReload = () => {
    console.log('[ErrorBoundary] Limpando cache e recarregando...');
    try {
      localStorage.removeItem('portela_hub_last_sync');
      // Limpa qualquer cache mantido no localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('Erro ao limpar cache local:', e);
    }
    window.location.reload();
  };

  private handleGoToDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Altera a URL no histórico e força a navegação recarregando ou disparando o evento
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (this.props.onResetError) {
      this.props.onResetError();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isGlobal = this.props.mode === 'global';

      // Design ultra premium, alinhado com a identidade do Portela Hub
      const content = (
        <div className={`flex flex-col items-center justify-center text-center p-6 md:p-12 space-y-6 animate-fade-in ${
          isGlobal ? 'min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200' : 'h-full w-full bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 py-16'
        }`}>
          {/* Ícone Estilizado com Micro-Animação */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-full scale-150 animate-ping opacity-75 duration-1000 size-16 mx-auto"></div>
            <div className="relative size-16 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-900/50">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl">warning</span>
            </div>
          </div>

          <div className="max-w-md space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {isGlobal ? 'Erro Crítico de Inicialização' : 'Ops, este módulo falhou'}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {isGlobal 
                ? 'O aplicativo encontrou um problema ao inicializar. Isso pode ser causado por inconsistência temporária de rede ou durante a transição do seu domínio.'
                : 'Não foi possível renderizar esta seção. O erro foi compartimentalizado e não afetará os demais módulos do sistema.'
              }
            </p>
          </div>

          {/* Botões de Ação Premium */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleTryAgain}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-600/15 hover:shadow-red-600/25 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Tentar Novamente
            </button>

            {!isGlobal && (
              <button
                onClick={this.handleGoToDashboard}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border border-slate-200 dark:border-slate-600"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                Ir para o Painel
              </button>
            )}

            <button
              onClick={this.handleClearCacheAndReload}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border border-slate-200 dark:border-slate-600"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Limpar Cache e Recarregar
            </button>
          </div>

          {/* Depuração Técnica Colapsável */}
          <div className="w-full max-w-2xl text-left border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 mt-4 transition-all">
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer select-none text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  DETALHES TÉCNICOS DO ERRO
                </span>
                <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180">keyboard_arrow_down</span>
              </summary>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 font-mono text-[11px] leading-relaxed text-red-600 dark:text-red-400 overflow-x-auto space-y-2">
                <div className="font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-100 dark:border-red-900/20">
                  {this.state.error && this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto p-2 bg-slate-100 dark:bg-slate-950/60 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          </div>
        </div>
      );

      if (isGlobal) {
        return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            {content}
          </div>
        );
      }

      return content;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
