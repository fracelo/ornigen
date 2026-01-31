"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type EmpresaContextType = {
  empresaId: string | null;
  setEmpresaId: (id: string | null) => void;
};

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  return (
    <EmpresaContext.Provider value={{ empresaId, setEmpresaId }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider");
  }
  return context;
}