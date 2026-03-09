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
      // Carrega Grupos para o Select
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

  const handleSalvar = async () => {
    if (!form.nome || !form.grupo_id) {
      alert("Nome e Grupo são obrigatórios!");
      return;
    }
    setSalvando(true);
    try {
      const payload = { ...form, empresa_id: empresaId };
      if (isNovo) {
        const { error } = await supabase.from("alimentos").insert([payload]);
        if (error) throw error;
        alert("Alimento cadastrado!");
      } else {
        const { error } = await supabase.from("alimentos").update(form).eq("id", id);
        if (error) throw error;
        alert("Alimento atualizado!");
      }
      router.push("/inicial_page/alimentos/cadastro");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          borderWidth: "4px", 
          borderColor: "#cbd5e1",
          bgcolor: "#ffffff"
        }}
      >
        <Stack spacing={4}>
          {/* Header Padronizado com ícone de 96px */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                component="img"
                src="/icons/cadastro.png"
                alt="Ícone Cadastro"
                sx={{ width: 96, height: 96, objectFit: 'contain' }}
              />
              <Typography variant="h4" fontWeight="900" color="#1e293b">
                {isNovo ? "Novo Alimento" : "Editar Alimento"}
              </Typography>
            </Box>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.push("/inicial_page/alimentos/cadastro")}
              sx={{ fontWeight: "bold", color: "#64748b" }}
            >
              Voltar
            </Button>
          </Box>

          <Divider />

          {/* Grid de Campos */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField 
              label="Nome do Alimento" 
              fullWidth 
              value={form.nome} 
              onChange={(e) => setForm({...form, nome: e.target.value})} 
            />
            <TextField 
              label="Marca" 
              fullWidth 
              value={form.marca} 
              onChange={(e) => setForm({...form, marca: e.target.value})} 
            />
            
            <TextField 
              select 
              label="Grupo de Alimento" 
              fullWidth 
              value={form.grupo_id} 
              onChange={(e) => setForm({...form, grupo_id: e.target.value})}
            >
              {grupos.map(g => <MenuItem key={g.id} value={g.id}>{g.nome}</MenuItem>)}
            </TextField>

            <TextField 
              select 
              label="Unidade de Medida" 
              value={form.unidade_medida} 
              onChange={(e) => setForm({...form, unidade_medida: e.target.value})}
            >
              <MenuItem value="g">Gramas (g)</MenuItem>
              <MenuItem value="kg">Quilos (kg)</MenuItem>
              <MenuItem value="ml">Mililitros (ml)</MenuItem>
              <MenuItem value="un">Unidade (un)</MenuItem>
            </TextField>

            <TextField 
                label="Valor Custo (Un)" 
                type="number" 
                // Se o valor for 0, mostra vazio. 
                // Se houver valor, garante que exiba com 2 casas decimais (ex: 0.90)
                value={form.valor_unitario_custo === 0 ? "" : Number(form.valor_unitario_custo).toFixed(2)} 
                onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                    ...form, 
                    valor_unitario_custo: val === "" ? 0 : Number(val)
                    });
                }}
                onBlur={() => {
                    if (!form.valor_unitario_custo) setForm({...form, valor_unitario_custo: 0});
                }}
                // Importante: step 0.01 permite as casas decimais no navegador
                inputProps={{ step: "0.01" }}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                />

            <TextField 
                label="Valor Venda (Un)" 
                type="number" 
                value={form.valor_unitario_venda === 0 ? "" : Number(form.valor_unitario_venda).toFixed(2)} 
                onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                    ...form, 
                    valor_unitario_venda: val === "" ? 0 : Number(val)
                    });
                }}
                onBlur={() => {
                    if (!form.valor_unitario_venda) setForm({...form, valor_unitario_venda: 0});
                }}
                inputProps={{ step: "0.01" }}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                />

            <TextField 
                    label="Estoque Mínimo (Alerta)" 
                    type="number" 
                    // Exibe vazio se o valor for 0, permitindo digitar direto
                    value={form.estoque_minimo === 0 ? "" : form.estoque_minimo} 
                    onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                        ...form, 
                        estoque_minimo: val === "" ? 0 : Number(val)
                        });
                    }}
                    // Se o usuário apagar tudo e sair do campo, volta para 0 internamente
                    onBlur={() => {
                        if (!form.estoque_minimo) setForm({ ...form, estoque_minimo: 0 });
                    }}
                    fullWidth
                    // Garante que o navegador aceite incrementos de 1 em 1 (inteiros) ou decimais se necessário
                    inputProps={{ step: "1" }} 
                    />
          </Box>

          <Divider />

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<CloseIcon />} 
              onClick={() => router.push("/inicial_page/alimentos/cadastro")}
              sx={{ px: 4, fontWeight: 'bold' }}
            >
              Sair
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar} 
              disabled={salvando} 
              sx={{ 
                bgcolor: "#1e293b", 
                fontWeight: '900', 
                px: 6, 
                py: 1.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "#334155" }
              }}
            >
              {salvando ? "PROCESSANDO..." : "GRAVAR DADOS"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function Page() { return <Suspense fallback={<CircularProgress />}><FormAlimentoContent /></Suspense>; }