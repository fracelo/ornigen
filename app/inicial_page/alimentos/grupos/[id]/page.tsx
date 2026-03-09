"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Stack, CircularProgress, Divider 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";

export default function CadastroGrupoAlimento() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [loading, setLoading] = useState(!isNovo);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: ""
  });

  const carregarDados = useCallback(async () => {
    if (isNovo || !empresaId) return;
    try {
      const { data, error } = await supabase
        .from("alimentos_grupos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) setForm({ nome: data.nome, descricao: data.descricao || "" });
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvar = async () => {
    if (!form.nome) return alert("O nome do grupo é obrigatório.");
    if (!empresaId) return alert("Erro de contexto: Empresa não identificada.");

    setSalvando(true);
    try {
      if (isNovo) {
        const { error } = await supabase
          .from("alimentos_grupos")
          .insert([{ ...form, empresa_id: empresaId }]);
        if (error) throw error;
        alert("Grupo criado com sucesso!");
      } else {
        const { error } = await supabase
          .from("alimentos_grupos")
          .update(form)
          .eq("id", id);
        if (error) throw error;
        alert("Alterações salvas com sucesso!");
      }
      router.push("/inicial_page/alimentos/grupos");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        sx={{ p: 4, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1", bgcolor: "#ffffff" }}
      >
        <Stack spacing={4}>
          {/* Header Padronizado */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                component="img"
                src="/icons/grupos.png"
                alt="Ícone Grupos"
                sx={{ width: 96, height: 96, objectFit: 'contain' }}
              />
              <Typography variant="h4" fontWeight="900" color="#1e293b">
                {isNovo ? "Novo Grupo" : "Editar Grupo"}
              </Typography>
            </Box>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.push("/inicial_page/alimentos/grupos")}
              sx={{ fontWeight: "bold", color: "#64748b" }}
            >
              Voltar
            </Button>
          </Box>

          <Divider />

          <Stack spacing={3}>
            <TextField
              label="Nome do Grupo"
              fullWidth
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Sementes, Farinhadas, Vitaminas..."
            />

            <TextField
              label="Descrição / Observações"
              fullWidth
              multiline
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Stack>

          {/* Rodapé Padrão OrniGen */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<CloseIcon />} 
              onClick={() => router.push("/inicial_page/alimentos/grupos")} 
              color="inherit"
              sx={{ px: 4, fontWeight: 'bold' }}
            >
              Sair
            </Button>
            
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar} 
              disabled={salvando}
              sx={{ bgcolor: "#1e293b", fontWeight: '900', px: 6, py: 1.5, borderRadius: 2 }}
            >
              {salvando ? "PROCESSANDO..." : isNovo ? "SALVAR GRUPO" : "SALVAR ALTERAÇÕES"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}