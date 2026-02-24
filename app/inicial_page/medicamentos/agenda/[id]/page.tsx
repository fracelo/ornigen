"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Box, Container, Typography, Button, Paper, Divider, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function AplicarDosePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dose, setDose] = useState<any>(null);

  useEffect(() => {
    async function carregarDose() {
      const { data } = await supabase
        .from("agenda_saude")
        .select("*, passaros(nome, anilha), medicamentos(nome, id)")
        .eq("id", id)
        .single();
      setDose(data);
      setLoading(false);
    }
    carregarDose();
  }, [id]);

  const confirmar = async () => {
    setLoading(true);
    // 1. Marca como aplicado
    await supabase.from("agenda_saude").update({ 
      status: 'Aplicado', 
      data_aplicacao: new Date().toISOString().split('T')[0] 
    }).eq("id", id);

    // 2. Baixa estoque (RPC que criamos)
    await supabase.rpc('decrement_estoque', { med_id: dose.medicamento_id, qtd: 1 });

    router.push("/inicial_page/medicamentos/agenda");
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>Voltar</Button>
      <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '2px solid #2e7d32' }}>
        <Typography variant="overline" color="success.main" fontWeight="bold">APLICAÇÃO DE DOSE</Typography>
        <Typography variant="h4" fontWeight="900" sx={{ mb: 1 }}>{dose?.passaros?.nome}</Typography>
        <Typography variant="body1" color="textSecondary" mb={3}>Anilha: {dose?.passaros?.anilha}</Typography>
        
        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" color="textPrimary">{dose?.medicamentos?.nome}</Typography>
        <Typography variant="h5" fontWeight="bold" color="primary">{dose?.periodo}</Typography>
        
        <Box sx={{ my: 4 }}>
          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            startIcon={<CheckCircleIcon />}
            onClick={confirmar}
            sx={{ py: 2, borderRadius: 3, fontSize: '1.2rem', bgcolor: '#2e7d32' }}
          >
            CONFIRMAR APLICAÇÃO
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}