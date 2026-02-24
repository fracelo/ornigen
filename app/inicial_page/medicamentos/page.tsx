"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, Button, 
  CircularProgress, Stack 
} from "@mui/material";
import { useRouter } from "next/navigation";

// Ícones
import InventoryIcon from "@mui/icons-material/Inventory";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function DashboardMedicamentos() {
  const { empresaId } = useEmpresa();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicamentos: 0,
    agendaSemana: 0,
    agendaHoje: 0,
    pendentesHoje: 0,
    aplicadosHoje: 0
  });

  useEffect(() => {
    if (empresaId) carregarDados();
  }, [empresaId]);

  async function carregarDados() {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    const dataFimSemana = proximaSemana.toISOString().split('T')[0];

    try {
      const [meds, agendaSem, agendaHj] = await Promise.all([
        supabase.from("medicamentos").select("id", { count: "exact" }).eq("empresa_id", empresaId),
        supabase.from("agenda_saude").select("id", { count: "exact" })
          .eq("empresa_id", empresaId)
          .gte("data_programada", hoje)
          .lte("data_programada", dataFimSemana),
        supabase.from("agenda_saude").select("status")
          .eq("empresa_id", empresaId)
          .eq("data_programada", hoje)
      ]);

      const aplicados = agendaHj.data?.filter(i => i.status === 'Aplicado').length || 0;
      const pendentes = agendaHj.data?.filter(i => i.status === 'Pendente').length || 0;

      setStats({
        totalMedicamentos: meds.count || 0,
        agendaSemana: agendaSem.count || 0,
        agendaHoje: (agendaHj.data?.length || 0),
        pendentesHoje: pendentes,
        aplicadosHoje: aplicados
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight="900" color="primary" sx={{ mb: 3 }}>
        PAINEL DE SAÚDE
      </Typography>

      {/* 🔹 BOX CONTAINER (Substituindo o Grid) */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 4 
      }}>
        {/* Usamos flexBasis para definir o tamanho (ex: 48% para caber dois por linha ou 100%) */}
        <StatCard title="Remédios" value={stats.totalMedicamentos} icon={<InventoryIcon color="info" />} flexBasis={{ xs: '47%', sm: '31%' }} />
        <StatCard title="Na Semana" value={stats.agendaSemana} icon={<CalendarMonthIcon color="action" />} flexBasis={{ xs: '47%', sm: '31%' }} />
        <StatCard title="Total Hoje" value={stats.agendaHoje} icon={<EventNoteIcon color="primary" />} flexBasis={{ xs: '100%', sm: '32%' }} />
        
        <StatCard title="A Aplicar" value={stats.pendentesHoje} icon={<PendingActionsIcon color="warning" />} color="#fff4e5" flexBasis="47%" />
        <StatCard title="Aplicados" value={stats.aplicadosHoje} icon={<CheckCircleOutlineIcon color="success" />} color="#edf7ed" flexBasis="47%" />
      </Box>

      {/* 🔹 BOTÕES DE NAVEGAÇÃO */}
      <Stack spacing={2}>
        <Button 
          variant="contained" 
          fullWidth 
          size="large"
          startIcon={<EventNoteIcon />}
          onClick={() => router.push("/inicial_page/medicamentos/agenda")}
          sx={{ py: 2, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          IR PARA AGENDA / MANEJO
        </Button>

        <Button 
          variant="outlined" 
          fullWidth 
          size="large"
          startIcon={<InventoryIcon />}
          onClick={() => router.push("/inicial_page/medicamentos/cadastros")}
          sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}
        >
          GERENCIAR CADASTROS E ESTOQUE
        </Button>
      </Stack>
    </Container>
  );
}

// Sub-componente atualizado com flexBasis
function StatCard({ title, value, icon, color = "#fff", flexBasis }: any) {
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        borderRadius: 3, 
        textAlign: 'center', 
        bgcolor: color, 
        flexGrow: 1, 
        flexBasis: flexBasis,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ mb: 1 }}>{icon}</Box>
      <Typography variant="h4" fontWeight="900">{value}</Typography>
      <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
        {title}
      </Typography>
    </Paper>
  );
}