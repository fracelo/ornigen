"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  MenuItem, Select, FormControl, InputLabel, Stack, Divider 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function FormCategoria() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [loading, setLoading] = useState(true);
  const [todasCategorias, setTodasCategorias] = useState<any[]>([]);
  const [form, setForm] = useState({
    descricao: "",
    tipo: "D", // D ou C
    pai_id: "" as any,
    nivel: 0
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    
    // Busca todas para o combo de "Pai"
    const { data: lista } = await supabase
      .from("categorias")
      .select("*")
      .eq("empresa_id", empresaId);
    
    setTodasCategorias(lista || []);

    if (!isNovo) {
      const { data } = await supabase.from("categorias").select("*").eq("id", id).single();
      if (data) setForm(data);
    }
    setLoading(false);
  }, [empresaId, id, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Filtra as opções de "Pai" baseado no tipo (D/C) e limita a níveis 0 e 1
  const opcoesPai = useMemo(() => {
    return todasCategorias
      .filter(c => c.tipo === form.tipo && c.nivel < 2 && c.id !== id)
      .sort((a, b) => a.nivel - b.nivel);
  }, [todasCategorias, form.tipo, id]);

  const handleSalvar = async () => {
    if (!form.descricao) return alert("Descrição obrigatória.");
    
    // Define o nível automaticamente baseado no pai selecionado
    let nivelCalculado = 0;
    if (form.pai_id) {
      const pai = todasCategorias.find(c => c.id === form.pai_id);
      nivelCalculado = pai ? pai.nivel + 1 : 0;
    }

    const payload = { 
      ...form, 
      empresa_id: empresaId, 
      nivel: nivelCalculado,
      pai_id: form.pai_id || null 
    };

    const { error } = isNovo 
      ? await supabase.from("categorias").insert([payload])
      : await supabase.from("categorias").update(payload).eq("id", id);

    if (error) alert("Erro: " + error.message);
    else {
      alert("Categoria salva!");
      router.push("/inicial_page/financeiro/categorias");
    }
  };

  if (loading) return <Typography p={5}>Carregando...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3, border: "2px solid #e2e8f0" }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              {isNovo ? "Nova Categoria" : "Editar Categoria"}
            </Typography>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Voltar</Button>
          </Box>

          <Divider />

          <FormControl fullWidth>
            <InputLabel>Tipo de Movimentação</InputLabel>
            <Select
              value={form.tipo}
              label="Tipo de Movimentação"
              onChange={(e) => setForm({ ...form, tipo: e.target.value, pai_id: "" })}
            >
              <MenuItem value="D">Débito (Saída/Despesa)</MenuItem>
              <MenuItem value="C">Crédito (Entrada/Receita)</MenuItem>
            </Select>
          </FormControl>

          <TextField 
            label="Descrição da Conta" 
            fullWidth 
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Conta Pai (Hierarquia)</InputLabel>
            <Select
              value={form.pai_id || ""}
              label="Conta Pai (Hierarquia)"
              onChange={(e) => setForm({ ...form, pai_id: e.target.value })}
            >
              <MenuItem value=""><em>Nenhuma (Esta será uma Conta Mestra)</em></MenuItem>
              {opcoesPai.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nivel === 1 ? "— " : ""}{p.descricao}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ p: 2, bgcolor: "#f1f5f9", borderRadius: 2 }}>
            <Typography variant="caption" color="textSecondary">
              O nível será definido automaticamente como: 
              <strong> {form.pai_id ? (todasCategorias.find(c => c.id === form.pai_id)?.nivel + 1) : 0}</strong>
            </Typography>
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            startIcon={<SaveIcon />}
            onClick={handleSalvar}
            sx={{ bgcolor: "#1e293b", py: 1.5 }}
          >
            Gravar Categoria
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}