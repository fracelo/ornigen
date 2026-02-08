"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  usuarioLogado: boolean;
  setUsuarioLogado: (value: boolean) => void;
  usuarioId: string | null; // 🔹 novo campo
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuarioLogado(true);
        setUsuarioId(user.id); // 🔹 pega o UUID do usuário logado
      }
    };
    getUser();
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
