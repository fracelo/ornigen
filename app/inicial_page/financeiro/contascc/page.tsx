"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Ícone de Banco
import PaymentsIcon from '@mui/icons-material/Payments'; // Ícone de Caixa

export default function ListaContasCorrente() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarContas = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("contascorrente")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome_conta", { ascending: true });

    if (!error && data) {
      setContas(data);
    }
    setLoading(false);
  }, [empresaId]);

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#1e293b">
              Contas Correntes e Caixas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gerencie suas contas bancárias e controles de caixa interno
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/financeiro/contascc/novo")}
            sx={{ bgcolor: "#1e293b", "&:hover": { bgcolor: "#334155" }, fontWeight: "bold" }}
          >
            Nova Conta
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome da Conta</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Banco</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Agência</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contas.map((item) => (
                <TableRow 
                  key={item.id} 
                  hover 
                  sx={{ cursor: 'pointer' }} 
                  onClick={() => router.push(`/inicial_page/financeiro/contascc/${item.id}`)}
                >
                  <TableCell>
                    <Typography fontWeight="600">{item.nome_conta}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      icon={item.tipo === 'B' ? <AccountBalanceIcon fontSize="small" /> : <PaymentsIcon fontSize="small" />}
                      label={item.tipo === 'B' ? 'Banco' : 'Caixa'} 
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontWeight: 'bold',
                        color: item.tipo === 'B' ? '#0284c7' : '#059669',
                        borderColor: item.tipo === 'B' ? '#0284c7' : '#059669'
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.tipo === 'B' ? item.banco : "—"}</TableCell>
                  <TableCell>{item.tipo === 'B' ? item.agencia : "—"}</TableCell>
                  <TableCell>{item.tipo === 'B' ? item.conta_numero : "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">Nenhuma conta cadastrada.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}