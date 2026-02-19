"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  usuarioLogado: boolean;
  setUsuarioLogado: (value: boolean) => void;
  usuarioId: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  // 🔹 Item 1: Carrega a sessão inicial
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioLogado(true);
        setUsuarioId(session.user.id);
      } else {
        setUsuarioLogado(false);
        setUsuarioId(null);
      }
    };
    getSession();
  }, []);

  // 🔹 Item 2: Escuta mudanças de autenticação (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuarioLogado(true);
        setUsuarioId(session.user.id);
      } else {
        setUsuarioLogado(false);
        setUsuarioId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, usuarioId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};