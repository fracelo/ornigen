"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Stack, Button, 
  TextField, Divider, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CadastroAnilha() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { empresaId } = useEmpresa();

  const isEditar = id !== "novo" && id !== undefined && id !== "undefined";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [femeas, setFemeas] = useState<any[]>([]);

  const [form, setForm] = useState({
    numero: "",
    status: "Livre", // Default para novos registros
    data_entrada: new Date().toISOString().split('T')[0],
    passaro_femea_id: null as any,
    ano_referencia: new Date().getFullYear().toString(),
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;

    // Busca fêmeas para o combo de vínculo
    const { data: resFemeas } = await supabase
      .from("passaros")
      .select("id, nome, anilha")
      .eq("empresa_id", empresaId)
      .eq("sexo", "F");

    setFemeas(resFemeas || []);

    if (isEditar) {
      const { data, error } = await supabase
        .from("anilhas")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data && !error) {
        setForm({
          ...data,
          status: data.status || "Livre" // Traz o que está no banco
        });
      }
    }
    setLoading(false);
  }, [id, empresaId, isEditar]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvar = async () => {
    if (!form.numero) return alert("O número da anilha é obrigatório.");
    
    setSalvando(true);
    
    try {
      const payload = { 
        ...form, 
        empresa_id: empresaId,
        numero: form.numero.trim(),
        passaro_femea_id: form.passaro_femea_id || null 
      };

      const { error } = isEditar 
        ? await supabase.from("anilhas").update(payload).eq("id", id)
        : await supabase.from("anilhas").insert([payload]);

      if (error) {
        if (error.code === "23505") {
          alert("Erro: Este número de anilha já existe nesta empresa!");
        } else {
          alert(`Erro ao salvar: ${error.message}`);
        }
        return;
      }

      alert(isEditar ? "Anilha atualizada com sucesso!" : "Anilha cadastrada com sucesso!");
      router.push("/inicial_page/anilhas");

    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro inesperado.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box p={10} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        sx={{ p: 4, borderRadius: 4, borderColor: "#cbd5e1", borderWidth: "4px", borderStyle: "solid", bgcolor: "#ffffff" }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight="900" color="#1e293b">
            {isEditar ? "Editar Anilha" : "Nova Anilha"}
          </Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Voltar</Button>
        </Box>

        <Stack spacing={3}>
          <TextField 
            label="Número da Anilha" 
            fullWidth 
            value={form.numero} 
            onChange={(e) => setForm({ ...form, numero: e.target.value })} 
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="Livre">Livre</MenuItem>
                <MenuItem value="Ocupada">Ocupada</MenuItem>
                <MenuItem value="Fuga">Fuga</MenuItem>
                <MenuItem value="Obito">Óbito</MenuItem>
              </Select>
            </FormControl>

            <TextField 
              label="Ano Referência" 
              value={form.ano_referencia} 
              onChange={(e) => setForm({ ...form, ano_referencia: e.target.value })} 
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Vincular à Fêmea (Opcional)</InputLabel>
            <Select
              label="Vincular à Fêmea (Opcional)"
              value={form.passaro_femea_id || ""}
              onChange={(e) => setForm({ ...form, passaro_femea_id: e.target.value })}
            >
              <MenuItem value=""><em>Nenhuma</em></MenuItem>
              {femeas.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.nome} ({f.anilha})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            type="date" 
            label="Data de Entrada" 
            InputLabelProps={{ shrink: true }} 
            value={form.data_entrada} 
            onChange={(e) => setForm({ ...form, data_entrada: e.target.value })} 
          />

          <Divider />

          <Button 
            variant="contained" 
            fullWidth
            startIcon={<SaveIcon />} 
            onClick={handleSalvar} 
            disabled={salvando}
            sx={{ py: 1.5, bgcolor: "#1e293b", fontWeight: "900", borderRadius: 2 }}
          >
            {salvando ? "Salvando..." : "Gravar Dados"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}