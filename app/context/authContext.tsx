"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  usuarioLogado: boolean;
  setUsuarioLogado: (value: boolean) => void;
  usuarioId: string | null;
  carregando: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // 1. Função única para tratar a sessão e evitar repetição de lógica
    const tratarSessao = (session: any) => {
      const ehImpressao = typeof window !== "undefined" && window.location.pathname.includes("/imprimir");

      if (session?.user) {
        setUsuarioId(session.user.id);
        setUsuarioLogado(true);
      } else if (!ehImpressao) {
        setUsuarioId(null);
        setUsuarioLogado(false);
      }
      // 🔹 A chave do sucesso: Só paramos de carregar após ter uma resposta (positiva ou negativa)
      setCarregando(false);
    };

    // 2. Busca inicial (F5)
    const inicializarAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      tratarSessao(session);
    };

    inicializarAuth();

    // 3. Ouvinte de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      tratarSessao(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, usuarioId, carregando }}>
      {/* 🔹 DICA DE OURO: Enquanto estiver carregando a sessão do F5, 
          não renderizamos nada que possa disparar redirecionamentos. */}
      {!carregando ? children : (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
           <img src="/logo.png" style={{ width: 100, opacity: 0.5 }} /> 
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};