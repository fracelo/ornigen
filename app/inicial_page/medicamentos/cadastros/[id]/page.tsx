"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { Box, Container, TextField, Button, Typography, Paper, MenuItem, Stack, IconButton, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

export default function FormMedicamentoPage() {
  const { id } = useParams();
  const { empresaId } = useEmpresa();
  const router = useRouter();
  const isNovo = id === "novo";

  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "Tratamento",
    fabricante: "",
    unidade_medida: "ml",
    estoque_atual: 0,
    estoque_minimo: 1
  });

  useEffect(() => {
    if (!isNovo && empresaId) {
      carregarMedicamento();
    }
  }, [id, empresaId]);

  async function carregarMedicamento() {
    const { data } = await supabase.from("medicamentos").select("*").eq("id", id).single();
    if (data) setForm(data);
  }

  const handleSalvar = async () => {
    if (!form.nome) { alert("O nome é obrigatório."); return; }
    setSalvando(true);

    try {
      const payload = { ...form, empresa_id: empresaId };
      
      if (isNovo) {
        await supabase.from("medicamentos").insert([payload]);
      } else {
        await supabase.from("medicamentos").update(payload).eq("id", id);
      }
      
      router.push("/inicial_page/medicamentos/cadastros");
    } catch (err) {
      alert("Erro ao salvar medicamento.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => router.back()}><ArrowBackIcon /></IconButton>
        <Typography variant="h6" fontWeight="900">
          {isNovo ? "NOVO MEDICAMENTO" : "EDITAR CADASTRO"}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0' }}>
        <Stack spacing={3}>
          <TextField 
            label="Nome do Medicamento" 
            fullWidth 
            value={form.nome} 
            onChange={(e) => setForm({...form, nome: e.target.value})} 
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              select label="Tipo" sx={{ flex: 1 }} 
              value={form.tipo} 
              onChange={(e) => setForm({...form, tipo: e.target.value})}
            >
              {["Vacina", "Preventivo", "Tratamento", "Suplemento", "Vitamina"].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField 
              label="Unidade" sx={{ flex: 1 }} 
              placeholder="Ex: ml, g, un" 
              value={form.unidade_medida} 
              onChange={(e) => setForm({...form, unidade_medida: e.target.value})} 
            />
          </Box>

          <TextField 
            label="Fabricante / Marca" 
            fullWidth 
            value={form.fabricante} 
            onChange={(e) => setForm({...form, fabricante: e.target.value})} 
          />

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">CONTROLE DE STOCK</Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Qtd Atual" type="number" sx={{ flex: 1 }} 
              value={form.estoque_atual} 
              onChange={(e) => setForm({...form, estoque_atual: Number(e.target.value)})} 
            />
            <TextField 
              label="Aviso Mínimo" type="number" sx={{ flex: 1 }} 
              value={form.estoque_minimo} 
              onChange={(e) => setForm({...form, estoque_minimo: Number(e.target.value)})} 
            />
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            startIcon={<SaveIcon />} 
            onClick={handleSalvar}
            disabled={salvando}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold', mt: 2 }}
          >
            {salvando ? "A GUARDAR..." : "SALVAR MEDICAMENTO"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}