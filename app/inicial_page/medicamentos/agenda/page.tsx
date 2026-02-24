"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Button, Paper, TextField, 
  Stack, IconButton, InputAdornment, Dialog, DialogContent, CircularProgress, Chip
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

// Ícones
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import EventIcon from "@mui/icons-material/Event";

export default function ListaOperacionalSaudePage() {
  const { empresaId } = useEmpresa();
  const router = useRouter();
  
  // Estados
  const [busca, setBusca] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doses, setDoses] = useState<any[]>([]);

  // 1. Carregar doses do banco
  useEffect(() => {
    if (empresaId) carregarDoses();
  }, [empresaId]);

  async function carregarDoses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agenda_saude")
        .select(`
          id, 
          status, 
          periodo, 
          data_programada,
          passaros(nome, anilha), 
          medicamentos(nome)
        `)
        .eq("empresa_id", empresaId)
        .order("data_programada", { ascending: true })
        .order("periodo");

      if (error) {
        console.error("Erro na busca:", error.message);
      } else {
        setDoses(data || []);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setLoading(false);
    }
  }

  // 2. Lógica de Cores (Verde = Hoje, Vermelho = Atrasado, Branco = Futuro)
  const getDoseStyle = (dataProgramada: string, status: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (status === 'Aplicado') {
      return { bg: '#f5f5f5', border: '#bdbdbd', label: 'Aplicado', icon: <CheckCircleIcon color="success" /> };
    }
    
    if (dataProgramada === hoje) {
      return { bg: '#e8f5e9', border: '#4caf50', label: 'Hoje', icon: <EventIcon sx={{ color: '#2e7d32' }} /> };
    }
    
    if (dataProgramada < hoje) {
      return { bg: '#ffebee', border: '#ef5350', label: 'Atrasado', icon: <ErrorIcon sx={{ color: '#c62828' }} /> };
    }
    
    return { bg: '#ffffff', border: '#e0e0e0', label: 'Futuro', icon: <EventIcon color="action" /> };
  };

  // 3. Configuração do Scanner com Correção de DOM
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerAberto) {
      // Pequeno atraso para garantir que o Dialog carregou o id="reader"
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (element) {
          scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
          scanner.render(
            (decodedText) => {
              setScannerAberto(false);
              setBusca(decodedText); 
            },
            () => {} 
          );
        }
      }, 350); 

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Erro ao limpar scanner", err));
        }
      };
    }
  }, [scannerAberto]);

  // Filtro de busca
  const dosesFiltradas = doses.filter(d => 
    d.passaros?.anilha?.toLowerCase().includes(busca.toLowerCase()) ||
    d.passaros?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ py: 2, px: 1.5 }}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.push("/inicial_page/medicamentos")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="900" color="primary">MANEJO DIÁRIO</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField 
            fullWidth 
            placeholder="Buscar pássaro ou anilha..." 
            size="small"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setScannerAberto(true)} edge="end" sx={{ color: 'secondary.main' }}>
                    <QrCodeScannerIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <Button 
            variant="contained" 
            onClick={() => router.push("/inicial_page/medicamentos/agenda/agendar")} 
            sx={{ minWidth: 54, borderRadius: 3 }}
          >
            <AddIcon />
          </Button>
        </Box>
      </Box>

      {/* LISTAGEM */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          {dosesFiltradas.length > 0 ? (
            dosesFiltradas.map((dose) => {
              const estilo = getDoseStyle(dose.data_programada, dose.status);
              return (
                <Paper 
                  key={dose.id} 
                  onClick={() => dose.status === 'Pendente' && router.push(`/inicial_page/medicamentos/agenda/${dose.id}`)}
                  sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    backgroundColor: estilo.bg,
                    borderLeft: `8px solid ${estilo.border}`,
                    cursor: dose.status === 'Pendente' ? 'pointer' : 'default',
                    transition: '0.2s',
                    '&:active': { transform: 'scale(0.98)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" fontWeight="bold" color="textSecondary">
                        {new Date(dose.data_programada + "T12:00:00").toLocaleDateString('pt-BR')} - {dose.periodo}
                      </Typography>
                      <Typography variant="h6" fontWeight="900" sx={{ lineHeight: 1.2 }}>
                        {dose.passaros?.nome}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Anilha: {dose.passaros?.anilha} | <strong>{dose.medicamentos?.nome}</strong>
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      {estilo.icon}
                      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                        {estilo.label}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          ) : (
            <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed #ccc', borderRadius: 4 }}>
              <Typography color="textSecondary">Nenhuma dose programada encontrada.</Typography>
            </Box>
          )}
        </Stack>
      )}

      {/* DIALOG DO SCANNER */}
      <Dialog open={scannerAberto} onClose={() => setScannerAberto(false)} fullWidth maxWidth="xs">
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Aponte para o QR Code da Gaiola</Typography>
          {/* A div id="reader" agora é carregada com segurança pelo useEffect corrigido */}
          <Box id="reader" sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}></Box>
          <Button fullWidth variant="outlined" color="error" onClick={() => setScannerAberto(false)} sx={{ mt: 2 }}>
            Fechar Câmera
          </Button>
        </DialogContent>
      </Dialog>

    </Container>
  );
}