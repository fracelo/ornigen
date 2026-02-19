"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const router = useRouter();

  const handleRecuperarSenha = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password", // 🔹 durante testes locais
    });

    if (error) {
      setDialogTitle("Erro na Recuperação");
      setDialogMessage("Não foi possível enviar o e‑mail de recuperação: " + error.message);
    } else {
      setDialogTitle("E‑mail enviado!");
      setDialogMessage(
        "Verifique sua caixa de entrada e clique no link para redefinir sua senha. " +
        "Caso não encontre o e‑mail, confira também a pasta de Spam."
      );
    }
    setOpenDialog(true);
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

      {/* 🔹 Card de Recuperar Senha */}
      <Box
        sx={{
          width: 400,
          p: 4,
          boxShadow: 6,
          borderRadius: 2,
          border: "2px solid darkblue",
          backgroundColor: "#fff",
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
          Recuperar Senha
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />

          {/* 🔹 Botão azul escuro */}
          <Button
            variant="contained"
            sx={{ backgroundColor: "darkblue", "&:hover": { backgroundColor: "#0d47a1" } }}
            onClick={handleRecuperarSenha}
            disabled={!email}
          >
            Enviar Link de Recuperação
          </Button>
        </Box>

        {/* 🔹 Links abaixo do botão */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography
            sx={{ color: "darkblue", cursor: "pointer", mb: 1 }}
            onClick={() => router.push("/login")}
          >
            Ir para Login
          </Typography>
          <Typography
            sx={{ color: "darkblue", cursor: "pointer" }}
            onClick={() => router.push("/novo-usuario")}
          >
            Criar Novo Usuário
          </Typography>
        </Box>
      </Box>

      {/* 🔹 Pop-out de feedback */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              if (dialogTitle === "E‑mail enviado!") {
                router.push("/login");
              }
            }}
            variant="contained"
            sx={{ backgroundColor: "darkblue", "&:hover": { backgroundColor: "#0d47a1" } }}
          >
            {dialogTitle === "E‑mail enviado!" ? "Ir para Login" : "Fechar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}