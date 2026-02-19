"use client";
import { createContext, useContext, useState, useEffect } from "react";

type EmpresaContextType = {
  empresaId: string | null;
  setEmpresaId: (id: string | null) => void;
  nomeEmpresa: string | null;
  setNomeEmpresa: (nome: string | null) => void;
};

const EmpresaContext = createContext<EmpresaContextType>({
  empresaId: null,
  setEmpresaId: () => {},
  nomeEmpresa: null,
  setNomeEmpresa: () => {},
});

export const EmpresaProvider = ({ children }: { children: React.ReactNode }) => {
  const [empresaId, setEmpresaIdState] = useState<string | null>(null);
  const [nomeEmpresa, setNomeEmpresaState] = useState<string | null>(null);

  // 🔹 Carrega os dados do localStorage ao iniciar
  useEffect(() => {
    const savedId = localStorage.getItem("ornigen_empresa_id");
    const savedNome = localStorage.getItem("ornigen_empresa_nome");
    if (savedId) setEmpresaIdState(savedId);
    if (savedNome) setNomeEmpresaState(savedNome);
  }, []);

  // 🔹 Funções customizadas para salvar no State e no LocalStorage simultaneamente
  const setEmpresaId = (id: string | null) => {
    setEmpresaIdState(id);
    if (id) {
      localStorage.setItem("ornigen_empresa_id", id);
    } else {
      localStorage.removeItem("ornigen_empresa_id");
    }
  };

  const setNomeEmpresa = (nome: string | null) => {
    setNomeEmpresaState(nome);
    if (nome) {
      localStorage.setItem("ornigen_empresa_nome", nome);
    } else {
      localStorage.removeItem("ornigen_empresa_nome");
    }
  };

  return (
    <EmpresaContext.Provider value={{ empresaId, setEmpresaId, nomeEmpresa, setNomeEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (!context) throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider");
  return context;
};