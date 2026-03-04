"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { formataDados } from "@/lib/formataDados";
import {
  Box, Container, Paper, Typography, Stack, Button, Autocomplete, 
  TextField, Divider, CircularProgress, FormControlLabel, Checkbox
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CadastroReserva() {
  const params = useParams();
  const id = params?.id as string; // 🛡️ Garantindo a leitura do ID
  const router = useRouter();
  const { empresaId } = useEmpresa();
  
  // 🛡️ Verifica se é novo de forma segura
  const isNovo = id === "novo" || !id || id === "undefined";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [machos, setMachos] = useState<any[]>([]);
  const [femeas, setFemeas] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);

  const [form, setForm] = useState({
    criadouro_id: null as any,
    data_reserva: new Date().toISOString().split('T')[0],
    pai_id: null as any,
    mae_id: null as any,
    especie_id: null as any,
    formado: false,
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    pago_sinal: 0,
    saldo: 0,
    ano_periodo: "2025/2026",
    previsao_criacao: 1
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      const [resCli, resPas, resEsp] = await Promise.all([
        supabase.from("criadouros").select("id, razao_social").eq("empresa_uuid", empresaId),
        supabase.from("passaros").select("id, nome, anilha, sexo, especie_id").eq("empresa_id", empresaId),
        supabase.from("especies_sispass").select("id, nomes_comuns")
      ]);

      setClientes(resCli.data || []);
      setMachos(resPas.data?.filter(p => p.sexo === 'M') || []);
      setFemeas(resPas.data?.filter(p => p.sexo === 'F') || []);
      setEspecies(resEsp.data || []);

      // 🛡️ Só busca no banco se o ID for um UUID válido (não for 'novo' ou 'undefined')
      if (!isNovo) {
        const { data, error } = await supabase
          .from("reserva_filhotes")
          .select("*")
          .eq("id", id)
          .single();
        
        if (data && !error) setForm(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // 🧬 Filtro de Fêmeas por Espécie do Pai
  const femeasFiltradas = useMemo(() => {
    if (!form.pai_id) return femeas;
    const pai = machos.find(p => p.id === form.pai_id);
    return femeas.filter(f => f.especie_id === pai?.especie_id);
  }, [form.pai_id, femeas, machos]);

  const nomeEspecie = useMemo(() => {
    return especies.find(e => e.id === form.especie_id)?.nomes_comuns?.[0] || "";
  }, [form.especie_id, especies]);

  // 💰 Cálculos Financeiros
  useEffect(() => {
    const total = form.quantidade * form.valor_unitario;
    const saldo = total - form.pago_sinal;
    setForm(prev => ({ ...prev, valor_total: total, saldo }));
  }, [form.quantidade, form.valor_unitario, form.pago_sinal]);

  const handleMoedaInput = (campo: string, v: string) => {
    const limpo = v.replace(/\D/g, "");
    const num = limpo === "" ? 0 : parseFloat(limpo) / 100;
    setForm({ ...form, [campo]: num });
  };

  const handleSalvar = async () => {
  // Validações básicas antes de tentar salvar
  if (!form.criadouro_id) return alert("Por favor, selecione o Cliente (Criadouro).");
  if (!form.especie_id) return alert("A espécie deve estar definida (selecione o Pai).");
  
  setSalvando(true);
  
  try {
    const payload = { ...form, empresa_id: empresaId };
    
    // Executa a operação no Supabase
    const { error } = isNovo 
      ? await supabase.from("reserva_filhotes").insert([payload])
      : await supabase.from("reserva_filhotes").update(payload).eq("id", id);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      // ✅ Mensagem de sucesso personalizada conforme a operação
      const mensagem = isNovo 
        ? "Reserva inserida com sucesso!" 
        : "Reserva atualizada com sucesso!";
      
      alert(mensagem); // Feedback visual para o usuário
      
      // Só redireciona depois que o usuário clicar no "OK" do alerta
      router.push("/inicial_page/reproducao/reserva");
    }
  } catch (err) {
    console.error("Erro inesperado:", err);
    alert("Ocorreu um erro inesperado ao tentar salvar.");
  } finally {
    setSalvando(false);
  }
};
  if (loading) return <Box p={10} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        sx={{ p: 4, borderRadius: 4, borderColor: "#cbd5e1", borderWidth: "4px", borderStyle: "solid" }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box component="img" src="/icons/reserva-passaros.png" alt="Reserva" sx={{ width: 96, height: 96, objectFit: 'contain' }} />
            <Typography variant="h4" fontWeight="900" color="#1e293b">
              {isNovo ? "Nova Reserva" : "Editar Reserva"}
            </Typography>
          </Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Voltar</Button>
        </Box>

        <Stack spacing={3}>
          {/* Cliente e Datas */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2 }}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(o) => o.razao_social}
              value={clientes.find(c => c.id === form.criadouro_id) || null}
              onChange={(_, v) => setForm({ ...form, criadouro_id: v?.id })}
              renderInput={(p) => <TextField {...p} label="Cliente (Criadouro)" size="small" />}
            />
            <TextField type="date" label="Data" InputLabelProps={{ shrink: true }} size="small" value={form.data_reserva} onChange={(e) => setForm({ ...form, data_reserva: e.target.value })} />
            <TextField label="Ano/Período" size="small" value={form.ano_periodo} onChange={(e) => setForm({ ...form, ano_periodo: e.target.value })} />
          </Box>

          <Divider sx={{ fontWeight: 'bold' }}>GENÉTICA E ESPÉCIE</Divider>

          {/* Genética */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 2 }}>
            <Autocomplete
              options={machos}
              getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
              value={machos.find(p => p.id === form.pai_id) || null}
              onChange={(_, v) => setForm({ ...form, pai_id: v?.id, especie_id: v?.especie_id || null, mae_id: null })}
              renderInput={(p) => <TextField {...p} label="Pai" size="small" />}
            />
            <Autocomplete
              options={femeasFiltradas}
              disabled={!form.pai_id}
              getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
              value={femeasFiltradas.find(f => f.id === form.mae_id) || null}
              onChange={(_, v) => setForm({ ...form, mae_id: v?.id })}
              renderInput={(p) => <TextField {...p} label="Mãe" size="small" />}
            />
            <TextField label="Espécie" size="small" value={nomeEspecie} InputProps={{ readOnly: true }} sx={{ bgcolor: "#f8fafc" }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <TextField label="Previsão (Ordem)" type="number" sx={{ width: 180 }} size="small" value={form.previsao_criacao} onChange={(e) => setForm({ ...form, previsao_criacao: Number(e.target.value) })} />
            <FormControlLabel control={<Checkbox checked={form.formado} onChange={(e) => setForm({ ...form, formado: e.target.checked })} />} label="Casal já formado?" />
          </Box>

          <Divider sx={{ fontWeight: 'bold' }}>VALORES</Divider>

          {/* Financeiro */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1.5fr 1.5fr', gap: 1.5 }}>
            <TextField label="Qtde" type="number" size="small" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
            <TextField label="Unitário" size="small" value={formataDados(Math.round(form.valor_unitario * 100), "moeda")} onChange={(e) => handleMoedaInput("valor_unitario", e.target.value)} />
            <TextField label="Total" size="small" disabled value={formataDados(Math.round(form.valor_total * 100), "moeda")} sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#1e293b", fontWeight: 'bold' } }} />
            <TextField label="Sinal" size="small" value={formataDados(Math.round(form.pago_sinal * 100), "moeda")} onChange={(e) => handleMoedaInput("pago_sinal", e.target.value)} />
            <TextField label="Saldo" size="small" disabled value={formataDados(Math.round(form.saldo * 100), "moeda")} 
              sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: form.saldo > 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' } }} 
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={salvando} sx={{ px: 10, py: 1.5, bgcolor: "#1e293b", fontWeight: "900", borderRadius: 2 }}>
              Salvar Reserva
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}