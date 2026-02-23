"use client";

import { useState, useEffect, useCallback, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, TextField, 
  Button, Stack, MenuItem, CircularProgress, Divider, IconButton 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CadastroAnilhaFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isEditar = id !== "novo";

  const [loading, setLoading] = useState(isEditar);
  const [salvando, setSalvando] = useState(false);
  const [femeas, setFemeas] = useState<any[]>([]);

  // Estado do formulário
  const [form, setForm] = useState({
    numero: "",
    status: "Livre",
    passaro_femea_id: "" as string | number,
    ano_referencia: new Date().getFullYear().toString(),
    data_entrada: new Date().toISOString().split('T')[0],
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;

    try {
      // 1. Carrega as fêmeas para o Select
      const { data: fem } = await supabase
        .from("passaros")
        .select("id, nome, anilha")
        .eq("empresa_id", empresaId)
        .eq("sexo", "F")
        .order("nome");
      setFemeas(fem || []);

      // 2. Se for edição, busca os dados da anilha
      if (isEditar) {
        const { data, error } = await supabase
          .from("anilhas")
          .select("*")
          .eq("id", id)
          .single();
        
        if (data) setForm({
          numero: data.numero,
          status: data.status,
          passaro_femea_id: data.passaro_femea_id || "",
          ano_referencia: data.ano_referencia || "",
          data_entrada: data.data_entrada || "",
        });
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId, isEditar]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvar = async () => {
    if (!empresaId) return;
    setSalvando(true);

    const payload = {
      ...form,
      empresa_id: empresaId,
      numero: form.numero.toUpperCase(),
      passaro_femea_id: form.passaro_femea_id || null
    };

    try {
      let error;
      if (isEditar) {
        const { error: err } = await supabase.from("anilhas").update(payload).eq("id", id);
        error = err;
      } else {
        const { error: err } = await supabase.from("anilhas").insert([payload]);
        error = err;
      }

      if (error) throw error;

      alert(isEditar ? "Anilha atualizada!" : "Anilha cadastrada!");
      
      // Se for novo, limpa apenas o número para permitir cadastro em lote
      if (!isEditar) {
        setForm(prev => ({ ...prev, numero: "" }));
        document.getElementById("input-numero")?.focus();
      } else {
        router.push("/inicial_page/anilhas");
      }
    } catch (err: any) {
      if (err.code === "23505") alert("Este número de anilha já existe nesta empresa!");
      else console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={() => router.push("/inicial_page/anilhas")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" color="primary">
            {isEditar ? "Editar Anilha" : "Nova Anilha"}
          </Typography>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        <Stack spacing={3}>
          <TextField
            select
            label="Fêmea Vinculada (Mãe)"
            value={form.passaro_femea_id}
            onChange={(e) => setForm({ ...form, passaro_femea_id: e.target.value })}
            fullWidth
          >
            <MenuItem value=""><em>Nenhuma (Anilha Avulsa)</em></MenuItem>
            {femeas.map(f => (
              <MenuItem key={f.id} value={f.id}>{f.nome} ({f.anilha})</MenuItem>
            ))}
          </TextField>

          <TextField
            id="input-numero"
            label="Número da Anilha"
            fullWidth
            required
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            placeholder="Ex: SISPASS RJ 3.5 123456"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Ano REF"
              sx={{ flex: 1 }}
              value={form.ano_referencia}
              onChange={(e) => setForm({ ...form, ano_referencia: e.target.value })}
            />
            <TextField
              select
              label="Status"
              sx={{ flex: 1 }}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="Livre">Livre</MenuItem>
              <MenuItem value="Utilizada">Utilizada</MenuItem>
              <MenuItem value="Descartada">Descartada</MenuItem>
              <MenuItem value="Extraviada">Extraviada</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="Data de Entrada"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.data_entrada}
            onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
          />

          <Box sx={{ pt: 2 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSalvar}
              disabled={salvando || !form.numero}
            >
              {salvando ? "Salvando..." : isEditar ? "Atualizar Anilha" : "Salvar e Continuar"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}