"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Button, Paper, TextField, 
  Stack, MenuItem, Checkbox, FormControlLabel, Autocomplete, 
  CircularProgress, Alert, Divider 
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function TelaGerarAgendamento() {
  const { empresaId } = useEmpresa();
  const router = useRouter();
  
  const [passaros, setPassaros] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [config, setConfig] = useState({
    passaro_id: "",
    medicamento_id: "",
    data_inicio: new Date().toISOString().split('T')[0],
    tipo_limite: 'dias', 
    quantidade: 5,
    periodos: { manha: true, tarde: true, noite: false },
    dias_semana: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 0: true } // Todos ativos
  });

  useEffect(() => {
    async function carregarDados() {
      if (!empresaId) return;
      try {
        const [resP, resM] = await Promise.all([
          supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).order("nome"),
          supabase.from("medicamentos").select("id, nome").eq("empresa_id", empresaId).order("nome")
        ]);
        setPassaros(resP.data || []);
        setMedicamentos(resM.data || []);
      } catch (err) {
        setErro("Falha ao carregar dados.");
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarDados();
  }, [empresaId]);

  const toggleDia = (dia: number) => {
    setConfig({
      ...config,
      dias_semana: { ...config.dias_semana, [dia]: !(config.dias_semana as any)[dia] }
    });
  };

  const handleSalvarRegra = async () => {
    if (!config.passaro_id || !config.medicamento_id) {
      setErro("Selecione o pássaro e o medicamento.");
      return;
    }

    setLoading(true);
    setErro(null);

    const dosesParaInserir: any[] = [];
    const grupoId = crypto.randomUUID();
    const dataLoop = new Date(config.data_inicio + "T12:00:00");
    
    let dosesContadas = 0;
    let diasContados = 0;

    try {
      for (let i = 0; i < 365; i++) {
        if (config.tipo_limite === 'dias' && diasContados >= config.quantidade) break;
        if (config.tipo_limite === 'doses' && dosesContadas >= config.quantidade) break;

        const diaAtual = dataLoop.getDay();

        // Verifica se o checkbox do dia está marcado
        if ((config.dias_semana as any)[diaAtual]) {
          let teveDoseNoDia = false;
          const periodosMap = [
            { key: 'manha', label: 'Manhã' },
            { key: 'tarde', label: 'Tarde' },
            { key: 'noite', label: 'Noite' }
          ];

          for (const p of periodosMap) {
            if ((config.periodos as any)[p.key]) {
              if (config.tipo_limite === 'doses' && dosesContadas >= config.quantidade) break;
              
              dosesParaInserir.push({
                empresa_id: empresaId,
                passaro_id: config.passaro_id,
                medicamento_id: config.medicamento_id,
                data_programada: dataLoop.toISOString().split('T')[0],
                periodo: p.label,
                grupo_tratamento_id: grupoId,
                status: 'Pendente'
              });
              dosesContadas++;
              teveDoseNoDia = true;
            }
          }
          if (teveDoseNoDia) diasContados++;
        }
        dataLoop.setDate(dataLoop.getDate() + 1);
      }

      const { error } = await supabase.from("agenda_saude").insert(dosesParaInserir);
      if (error) throw error;

      router.push("/inicial_page/medicamentos/agenda");
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar.");
      setLoading(false);
    }
  };

  const diasLabels = [
    { l: 'S', v: 1 }, { l: 'T', v: 2 }, { l: 'Q', v: 3 }, 
    { l: 'Q', v: 4 }, { l: 'S', v: 5 }, { l: 'S', v: 6 }, { l: 'D', v: 0 }
  ];

  if (carregandoDados) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/medicamentos/agenda")} sx={{ mb: 2 }}>
        Voltar
      </Button>
      
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight="900" mb={3} color="primary">PROGRAMAR TRATAMENTO</Typography>
        
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <Stack spacing={3}>
           <Autocomplete
              options={passaros}
              getOptionLabel={(o) => `${o.anilha || 'S/A'} - ${o.nome}`}
              onChange={(_, v) => setConfig({...config, passaro_id: v?.id || ""})}
              renderInput={(params) => <TextField {...params} label="Pássaro" variant="outlined" />}
            />

            <Autocomplete
              options={medicamentos}
              getOptionLabel={(o) => o.nome}
              onChange={(_, v) => setConfig({...config, medicamento_id: v?.id || ""})}
              renderInput={(params) => <TextField {...params} label="Medicamento" variant="outlined" />}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="Duração" fullWidth value={config.tipo_limite} onChange={(e) => setConfig({...config, tipo_limite: e.target.value})}>
                <MenuItem value="dias">Dias Corridos</MenuItem>
                <MenuItem value="doses">Total de Doses</MenuItem>
              </TextField>
              <TextField label="Qtd" type="number" sx={{ width: 100 }} value={config.quantidade} onChange={(e) => setConfig({...config, quantidade: Number(e.target.value)})} />
            </Box>

            <TextField label="Data de Início" type="date" fullWidth value={config.data_inicio} onChange={(e) => setConfig({...config, data_inicio: e.target.value})} InputLabelProps={{ shrink: true }} />

            <Divider />

            {/* SEÇÃO DE PERÍODOS */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">PERÍODOS DIÁRIOS</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <FormControlLabel control={<Checkbox size="small" checked={config.periodos.manha} onChange={e => setConfig({...config, periodos: {...config.periodos, manha: e.target.checked}})}/>} label="Manhã" />
                <FormControlLabel control={<Checkbox size="small" checked={config.periodos.tarde} onChange={e => setConfig({...config, periodos: {...config.periodos, tarde: e.target.checked}})}/>} label="Tarde" />
                <FormControlLabel control={<Checkbox size="small" checked={config.periodos.noite} onChange={e => setConfig({...config, periodos: {...config.periodos, noite: e.target.checked}})}/>} label="Noite" />
              </Box>
            </Box>

            {/* SEÇÃO DE DIAS DA SEMANA COM CHECKBOX */}
                <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">REPETIR NOS DIAS DA SEMANA</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    {diasLabels.map((dia) => (
                    <Box key={dia.v} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        sx={{ color: dia.v === 0 ? 'error.main' : 'text.primary' }}
                        >
                        {dia.l}
                        </Typography>
                        <Checkbox 
                        size="small" 
                        // 🔹 Removido o 'padding-0' que causava o erro
                        checked={(config.dias_semana as any)[dia.v]} 
                        onChange={() => toggleDia(dia.v)}
                        // 🔹 O padding é controlado aqui pelo sx
                        sx={{ p: 0.5 }} 
                        />
                    </Box>
                    ))}
                </Box>
                </Box>

            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              onClick={handleSalvarRegra} 
              disabled={loading} 
              sx={{ borderRadius: 3, py: 2, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "GERAR AGENDA"}
            </Button>
        </Stack>
      </Paper>
    </Container>
  );
}