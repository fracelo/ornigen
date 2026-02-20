"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, Typography, Paper, Chip, Checkbox, IconButton, CircularProgress, Portal, TableContainer
} from "@mui/material";
import { useEmpresa } from "@/context/empresaContext";
import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";

// 🔹 Certifique-se de que o caminho do seu componente CrachaPassaro está correto
import CrachaPassaro from "@/components/CrachaPassaro";

function ListaPassarosContent() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [dadosParaImprimir, setDadosParaImprimir] = useState<any[][]>([]);
  const [preparando, setPreparando] = useState(false);

  const router = useRouter();
  const { empresaId } = useEmpresa();

  useEffect(() => {
    if (empresaId) carregarRegistros();
  }, [empresaId]);

  const carregarRegistros = async () => {
    setLoading(true);
    try {
      const { data: passaros } = await supabase
        .from("passaros")
        .select(`id, nome, anilha, sexo, especie_id, pai_id, mae_id, especies_sispass:especie_id (nomes_comuns)`)
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      const { data: todos } = await supabase.from("passaros").select("id, nome").eq("empresa_id", empresaId);
      const mapaNomes: Record<number, string> = {};
      todos?.forEach((p) => { mapaNomes[p.id] = p.nome; });

      setRegistros(passaros?.map((p: any) => ({
        ...p,
        especie_nome: p.especies_sispass?.nomes_comuns?.[0] || "Não informada",
        pai_nome: p.pai_id ? mapaNomes[p.pai_id] : null,
        mae_nome: p.mae_id ? mapaNomes[p.mae_id] : null,
      })) || []);
    } catch (err) {
      console.error("Erro ao carregar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  const prepararImpressao = async () => {
    if (selecionados.length === 0) return;
    setPreparando(true);
    
    try {
      const { data, error } = await supabase
        .from("passaros")
        .select(`*, especies_sispass:especie_id(nomes_comuns), criadouros:origem_id(nome_fantasia, razao_social)`)
        .in("id", selecionados);

      if (error) throw error;

      const formatados = data.map(p => ({
        ...p,
        especie_nome: p.especies_sispass?.nomes_comuns?.[0] || "Não informada",
        origem_nome: p.criadouros?.nome_fantasia || p.criadouros?.razao_social || "Própria"
      }));

      const paginas = [];
      for (let i = 0; i < formatados.length; i += 8) {
        paginas.push(formatados.slice(i, i + 8));
      }

      setDadosParaImprimir(paginas);
      setMostrarModal(true);
      
      // Dá tempo para o navegador processar os crachás invisíveis
      setTimeout(() => {
        setPreparando(false);
      }, 2000);

    } catch (err) {
      console.error(err);
      setPreparando(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 4, color: "#0D47A1", fontWeight: "800" }}>
        Plantel de Pássaros
      </Typography>

      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2 }}>
        <TextField 
          size="small" 
          placeholder="Buscar..." 
          value={busca} 
          onChange={(e) => setBusca(e.target.value)} 
          sx={{ flexGrow: 1 }} 
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/inicial_page/passaros/novo")}>
          Novo Pássaro
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          disabled={selecionados.length === 0 || preparando}
          onClick={prepararImpressao}
          startIcon={preparando ? <CircularProgress size={20} /> : <BadgeIcon />}
        >
          Gerar Crachás ({selecionados.length})
        </Button>
      </Paper>

      <TableContainerComponent 
        loading={loading} 
        registros={registros.filter(r => r.nome?.toLowerCase().includes(busca.toLowerCase()))} 
        selecionados={selecionados} 
        setSelecionados={setSelecionados} 
        router={router}
      />

      {mostrarModal && (
        <Portal>
          <Box id="modal-print-root" sx={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            bgcolor: '#525659', zIndex: 99999, overflowY: 'auto',
            "@media print": { position: 'static', bgcolor: 'white', overflow: 'visible' }
          }}>
            
            {preparando && (
              <Box sx={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: 'white', p: 4, borderRadius: 2, textAlign: 'center', boxShadow: 24, zIndex: 100,
                "@media print": { display: 'none' }
              }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6">Renderizando Crachás...</Typography>
                <Typography variant="body2">Aguarde a geração das páginas do PDF.</Typography>
              </Box>
            )}

            <Box sx={{ 
              display: preparando ? 'none' : 'flex', 
              justifyContent: 'center', 
              gap: 2, 
              p: 2, 
              position: 'sticky', 
              top: 0, 
              bgcolor: '#323639', 
              zIndex: 10,
              "@media print": { display: 'none' } 
            }}>
              <Button variant="contained" color="success" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ fontWeight: 'bold' }}>
                IMPRIMIR TUDO
              </Button>
              <Button variant="contained" color="error" onClick={() => setMostrarModal(false)}>
                FECHAR
              </Button>
            </Box>

            <div className="print-area" style={{ visibility: preparando ? 'hidden' : 'visible' }}>
                {dadosParaImprimir.map((pagina, idx) => (
                <div key={idx} className="page-break-container">
                    <Box sx={{
                        width: '210mm', height: '290mm', bgcolor: 'white', margin: '40px auto',
                        padding: '15mm 5mm', display: 'grid', gridTemplateColumns: '100mm 100mm',
                        gridAutoRows: '60mm', gap: '8mm 2mm', justifyContent: 'center',
                        boxSizing: 'border-box', boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                        "@media print": { margin: 0, boxShadow: 'none', display: 'grid !important' }
                    }}>
                        {pagina.map((p: any) => (
                        <Box key={p.id} sx={{
                            width: '100mm', height: '60mm', border: '1px dashed #ccc',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            "@media print": { border: '0.1mm solid #eee' }
                        }}>
                            <Box sx={{ transform: 'scale(0.95)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <CrachaPassaro form={p} />
                            </Box>
                        </Box>
                        ))}
                    </Box>
                </div>
                ))}
            </div>

            <style jsx global>{`
              @media print {
                body > *:not(#modal-print-root) { display: none !important; }
                #modal-print-root { width: 100% !important; }
                .page-break-container { 
                  display: block !important; 
                  page-break-after: always !important; 
                  break-after: always !important;
                  contain: none !important;
                }
                html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
                @page { size: A4 portrait; margin: 0 !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            `}</style>
          </Box>
        </Portal>
      )}
    </Box>
  );
}

function TableContainerComponent({ loading, registros, selecionados, setSelecionados, router }: any) {
  const handleSelect = (id: number) => setSelecionados((prev: any) => prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id]);
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead sx={{ bgcolor: "#f1f3f4" }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox 
                checked={registros.length > 0 && selecionados.length === registros.length} 
                onChange={(e) => setSelecionados(e.target.checked ? registros.map((r: any) => r.id) : [])} 
              />
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Identificação</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Anilha</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Genealogia</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Sexo</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
          ) : registros.map((r: any) => (
            <TableRow key={r.id} hover>
              <TableCell padding="checkbox">
                <Checkbox checked={selecionados.includes(r.id)} onChange={() => handleSelect(r.id)} />
              </TableCell>
              <TableCell>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{r.nome}</Typography>
                <Typography variant="caption" color="textSecondary">{r.especie_nome}</Typography>
              </TableCell>
              <TableCell><Chip label={r.anilha} size="small" variant="outlined" /></TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: "#1976d2", display: 'block', fontWeight: 'bold' }}>♂ {r.pai_nome || "-"}</Typography>
                <Typography variant="caption" sx={{ color: "#d81b60", display: 'block', fontWeight: 'bold' }}>♀ {r.mae_nome || "-"}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={r.sexo === 'M' ? 'Macho' : 'Fêmea'} size="small" color={r.sexo === 'M' ? 'primary' : 'secondary'} />
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => router.push(`/inicial_page/passaros/${r.id}`)} color="primary"><EditIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ListaPassarosPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ListaPassarosContent />
    </Suspense>
  );
}