"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

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

  // 🔹 Controle do pop-out
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setCelular("");
  }, []);

  const handleSalvar = async () => {
    if (senha !== confirmarSenha) {
      setDialogTitle("Erro de Cadastro");
      setDialogMessage("As senhas não conferem!");
      setOpenDialog(true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setDialogTitle("Erro de Cadastro");

      if (error.message.includes("usuarios_email_key")) {
        setDialogMessage(
          "Este e‑mail já está cadastrado em nosso sistema. Caso não lembre sua senha, utilize a opção Recuperar Senha na tela de login."
        );
      } else {
        setDialogMessage("Não foi possível concluir o cadastro. Detalhes: " + error.message);
      }

      setOpenDialog(true);
      return;
    }

    const authUserId = data.user?.id;

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
      setDialogTitle("Erro de Cadastro");

      if (insertError.message.includes("usuarios_email_key")) {
        setDialogMessage(
          "Este e‑mail já está cadastrado em nosso sistema. Caso não lembre sua senha, utilize a opção Recuperar Senha na tela de login."
        );
      } else {
        setDialogMessage("Erro ao salvar na tabela de usuários: " + insertError.message);
      }

      setOpenDialog(true);
    } else {
      setDialogTitle("Cadastro realizado com sucesso!");
      setDialogMessage(
        "Agora você precisa acessar seu e‑mail e clicar no link de validação para ativar sua conta. Caso não encontre o e‑mail na caixa de entrada, verifique também a aba de Spam."
      );
      setOpenDialog(true);
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <img src="/logo-ornigen.png" alt="Logo OrniGen" style={{ width: "250px" }} />
      </Box>

      <Box
        sx={{
          width: 400,
          p: 4,
          boxShadow: 6,               // sombra mais forte
          borderRadius: 2,
          border: "2px solid #1976d2", // borda azul visível em todos os lados
          backgroundColor: "#fff",     // fundo branco destacado
        }}

      >
        <Typography
            variant="h5"
            sx={{
              color: "darkblue",
              fontWeight: "bold",
              textAlign: "center",
              mb: 3,
            }}
          >
            Criar Novo Usuário
          </Typography>



        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth />
          <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />

          <TextField
            label="Senha"
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                    {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmar Senha"
            type={mostrarSenha ? "text" : "password"}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                    {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField label="Celular" value={celular} onChange={(e) => setCelular(e.target.value)} fullWidth />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button variant="outlined" color="secondary" onClick={handleLimpar}>
            Limpar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSalvar}>
            Salvar
          </Button>
        </Box>
      </Box>

      {/* 🔹 Pop-out de feedback (sucesso ou erro) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              if (dialogTitle === "Cadastro realizado com sucesso!") {
                router.push("/login");
              }
            }}
            variant="contained"
            color="primary"
          >
            {dialogTitle === "Cadastro realizado com sucesso!" ? "Ir para Login" : "Fechar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
