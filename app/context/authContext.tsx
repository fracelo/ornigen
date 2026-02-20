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
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // 🔹 Se estiver na página de impressão, somos mais tolerantes
        const ehImpressao = window.location.pathname.includes("/imprimir");

        if (session?.user) {
          setUsuarioLogado(true);
          setUsuarioId(session.user.id);
        } else if (!ehImpressao) {
          // Só marca como deslogado se NÃO for a página de impressão
          setUsuarioLogado(false);
          setUsuarioId(null);
        }
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
      } finally {
        setCarregando(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const ehImpressao = window.location.pathname.includes("/imprimir");

      if (session?.user) {
        setUsuarioLogado(true);
        setUsuarioId(session.user.id);
        setCarregando(false);
      } else if (!ehImpressao) {
        // Se a sessão sumir por um microssegundo na aba de impressão, o AuthContext ignora
        setUsuarioLogado(false);
        setUsuarioId(null);
        setCarregando(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, usuarioId, carregando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};