"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, CircularProgress, 
  Stack, Button, LinearProgress, Card, CardContent, Paper
} from "@mui/material";
import { useRouter } from "next/navigation";

// Ícones
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MedicationIcon from "@mui/icons-material/Medication";
import LockIcon from "@mui/icons-material/Lock";

export default function HomePage() {
  const { empresaId } = useEmpresa();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>({
    stats: { machos: 0, femeas: 0, filhotes: 0, reservas: 0 },
    plano: { nome: "Grátis", limite: 10, atual: 0 },
    permissoes: { financeiro: false, saude: false }
  });

  useEffect(() => {
    async function carregarDashboard() {
      if (!empresaId) return;
      try {
        const [resP, resEmp] = await Promise.all([
          supabase.from("passaros").select("sexo, data_nascimento, status, eh_reprodutor").eq("empresa_id", empresaId),
          supabase.from("empresas").select("*, planos(*)").eq("id", empresaId).single()
        ]);

        const passaros = resP.data || [];
        const planoInfo = resEmp.data?.planos;

        const hoje = new Date();
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(hoje.getFullYear() - 1);

        const stats = passaros.reduce((acc, p) => {
          const dataNasc = new Date(p.data_nascimento);
          if (p.status === "Reservado") acc.reservas++;
          
          if (dataNasc > umAnoAtras) {
            acc.filhotes++;
          } else if (p.eh_reprodutor) {
            if (p.sexo === "M") acc.machos++;
            else if (p.sexo === "F") acc.femeas++;
          }
          return acc;
        }, { machos: 0, femeas: 0, filhotes: 0, reservas: 0 });

        setDados({
          stats,
          plano: {
            nome: planoInfo?.nome || "Grátis",
            limite: planoInfo?.limite_passaros || 10,
            atual: passaros.length
          },
          permissoes: {
            financeiro: planoInfo?.permite_financeiro_full || false,
            saude: planoInfo?.permite_remedios_agenda || false
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDashboard();
  }, [empresaId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  const progressoPlano = (dados.plano.atual / dados.plano.limite) * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* CABEÇALHO */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 4, 
        gap: 2 
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>OrniGen Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Gestão Profissional do Criadouro</Typography>
        </Box>
        
        <Paper variant="outlined" sx={{ p: 2, minWidth: 280, borderRadius: 2, bgcolor: '#fcfcfc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>PLANO: {dados.plano.nome.toUpperCase()}</Typography>
            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>Fazer Upgrade</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progressoPlano} sx={{ height: 8, borderRadius: 5, mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {dados.plano.atual} de {dados.plano.limite} pássaros cadastrados
          </Typography>
        </Paper>
      </Box>

      {/* GRID DE CARDS USANDO BOX + DISPLAY GRID */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 3,
        mb: 3
      }}>
        <Card variant="outlined" sx={{ textAlign: 'center', borderBottom: '4px solid #1976d2' }}>
          <CardContent>
            <MaleIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dados.stats.machos}</Typography>
            <Typography variant="body2" color="text.secondary">Reprodutores</Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ textAlign: 'center', borderBottom: '4px solid #d81b60' }}>
          <CardContent>
            <FemaleIcon sx={{ fontSize: 40, color: '#d81b60' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dados.stats.femeas}</Typography>
            <Typography variant="body2" color="text.secondary">Reprodutoras</Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ textAlign: 'center', borderBottom: '4px solid #ef6c00' }}>
          <CardContent>
            <ChildCareIcon sx={{ fontSize: 40, color: '#ef6c00' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dados.stats.filhotes}</Typography>
            <Typography variant="body2" color="text.secondary">Filhotes</Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ textAlign: 'center', borderBottom: '4px solid #2e7d32' }}>
          <CardContent>
            <BookOnlineIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dados.stats.reservas}</Typography>
            <Typography variant="body2" color="text.secondary">Reservas de Ovos</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* MÓDULOS DE GESTÃO */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, opacity: dados.permissoes.financeiro ? 1 : 0.7, position: 'relative' }}>
          {!dados.permissoes.financeiro && <LockIcon sx={{ position: 'absolute', top: 15, right: 15, color: '#999' }} />}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <AccountBalanceWalletIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Módulo Financeiro</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Controle de caixa, contas a pagar/receber e balanço por categoria.
          </Typography>
          <Button variant="contained" fullWidth disabled={!dados.permissoes.financeiro}>
            Acessar Financeiro
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, opacity: dados.permissoes.saude ? 1 : 0.7, position: 'relative' }}>
          {!dados.permissoes.saude && <LockIcon sx={{ position: 'absolute', top: 15, right: 15, color: '#999' }} />}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <MedicationIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Saúde e Remédios</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Agenda de aplicações, controle de custos de medicamentos e histórico.
          </Typography>
          <Button variant="contained" fullWidth disabled={!dados.permissoes.saude}>
            Ver Agenda de Saúde
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}