"use client";
import { createContext, useContext, useState } from "react";

type AuthContextType = {
  usuarioLogado: boolean;
  setUsuarioLogado: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuarioLogado, setUsuarioLogado] = useState(false);

  return (
    <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};