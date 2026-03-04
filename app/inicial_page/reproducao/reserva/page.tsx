"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { formataDados } from "@/lib/formataDados"; // Importando a função corrigida
import {
  Box, Typography, Button, TextField, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function ListaReservas() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [busca, setBusca] = useState("");
  const [reservas, setReservas] = useState<any[]>([]);

  const carregarReservas = async () => {
    if (!empresaId) return;
    const { data } = await supabase
      .from("reserva_filhotes")
      .select(`
        *,
        criadouros(razao_social),
        pai:pai_id(nome, anilha),
        mae:mae_id(nome, anilha)
      `)
      .eq("empresa_id", empresaId)
      .order("data_reserva", { ascending: false });
    
    setReservas(data || []);
  };

  useEffect(() => { carregarReservas(); }, [empresaId]);

  const filtrar = reservas.filter(r => 
    r.criadouros?.razao_social?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
      {/* Cabeçalho 1200px */}
      <Box sx={{ width: "1200px", display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="900" color="#1e293b">Reserva de Filhotes</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => router.push("/inicial_page/reproducao/reserva/novo")}
          sx={{ bgcolor: "#1e293b", fontWeight: 'bold', px: 4, borderRadius: 2 }}
        >
          Nova Reserva
        </Button>
      </Box>

      {/* Busca */}
      <Box sx={{ width: "1200px", mb: 2 }}>
        <TextField
          placeholder="Buscar por cliente..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ width: 400, bgcolor: '#fff' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper} variant="outlined" sx={{ width: "1200px", borderRadius: 3, borderColor: "#e2e8f0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell><b>Data</b></TableCell>
              <TableCell><b>Cliente (Criadouro)</b></TableCell>
              <TableCell><b>Pai</b></TableCell>
              <TableCell><b>Mãe</b></TableCell>
              <TableCell align="center"><b>Formado?</b></TableCell>
              <TableCell align="right"><b>Valor Total</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrar.map((r) => (
              <TableRow 
                key={r.id} 
                hover 
                onClick={() => router.push(`/inicial_page/reproducao/reserva/${r.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{new Date(r.data_reserva).toLocaleDateString()}</TableCell>
                <TableCell>{r.criadouros?.razao_social || "N/I"}</TableCell>
                <TableCell>{r.pai?.nome ? `${r.pai.nome} (${r.pai.anilha})` : "---"}</TableCell>
                <TableCell>{r.mae?.nome ? `${r.mae.nome} (${r.mae.anilha})` : "---"}</TableCell>
                <TableCell align="center">{r.formado ? "✅ Sim" : "❌ Não"}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                   {/* 💰 Chamada da função corrigida: Aceita o number diretamente */}
                   {formataDados(Math.round(r.valor_total * 100), "moeda")}
                </TableCell>
              </TableRow>
            ))}
            {filtrar.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#64748b' }}>
                  Nenhuma reserva encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}