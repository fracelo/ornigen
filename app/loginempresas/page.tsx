"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginEmpresaPage() {
  const [documento, setDocumento] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const router = useRouter();

  // 🔹 Formatação automática CPF/CNPJ
  const formatDocumento = (value: string) => {
    const onlyNums = value.replace(/\D/g, "");
    if (onlyNums.length <= 11) {
      // CPF
      return onlyNums
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    } else {
      // CNPJ
      return onlyNums
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
        .slice(0, 18);
    }
  };

  const handleLogin = async () => {
    if (!documento || !senha) {
      alert("Informe documento e senha.");
      return;
    }

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("documento", documento)
      .eq("senha", senha)
      .single();

    if (error || !data) {
      alert("Documento ou senha inválidos.");
    } else {
      alert("Login realizado com sucesso!");
      router.push("/inicial_page");
    }
  };

  return (
    <div className="login-container">
      {/* Logo OrniGen */}
      <div className="logo-area">
        <img src="/logo-ornigen.png" alt="Logo OrniGen" className="logo" />
      </div>

      {/* Card de login */}
      <div className="card login-card">
        <h2 className="login-title">Login da Empresa</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Documento (CPF/CNPJ)"
            value={documento}
            onChange={(e) => setDocumento(formatDocumento(e.target.value))}
            className="input"
          />

          <div style={{ position: "relative" }}>
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input"
            />
            <span
              onClick={() => setShowSenha(!showSenha)}
              style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}
            >
              {showSenha ? <VisibilityOff /> : <Visibility />}
            </span>
          </div>

          <button onClick={handleLogin} className="btn">
            Entrar
          </button>
        </div>

        <div className="login-links">
          <a href="/recuperar-senha">Recuperar senha</a>
          <a href="/empresas">Novo registro</a>
        </div>
      </div>
    </div>
  );
}

// 🔚 Fim da página