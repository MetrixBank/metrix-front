import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to Supabase or console
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-background border border-border/30 rounded-xl">
          <div className="p-4 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Desculpe, encontramos um erro inesperado nesta seção. Tente recarregar a página.
          </p>
          <div className="flex gap-3">
             <Button onClick={() => this.setState({ hasError: false })} variant="outline">
               Tentar Novamente
             </Button>
             <Button onClick={this.handleReload} className="gap-2">
               <RefreshCw className="w-4 h-4" /> Recarregar Página
             </Button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-8 text-left text-xs text-red-400 bg-black/50 p-4 rounded w-full overflow-auto max-h-60">
                <summary>Detalhes do Erro</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;