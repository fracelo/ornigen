"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, TextField, Button,
  Stack, CircularProgress, Divider, MenuItem, Autocomplete,
  InputAdornment, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";

export default function MovimentacaoEstoque() {
  const router = useRouter();
  const { empresaId } = useEmpresa();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alimentos, setAlimentos] = useState<any[]>([]);
  
  // Estado do Formulário
  const [alimentoSelecionado, setAlimentoSelecionado] = useState<any>(null);
  const [tipo, setTipo] = useState<'E' | 'S'>('E'); 
  const [subtipo, setSubtipo] = useState(''); // COMPRA, CONSUMO, VENDA, etc.
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");

  // Ajusta o subtipo padrão ao trocar entre Entrada e Saída
  useEffect(() => {
    setSubtipo(tipo === 'E' ? 'COMPRA' : 'CONSUMO');
  }, [tipo]);

  const carregarAlimentos = useCallback(async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await supabase
        .from("alimentos")
        .select("id, nome, marca, unidade_medida, estoque_atual")
        .eq("empresa_id", empresaId)
        .order("nome");
      
      if (error) throw error;
      setAlimentos(data || []);
    } catch (err) {
      console.error("Erro ao carregar alimentos:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { carregarAlimentos(); }, [carregarAlimentos]);

  const handleSalvar = async () => {
    if (!alimentoSelecionado) return alert("Selecione um alimento.");
    if (!quantidade || Number(quantidade) <= 0) return alert("Informe uma quantidade válida.");
    if (!subtipo) return alert("Selecione a finalidade da movimentação.");
    if (!empresaId) return alert("Empresa não identificada.");

    setSalvando(true);
    try {
      // 1. Inserir na tabela de movimentação com o novo campo 'subtipo'
      const { error: errorMov } = await supabase
        .from("alimentos_estoque_mov")
        .insert([{
          empresa_id: empresaId,
          alimento_id: alimentoSelecionado.id,
          tipo: tipo,
          subtipo: subtipo, // Identifica se é Consumo, Venda, Compra, etc.
          quantidade: Number(quantidade),
          motivo: motivo
        }]);

      if (errorMov) throw errorMov;

      // 2. Atualizar o saldo na tabela 'alimentos'
      const novoSaldo = tipo === 'E' 
        ? Number(alimentoSelecionado.estoque_atual) + Number(quantidade)
        : Number(alimentoSelecionado.estoque_atual) - Number(quantidade);

      const { error: errorAlt } = await supabase
        .from("alimentos")
        .update({ estoque_atual: novoSaldo })
        .eq("id", alimentoSelecionado.id);

      if (errorAlt) throw errorAlt;

      alert("Movimentação registrada e estoque atualizado!");
      router.push("/inicial_page/alimentos/cadastro");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar movimentação.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        sx={{ p: 4, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1", bgcolor: "#ffffff" }}
      >
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                component="img"
                src="/icons/movimento.png"
                alt="Ícone Estoque"
                sx={{ width: 96, height: 96, objectFit: 'contain' }}
              />
              <Box>
                <Typography variant="h4" fontWeight="900" color="#1e293b">Movimentar Estoque</Typography>
                <Typography variant="body2" color="text.secondary">Entradas e saídas manuais de insumos</Typography>
              </Box>
            </Box>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.back()}
              sx={{ fontWeight: "bold", color: "#64748b" }}
            >
              Voltar
            </Button>
          </Box>

          <Divider />

          <Autocomplete
            options={alimentos}
            getOptionLabel={(option) => `${option.nome} ${option.marca ? `(${option.marca})` : ""} - Saldo: ${option.estoque_atual}${option.unidade_medida}`}
            value={alimentoSelecionado}
            onChange={(_, newValue) => setAlimentoSelecionado(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Buscar Alimento" placeholder="Digite o nome do alimento..." fullWidth required />
            )}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'center' }}>
            
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>Tipo de Movimento</Typography>
              <ToggleButtonGroup
                value={tipo}
                exclusive
                onChange={(_, newTipo) => newTipo && setTipo(newTipo)}
                fullWidth
              >
                <ToggleButton 
                  value="E" 
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: tipo === 'E' ? "#10b981 !important" : "#fff",
                    color: tipo === 'E' ? "#fff !important" : "#64748b",
                    '&:hover': { bgcolor: tipo === 'E' ? "#059669" : "#f8fafc" }
                  }}
                >
                  ENTRADA (+)
                </ToggleButton>
                <ToggleButton 
                  value="S" 
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: tipo === 'S' ? "#ef4444 !important" : "#fff",
                    color: tipo === 'S' ? "#fff !important" : "#64748b",
                    '&:hover': { bgcolor: tipo === 'S' ? "#dc2626" : "#f8fafc" }
                  }}
                >
                  SAÍDA (-)
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              select
              label="Finalidade / Subtipo"
              fullWidth
              value={subtipo}
              onChange={(e) => setSubtipo(e.target.value)}
            >
              {tipo === 'E' ? [
                <MenuItem key="COMPRA" value="COMPRA">Compra (Reposição)</MenuItem>,
                <MenuItem key="AJ_E" value="AJUSTE_ENTRADA">Ajuste de Estoque (Entrada)</MenuItem>
              ] : [
                <MenuItem key="CONS" value="CONSUMO">Consumo Interno (Manejo)</MenuItem>,
                <MenuItem key="VEND" value="VENDA">Venda para Terceiros</MenuItem>,
                <MenuItem key="AJ_S" value="AJUSTE_SAIDA">Ajuste / Perda / Vencimento</MenuItem>
              ]}
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              label={`Quantidade (${alimentoSelecionado?.unidade_medida || ""})`}
              type="number"
              fullWidth
              value={quantidade === 0 ? "" : quantidade}
              onChange={(e) => setQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={() => !quantidade && setQuantidade("")}
              inputProps={{ step: "0.001" }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><InventoryIcon /></InputAdornment>,
              }}
            />
            <TextField
              label="Motivo / Observação"
              fullWidth
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Compra NF 150..."
            />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<CloseIcon />} 
              onClick={() => router.back()}
              sx={{ px: 4, fontWeight: 'bold', color: "#64748b", borderColor: "#cbd5e1" }}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar} 
              disabled={salvando || !alimentoSelecionado}
              sx={{ 
                bgcolor: tipo === 'E' ? "#10b981" : "#ef4444", 
                fontWeight: '900', 
                px: 6, 
                py: 1.5,
                borderRadius: 2,
                "&:hover": { bgcolor: tipo === 'E' ? "#059669" : "#dc2626" }
              }}
            >
              {salvando ? "PROCESSANDO..." : `CONFIRMAR ${tipo === 'E' ? 'ENTRADA' : 'SAÍDA'}`}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}