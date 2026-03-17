"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Box, Paper, Typography, Stack, Divider, Button, 
  TextField, MenuItem, Grid, Autocomplete, CircularProgress 
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import dynamic from 'next/dynamic';

// 🔹 Importação dos Componentes de Relatório da pasta app/components
import { RelatorioSaldosPDF } from "@/components/RelatorioSaldosPDF";
import { RelatorioMovimentoPDF } from "@/components/RelatorioMovimentoPDF";

// Importação dinâmica para evitar erros de SSR e Tipagem
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer), 
  { ssr: false }
) as any;

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), 
  { ssr: false }
) as any;

const RELATORIOS = [
  { id: 'saldo', title: 'Saldo', icon: '/icons/rel_saldos.png' },
  { id: 'movimento', title: 'Movimento', icon: '/icons/rel_movimento.png' },
  { id: 'alerta', title: 'Alertas', icon: '/icons/rel_alerta.png' },
  { id: 'abc', title: 'Curva ABC', icon: '/icons/rel_abc.png' },
  { id: 'custos', title: 'Custos', icon: '/icons/rel_custos.png' },
];

export default function CentralRelatorios() {
  const { empresaId, nomeEmpresa } = useEmpresa();
  const [relatorioAtivo, setRelatorioAtivo] = useState('saldo');
  const [loading, setLoading] = useState(true);
  const [gerar, setGerar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [listAlimentos, setListAlimentos] = useState<any[]>([]);
  const [dadosParaPDF, setDadosParaPDF] = useState<any[]>([]);

  const [filtros, setFiltros] = useState({
    alimentos: [] as any[],
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => { setIsMounted(true); }, []);

  const carregarFiltros = useCallback(async () => {
    if (!empresaId) return;
    try {
      const { data } = await supabase.from("alimentos").select("id, nome, marca").eq("empresa_id", empresaId).order("nome");
      setListAlimentos(data || []);
    } finally { setLoading(false); }
  }, [empresaId]);

  useEffect(() => { carregarFiltros(); }, [carregarFiltros]);

  const handleGerarRelatorio = async () => {
    if (!empresaId) return;
    setGerar(false);
    
    // 🔹 LÓGICA PARA SALDO
    if (relatorioAtivo === 'saldo') {
      let query = supabase.from("alimentos").select("*").eq("empresa_id", empresaId).order("nome");
      if (filtros.alimentos.length > 0) {
        query = query.in("id", filtros.alimentos.map(a => a.id));
      }
      const { data } = await query;
      setDadosParaPDF(data || []);
    } 
    // 🔹 LÓGICA PARA MOVIMENTAÇÃO
    else if (relatorioAtivo === 'movimento') {
      if (!filtros.dataInicio || !filtros.dataFim) return alert("Selecione o período!");
      
      let query = supabase.from("alimentos_estoque_mov")
        .select("*, alimentos(nome, marca)")
        .eq("empresa_id", empresaId)
        .gte("created_at", `${filtros.dataInicio}T00:00:00`)
        .lte("created_at", `${filtros.dataFim}T23:59:59`)
        .order("created_at", { ascending: false });

      if (filtros.alimentos.length > 0) {
        query = query.in("alimento_id", filtros.alimentos.map(a => a.id));
      }
      const { data } = await query;
      setDadosParaPDF(data || []);
    }

    setGerar(true);
  };

  // 🔹 Função para renderizar o componente correto no PDF
  const renderizarRelatorio = () => {
    if (relatorioAtivo === 'saldo') {
      return <RelatorioSaldosPDF dados={dadosParaPDF} empresa={nomeEmpresa ?? ""} filtros={filtros}/>;
    }
    if (relatorioAtivo === 'movimento') {
      return <RelatorioMovimentoPDF dados={dadosParaPDF} empresa={nomeEmpresa ?? ""} filtros={filtros}/>;
    }
    return null; // Adicionar os outros conforme criarmos
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 120px)', gap: 3, p: 1 }}>
      {/* MENU LATERAL */}
      <Paper variant="outlined" sx={{ width: 140, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1", display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 3, bgcolor: '#1e293b' }}>
        {RELATORIOS.map((rel) => (
          <Box key={rel.id} onClick={() => { setRelatorioAtivo(rel.id); setGerar(false); }} sx={{ width: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', p: 1.5, borderRadius: 3, bgcolor: relatorioAtivo === rel.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: relatorioAtivo === rel.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}>
            <Box component="img" src={rel.icon} sx={{ width: 54, height: 54, mb: 1 }} />
            <Typography variant="caption" fontWeight="900" sx={{ color: '#fff', fontSize: '0.65rem' }}>{rel.title.toUpperCase()}</Typography>
          </Box>
        ))}
      </Paper>

      {/* ÁREA DE CONTEÚDO */}
      <Paper variant="outlined" sx={{ flexGrow: 1, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1", p: 4, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
        <Typography variant="h4" fontWeight="900" color="#1e293b" mb={3}>Relatório: {RELATORIOS.find(r => r.id === relatorioAtivo)?.title}</Typography>

        <Stack spacing={3} sx={{ mb: 4, maxWidth: '900px' }}>
          {['movimento', 'abc', 'custos'].includes(relatorioAtivo) && (
            <Stack direction="row" spacing={2}>
              <TextField label="Data Inicial" type="date" fullWidth InputLabelProps={{ shrink: true }} value={filtros.dataInicio} onChange={(e)=>setFiltros({...filtros, dataInicio: e.target.value})} />
              <TextField label="Data Final" type="date" fullWidth InputLabelProps={{ shrink: true }} value={filtros.dataFim} onChange={(e)=>setFiltros({...filtros, dataFim: e.target.value})} />
            </Stack>
          )}

          <Autocomplete
            multiple={relatorioAtivo !== 'movimento'}
            options={listAlimentos}
            getOptionLabel={(o) => `${o.nome} ${o.marca || ""}`}
            onChange={(_, v) => setFiltros({...filtros, alimentos: Array.isArray(v) ? v : (v ? [v] : [])})}
            renderInput={(p) => <TextField {...p} label="Produto(s)" size="small" />}
          />

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={handleGerarRelatorio} sx={{ bgcolor: "#1e293b", px: 4, fontWeight: '900', height: 50 }}>
              GERAR RELATÓRIO
            </Button>
            
            {gerar && isMounted && (
              <PDFDownloadLink 
                document={renderizarRelatorio()} 
                fileName={`relatorio_${relatorioAtivo}.pdf`}
              >
                {({ loading: loadingPdf }: any) => (
                  <Button variant="outlined" color="success" sx={{ fontWeight: 'bold', height: 50 }} disabled={loadingPdf}>
                    {loadingPdf ? 'PREPARANDO...' : 'BAIXAR PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* 🔹 ÁREA DO PDF (DINÂMICA) */}
        <Box sx={{ flexGrow: 1, bgcolor: '#525659', borderRadius: 3, p: 2, display: 'flex', justifyContent: 'center', overflow: 'auto', minHeight: '600px' }}>
          {gerar && isMounted ? (
            <PDFViewer width="100%" height="100%" style={{ border: 'none', maxWidth: '850px', borderRadius: '8px', minHeight: '800px' }}>
              {renderizarRelatorio()}
            </PDFViewer>
          ) : (
            <Typography color="#fff" sx={{ mt: 10 }}>Configure os filtros e clique em Gerar para visualizar o documento A4.</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}