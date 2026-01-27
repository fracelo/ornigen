"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/authContext"; // 🔹 importa o contexto

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUsuarioLogado } = useAuth(); // 🔹 pega função para atualizar login

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUsuarioLogado(true); // 🔹 seta globalmente
      router.push("/inicial_page"); // 🔹 redireciona
    }
  };

  return (
    <div className="login-container">
      <div className="logo-area">
        <img src="/logo-ornigen.png" alt="Logo OrniGen" className="logo" />
      </div>

      <div className="card login-card">
        <h2 className="login-title">Acesse sua conta</h2>

        <div className="form-group">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          <button onClick={handleLogin} className="btn">
            Entrar
          </button>
        </div>

        <div className="login-links">
          <div className="login-links">
            <a href="/recuperar-senha">Recuperar senha</a>
            <a href="/usuarios">Criar novo cadastro</a>
          </div>

        </div>
      </div>
    </div>
  );
}