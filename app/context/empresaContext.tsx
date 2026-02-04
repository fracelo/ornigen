"use client";
import { createContext, useContext, useState } from "react";

type EmpresaContextType = {
  empresaId: string | null;
  setEmpresaId: (id: string | null) => void;
  nomeEmpresa: string | null; // ✅ padronizado
  setNomeEmpresa: (nome: string | null) => void;
};

const EmpresaContext = createContext<EmpresaContextType>({
  empresaId: null,
  setEmpresaId: () => {},
  nomeEmpresa: null,
  setNomeEmpresa: () => {},
});

export const EmpresaProvider = ({ children }: { children: React.ReactNode }) => {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState<string | null>(null);

  return (
    <EmpresaContext.Provider value={{ empresaId, setEmpresaId, nomeEmpresa, setNomeEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => useContext(EmpresaContext);