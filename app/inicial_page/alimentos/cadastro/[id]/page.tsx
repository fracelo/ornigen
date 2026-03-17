"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Stack, CircularProgress, Divider, MenuItem, InputAdornment 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import BarcodeIcon from "@mui/icons-material/QrCode";
import { formataDados } from "@/lib/formataDados"; // Certifique-se do caminho correto

function FormAlimentoContent() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [grupos, setGrupos] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    nome: "",
    marca: "",
    codigo_barras: "", 
    grupo_id: "",
    unidade_medida: "g",
    estoque_minimo: 0,
    valor_unitario_custo: 0,
    valor_unitario_venda: 0
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const { data: resGrupos } = await supabase
        .from("alimentos_grupos")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("nome");
      setGrupos(resGrupos || []);

      if (!isNovo) {
        const { data, error } = await supabase
          .from("alimentos")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (data) setForm(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do formulário:", err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Função auxiliar para lidar com a digitação de valores mascarados
  const handleMascaraChange = (campo: string, valorDigitado: string) => {
    const apenasNumeros = valorDigitado.replace(/\D/g, "");
    const valorNumerico = parseFloat(apenasNumeros) / 100;
    setForm(prev => ({ ...prev, [campo]: valorNumerico }));
  };

  const handleSalvar = async () => {
    if (!form.codigo_barras || form.codigo_barras.trim() === "") {
      alert("O Código de Barras é obrigatório!");
      return;
    }
    if (!form.nome || !form.grupo_id) {
      alert("Nome e Grupo são obrigatórios!");
      return;
    }

    setSalvando(true);
    try {
      const payload = { ...form, empresa_id: empresaId };
      if (isNovo) {
        const { error } = await supabase.from("alimentos").insert([payload]);
        if (error?.code === '23505') {
          alert("Este Código de Barras já está cadastrado em outro produto!");
          setSalvando(false); return;
        }
        if (error) throw error;
        alert("Alimento cadastrado!");
      } else {
        const { error } = await supabase.from("alimentos").update(form).eq("id", id);
        if (error?.code === '23505') {
          alert("Este Código de Barras já está em uso!");
          setSalvando(false); return;
        }
        if (error) throw error;
        alert("Alimento atualizado!");
      }
      router.push("/inicial_page/alimentos/cadastro");
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
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1", bgcolor: "#ffffff" }}>
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box component="img" src="/icons/cadastro.png" sx={{ width: 96, height: 96, objectFit: 'contain' }} />
              <Typography variant="h4" fontWeight="900" color="#1e293b">
                {isNovo ? "Novo Alimento" : "Editar Alimento"}
              </Typography>
            </Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/alimentos/cadastro")} sx={{ fontWeight: "bold", color: "#64748b" }}>
              Voltar
            </Button>
          </Box>

          <Divider />

          <Box sx={{ width: '100%' }}>
            <TextField 
              label="Código de Barras" 
              fullWidth autoFocus={isNovo}
              value={form.codigo_barras || ""} 
              inputProps={{ maxLength: 20 }}
              onChange={(e) => setForm({...form, codigo_barras: e.target.value})}
              InputProps={{ startAdornment: <InputAdornment position="start"><BarcodeIcon color="primary" /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc" }, maxWidth: { md: '50%' } }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField label="Nome do Alimento" fullWidth value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} />
            <TextField label="Marca" fullWidth value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} />
            
            <TextField select label="Grupo de Alimento" fullWidth value={form.grupo_id} onChange={(e) => setForm({...form, grupo_id: e.target.value})}>
              {grupos.map(g => <MenuItem key={g.id} value={g.id}>{g.nome}</MenuItem>)}
            </TextField>

            <TextField select label="Unidade de Medida" fullWidth value={form.unidade_medida} onChange={(e) => setForm({...form, unidade_medida: e.target.value})}>
              <MenuItem value="g">Gramas (g)</MenuItem>
              <MenuItem value="kg">Quilos (kg)</MenuItem>
              <MenuItem value="ml">Mililitros (ml)</MenuItem>
              <MenuItem value="un">Unidade (un)</MenuItem>
            </TextField>

            {/* 🔹 ESTOQUE MÍNIMO MASCARADO */}
            <TextField 
                label="Estoque Mínimo (Alerta)" 
                fullWidth
                value={formataDados((form.estoque_minimo * 100).toFixed(0), "decimal")} 
                onChange={(e) => handleMascaraChange("estoque_minimo", e.target.value)}
            />

            {/* 🔹 VALOR CUSTO MASCARADO */}
            <TextField 
                label="Valor Custo (Un)" 
                fullWidth
                value={formataDados((form.valor_unitario_custo * 100).toFixed(0), "moeda")} 
                onChange={(e) => handleMascaraChange("valor_unitario_custo", e.target.value)}
            />

            {/* 🔹 VALOR VENDA MASCARADO */}
            <TextField 
                label="Valor Venda (Un)" 
                fullWidth
                value={formataDados((form.valor_unitario_venda * 100).toFixed(0), "moeda")} 
                onChange={(e) => handleMascaraChange("valor_unitario_venda", e.target.value)}
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => router.push("/inicial_page/alimentos/cadastro")} sx={{ px: 4, fontWeight: 'bold' }}>
              Sair
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={salvando} sx={{ bgcolor: "#1e293b", fontWeight: '900', px: 6, py: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#334155" } }}>
              {salvando ? "PROCESSANDO..." : "GRAVAR DADOS"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function Page() { return <Suspense fallback={<CircularProgress />}><FormAlimentoContent /></Suspense>; }