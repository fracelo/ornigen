"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { Box, Container, Typography, Button, Paper, IconButton, Stack, Divider } from "@mui/material";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InventoryIcon from "@mui/icons-material/Inventory";

export default function ListaCadastrosMedicamentos() {
  const { empresaId } = useEmpresa();
  const router = useRouter();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);

  useEffect(() => {
    if (empresaId) carregarMedicamentos();
  }, [empresaId]);

  async function carregarMedicamentos() {
    const { data } = await supabase
      .from("medicamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");
    setMedicamentos(data || []);
  }

  return (
    <Container maxWidth="md" sx={{ py: 3, px: 2 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => router.push("/inicial_page/medicamentos")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="900">CADASTROS</Typography>
        </Stack>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => router.push("/inicial_page/medicamentos/cadastros/novo")}
          sx={{ borderRadius: 2 }}
        >
          ADICIONAR
        </Button>
      </Box>

      {/* LISTA EM BOXES */}
      <Stack spacing={1.5}>
        {medicamentos.length === 0 && (
          <Typography variant="body2" color="textSecondary" textAlign="center">Nenhum medicamento cadastrado.</Typography>
        )}
        {medicamentos.map((med) => (
          <Paper 
            key={med.id} 
            elevation={0}
            sx={{ 
              p: 2, 
              borderRadius: 3, 
              border: '1px solid #e0e0e0',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: med.estoque_atual <= med.estoque_minimo ? '#fff5f5' : '#fff'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: '#f0f4f8', p: 1, borderRadius: 2 }}>
                <InventoryIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{med.nome}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {med.tipo} • Stock: <b>{med.estoque_atual} {med.unidade_medida}</b>
                </Typography>
              </Box>
            </Box>
            
            <IconButton color="primary" onClick={() => router.push(`/inicial_page/medicamentos/cadastros/${med.id}`)}>
              <EditIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}