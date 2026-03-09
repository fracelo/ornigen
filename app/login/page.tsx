"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { 
  Box, Typography, Button, TextField, Paper, Container, CssBaseline, CircularProgress,
  IconButton, InputAdornment 
} from "@mui/material";
import { useRouter } from "next/navigation";
import { formataDados } from "../lib/formataDados";
import { useEmpresa } from "../context/empresaContext";
import { useAuth } from "../context/authContext";

// Ícones para o campo de senha
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


export default function LoginPage() {
  const router = useRouter();
  
  const { setUsuarioLogado } = useAuth(); 
  const { setEmpresaId, setNomeEmpresa } = useEmpresa();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  // 🔹 Estado para controlar a visibilidade da senha
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleClickMostrarSenha = () => setMostrarSenha((show) => !show);

  const handleLogin = async () => {
    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);

    try {
      const emailFormatado = formataDados(email.trim(), "email");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFormatado,
        password: senha,
      });

      if (error) {
        alert("Usuário ou senha inválidos.");
        setCarregando(false);
        return;
      }

      const user = data.user;

      if (user) {
        setUsuarioLogado(true);

        const { data: empresas, error: erroVinculo } = await supabase
          .from("empresa_usuarios")
          .select("empresa_id, status")
          .eq("usuario_id", user.id);

        if (erroVinculo) throw erroVinculo;

        const autorizadas = empresas?.filter((e) => e.status === "autorizado") || [];

        if (autorizadas.length === 0) {
          router.push("/convite-empresa");
          return;
        }

        const empresaId = autorizadas[0].empresa_id;

        const { data: empresaData } = await supabase
          .from("empresas")
          .select("razao_social, nome_fantasia")
          .eq("id", empresaId)
          .single();

        setEmpresaId(empresaId);
        setNomeEmpresa(empresaData?.nome_fantasia || empresaData?.razao_social || "Empresa");

        router.push("/inicial_page");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      alert("Ocorreu um erro inesperado ao tentar logar.");
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)" }}>
      <CssBaseline />
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          
          <Box sx={{ mb: 2 }}>
            <img src="/logo-ornigen.png" alt="Logo OrniGen" style={{ maxWidth: "240px", height: "auto" }} />
          </Box>

          <Typography variant="h5" sx={{ color: "#0d47a1", fontWeight: 700, mb: 3 }}>
            Acessar OrniGen
          </Typography>

          <TextField 
            label="E-mail" 
            fullWidth 
            margin="normal" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            onKeyDown={handleKeyDown}
          />
          
          <TextField 
            label="Senha" 
            // 🔹 Tipo dinâmico baseado no estado mostrarSenha
            type={mostrarSenha ? "text" : "password"} 
            fullWidth 
            margin="normal" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            onKeyDown={handleKeyDown}
            sx={{ mb: 3 }}
            // 🔹 Adicionando o ícone do olho no final do campo
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="alternar visibilidade da senha"
                    onClick={handleClickMostrarSenha}
                    edge="end"
                  >
                    {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={carregando}
            onClick={handleLogin}
            sx={{ py: 1.5, backgroundColor: "#1976d2", fontWeight: "bold", borderRadius: "8px" }}
          >
            {carregando ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
          </Button>

          <Box sx={{ mt: 3, textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography 
              variant="body2" 
              onClick={() => router.push("/usuarios")} 
              sx={{ color: "#1976d2", cursor: "pointer", fontWeight: 500 }}
            >
              Criar Novo Registro
            </Typography>
            <Typography 
              variant="body2" 
              onClick={() => router.push("/recuperar-senha")} 
              sx={{ color: "#666", cursor: "pointer" }}
            >
              Esqueceu sua senha?
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}