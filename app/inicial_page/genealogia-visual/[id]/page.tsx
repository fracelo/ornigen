"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, Autocomplete, 
  TextField, Button, CircularProgress, Divider, Avatar, Alert,
  IconButton, Stack 
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function GenealogiaVisualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: passaroId } = use(params);
  const { empresaId } = useEmpresa();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alvo, setAlvo] = useState<any>(null);
  
  const [machos, setMachos] = useState<any[]>([]);
  const [femeas, setFemeas] = useState<any[]>([]);

  const [arvore, setArvore] = useState<any>({
    pai: null,
    mae: null,
    avoPaterno: null,
    avaPaterna: null,
    avoMaterno: null,
    avaMaterna: null
  });

  const carregarAncestrais = async (id: number, parentesco: 'pai' | 'mae') => {
    const { data } = await supabase
      .from("passaros")
      .select(`id, nome, anilha, 
               pai:pai_id(id, nome, anilha), 
               mae:mae_id(id, nome, anilha)`)
      .eq("id", id)
      .single();

    if (parentesco === 'pai') {
      setArvore((prev: any) => ({ ...prev, pai: data, avoPaterno: data?.pai, avaPaterna: data?.mae }));
    } else {
      setArvore((prev: any) => ({ ...prev, mae: data, avoMaterno: data?.pai, avaMaterna: data?.mae }));
    }
  };

  const inicializar = useCallback(async () => {
    if (!passaroId || !empresaId) return;
    setLoading(true);

    try {
      const { data: p } = await supabase
        .from("passaros")
        .select(`*, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha)`)
        .eq("id", passaroId)
        .single();
      
      setAlvo(p);

      const { data: todos } = await supabase
        .from("passaros")
        .select("id, nome, anilha, sexo")
        .eq("empresa_id", empresaId)
        .eq("especie_id", p.especie_id)
        .neq("id", passaroId);

      setMachos(todos?.filter((x: any) => x.sexo === 'M') || []);
      setFemeas(todos?.filter((x: any) => x.sexo === 'F') || []);

      if (p.pai_id) await carregarAncestrais(p.pai_id, 'pai');
      if (p.mae_id) await carregarAncestrais(p.mae_id, 'mae');

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [passaroId, empresaId]);

  useEffect(() => { inicializar(); }, [inicializar]);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await supabase
        .from("passaros")
        .update({ 
          pai_id: arvore.pai?.id || null, 
          mae_id: arvore.mae?.id || null 
        })
        .eq("id", passaroId);
      
      router.refresh();
      router.back();
    } catch (err) {
      alert("Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4, bgcolor: '#f8faff', borderRadius: 2, borderLeft: '6px solid #0D47A1' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', border: '1px solid #ddd' }}>
                <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="900" color="#0D47A1">MAPA GENEALÓGICO</Typography>
              <Typography variant="body2" color="textSecondary">Linhagem de <strong>{alvo?.nome}</strong></Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
            onClick={handleSalvar}
            disabled={salvando}
            sx={{ px: 4, borderRadius: 2, fontWeight: 'bold' }}
          >
            {salvando ? "Salvar Linhagem" : "Finalizar Árvore"}
          </Button>
        </Box>
      </Paper>

      {/* ÁRVORE USANDO BOX FLEX (TOTALMENTE SEGURO CONTRA ERROS DE IMPORTAÇÃO) */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 6, 
        alignItems: 'center' 
      }}>
        
        {/* COLUNA AVÓS */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant="overline" sx={{ fontWeight: '900', color: '#1565C0', mb: 2, display: 'block' }}>Ancestrais (Avós)</Typography>
          <BoxSeletor titulo="Avô Paterno" value={arvore.avoPaterno} disabled />
          <BoxSeletor titulo="Avó Paterna" value={arvore.avaPaterna} disabled />
          <Divider sx={{ my: 4, borderBottomWidth: 2 }} />
          <BoxSeletor titulo="Avô Materno" value={arvore.avoMaterno} disabled />
          <BoxSeletor titulo="Avó Materna" value={arvore.avaMaterna} disabled />
        </Box>

        {/* COLUNA PAIS */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant="overline" sx={{ fontWeight: '900', color: '#1565C0', mb: 2, display: 'block' }}>Pais Diretos</Typography>
          <BoxSeletor 
            titulo="PAI" 
            opcoes={machos} 
            value={arvore.pai} 
            destaque="#E3F2FD"
            onChange={(val: any) => val ? carregarAncestrais(val.id, 'pai') : setArvore((prev: any) => ({...prev, pai: null, avoPaterno: null, avaPaterna: null}))} 
          />
          <Box sx={{ height: 80, display: 'flex', justifyContent: 'center' }}>
             <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, borderStyle: 'dashed' }} />
          </Box>
          <BoxSeletor 
            titulo="MÃE" 
            opcoes={femeas} 
            value={arvore.mae} 
            destaque="#FCE4EC"
            onChange={(val: any) => val ? carregarAncestrais(val.id, 'mae') : setArvore((prev: any) => ({...prev, mae: null, avoMaterno: null, avaMaterna: null}))} 
          />
        </Box>

        {/* COLUNA ALVO */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Paper sx={{ p: 4, textAlign: 'center', border: '3px solid #0D47A1', borderRadius: 4, bgcolor: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Avatar src={alvo?.foto_url} sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '4px solid #E3F2FD' }}>🐦</Avatar>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#999' }}>FILHO / ALVO</Typography>
            <Typography variant="h4" fontWeight="900" color="#0D47A1">{alvo?.nome}</Typography>
            <Typography variant="h6" color="textSecondary">{alvo?.anilha}</Typography>
            <Alert severity="info" variant="outlined" sx={{ mt: 3, border: '1px dashed #0D47A1' }}>
              Selecione o pai ou a mãe para carregar a genealogia em cascata.
            </Alert>
          </Paper>
        </Box>

      </Box>
    </Container>
  );
}

function BoxSeletor({ titulo, opcoes = [], value, onChange, destaque = "white", disabled = false }: any) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="caption" sx={{ fontWeight: '900', color: disabled ? '#aaa' : '#333', ml: 1, textTransform: 'uppercase' }}>
        {titulo}
      </Typography>
      <Autocomplete
        disabled={disabled}
        options={opcoes}
        getOptionLabel={(opt: any) => `${opt.nome} - ${opt.anilha}`}
        value={value || null}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, val) => onChange && onChange(val)}
        renderInput={(params) => (
          <TextField 
            {...params} 
            size="small" 
            placeholder={disabled ? "Definido pelo pai/mãe" : "Selecionar..."}
            sx={{ 
              bgcolor: destaque, 
              '& .MuiOutlinedInput-root': { borderRadius: 3 }
            }} 
          />
        )}
      />
    </Box>
  );
}