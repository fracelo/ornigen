"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UsuariosPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [celular, setCelular] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const router = useRouter();

  // 🔹 Limpa os campos sempre que a tela abrir
  useEffect(() => {
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setCelular("");
  }, []);

  const handleSalvar = async () => {
    if (senha !== confirmarSenha) {
      alert("As senhas não conferem!");
      return;
    }

    // 1. Cria usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert("Erro ao cadastrar no Auth: " + error.message);
      return;
    }

    const authUserId = data.user?.id;

    // 2. Insere dados extras na tabela usuarios
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        auth_user_id: authUserId,
        nome,
        email,
        celular,
        responsavel: false,
        ativo: true,
      },
    ]);

    if (insertError) {
      alert("Erro ao salvar na tabela usuarios: " + insertError.message);
    } else {
      alert("Usuário cadastrado com sucesso!");
      router.push("/login"); // redireciona para login após cadastro
    }
  };

  const handleLimpar = () => {
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setCelular("");
  };

  return (
    <div className="login-container">
      <div className="logo-area">
        <img src="/logo-ornigen.png" alt="Logo OrniGen" className="logo" />
      </div>

      <div className="card login-card">
        <h2 className="login-title">Criar Novo Usuário</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
            autoComplete="off"
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="new-email"
          />

          <div className="password-field">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="password-field">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Confirmar Senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="input"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>

          <input
            type="text"
            placeholder="Celular"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            className="input"
            autoComplete="off"
          />
        </div>

        <div className="form-actions">
          <button onClick={handleLimpar} className="btn btn-secondary">
            Limpar
          </button>
          <button onClick={handleSalvar} className="btn btn-primary">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}