"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, Autocomplete, 
  TextField, Button, CircularProgress, Avatar, Stack, Divider, Chip, IconButton 
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ClearIcon from "@mui/icons-material/Clear";

export default function GenealogiaVisualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: passaroId } = use(params);
  const { empresaId } = useEmpresa();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alvo, setAlvo] = useState<any>(null);
  const [machos, setMachos] = useState<any[]>([]);
  const [femeas, setFemeas] = useState<any[]>([]);
  
  // IDs que vieram originalmente do banco (para travar de verdade)
  const [idsOriginais, setIdsOriginais] = useState<number[]>([]);

  const [arvore, setArvore] = useState<any>({ 
    pai: null, mae: null, 
    g2: {}, g3: {}, g4: {} 
  });

  const buscarLinhagemCompleta = async (id: number) => {
    const { data } = await (supabase
      .from("passaros")
      .select(`
        id, nome, anilha, 
        pai:pai_id(id, nome, anilha, 
          pai:pai_id(id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha)), 
          mae:mae_id(id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha))
        ), 
        mae:mae_id(id, nome, anilha, 
          pai:pai_id(id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha)), 
          mae:mae_id(id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha))
        )
      `)
      .eq("id", id).single() as any);
    return data;
  };

  const atualizarNoEstado = async (id: number | null, nivel: string, chave: string) => {
    if (!id) {
        // Lógica para limpar o ramo se o usuário remover a seleção
        setArvore((prev: any) => {
            const nova = { ...prev };
            if (nivel === 'g1') nova[chave] = null;
            else if (nivel === 'g2') nova.g2[chave] = null;
            else if (nivel === 'g3') nova.g3[chave] = null;
            return { ...nova };
        });
        return;
    }

    const d = await buscarLinhagemCompleta(id);
    if (!d) return;

    setArvore((prev: any) => {
      const nova = { ...prev };
      if (nivel === 'g1') {
        nova[chave] = d;
        nova.g2[`${chave}_p`] = d.pai; nova.g2[`${chave}_m`] = d.mae;
      } else if (nivel === 'g2') {
        nova.g2[chave] = d;
        const [lado, tipo] = chave.split('_');
        nova.g3[`${lado}_${tipo}p`] = d.pai; nova.g3[`${lado}_${tipo}m`] = d.mae;
      } else if (nivel === 'g3') {
        nova.g3[chave] = d;
      }
      return { ...nova };
    });
  };

  const inicializar = useCallback(async () => {
    if (!passaroId || !empresaId) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from("passaros").select(`*`).eq("id", passaroId).single();
      setAlvo(p);

      const { data: todos } = await supabase.from("passaros")
        .select("id, nome, anilha, sexo")
        .eq("empresa_id", empresaId)
        .eq("especie_id", p.especie_id);

      setMachos(todos?.filter((x: any) => x.sexo === 'M') || []);
      setFemeas(todos?.filter((x: any) => x.sexo === 'F') || []);

      // Mapeia o que já existe no banco para travar
      const originais = [p.pai_id, p.mae_id].filter(Boolean);
      setIdsOriginais(originais);

      if (p.pai_id) await atualizarNoEstado(p.pai_id, 'g1', 'pai');
      if (p.mae_id) await atualizarNoEstado(p.mae_id, 'g1', 'mae');

    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [passaroId, empresaId]);

  useEffect(() => { inicializar(); }, [inicializar]);

  const handleGravarLinhagem = async () => {
    setSalvando(true);
    try {
      await supabase.from("passaros")
        .update({ pai_id: arvore.pai?.id || null, mae_id: arvore.mae?.id || null })
        .eq("id", passaroId);
      alert("IA OrniGen: Genealogia corrigida e salva!");
      router.back();
    } catch (err) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth={false} sx={{ py: 2, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <style>{`
        .tree-box { display: flex; align-items: center; gap: 60px; padding: 20px 0; }
        .column { display: flex; flex-direction: column; justify-content: space-around; height: 550px; position: relative; }
        .connector { position: absolute; right: -60px; top: 0; bottom: 0; width: 60px; display: flex; align-items: center; }
        .line-h { width: 100%; height: 2px; background: #cbd5e1; }
        .bracket { position: absolute; right: 0; top: 25%; bottom: 25%; width: 2px; background: #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; }
        .bracket::before, .bracket::after { content: ""; width: 15px; height: 2px; background: #cbd5e1; align-self: flex-end; }
      `}</style>

      {/* HEADER */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3, borderBottom: '4px solid #0D47A1' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={alvo?.foto_url} sx={{ width: 50, height: 50, border: '2px solid #0D47A1' }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">{alvo?.nome}</Typography>
            <Typography variant="caption" color="primary">IA OrniGen • Modo Edição Flexível</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} onClick={handleGravarLinhagem} disabled={salvando}>
          Gravar Linhagem
        </Button>
      </Paper>

      <Stack spacing={6}>
        {/* ALA PATERNA */}
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Chip label="LINHAGEM DO PAI" color="primary" sx={{ mb: 2, fontWeight: 'bold' }} />
          <Box className="tree-box">
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="PAI (G1)" value={arvore.pai} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g1', 'pai')} destaque="#E3F2FD" original={idsOriginais.includes(arvore.pai?.id)} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="AVÔ P." value={arvore.g2.pai_p} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g2', 'pai_p')} />
                <BoxSeletor placeholder="AVÓ P." value={arvore.g2.pai_m} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g2', 'pai_m')} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="BIS PP" value={arvore.g3.pai_pp} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'pai_pp')} />
                <BoxSeletor placeholder="BIS PM" value={arvore.g3.pai_pm} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'pai_pm')} />
                <BoxSeletor placeholder="BIS MP" value={arvore.g3.pai_mp} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'pai_mp')} />
                <BoxSeletor placeholder="BIS MM" value={arvore.g3.pai_mm} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'pai_mm')} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 180 }}>
                {[...Array(8)].map((_, i) => <BoxSeletor key={i} placeholder="TAT." small />)}
             </Box>
          </Box>
        </Box>

        {/* ALA MATERNA */}
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Chip label="LINHAGEM DA MÃE" color="secondary" sx={{ mb: 2, fontWeight: 'bold' }} />
          <Box className="tree-box">
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="MÃE (G1)" value={arvore.mae} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g1', 'mae')} destaque="#FCE4EC" original={idsOriginais.includes(arvore.mae?.id)} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="AVÔ M." value={arvore.g2.mae_p} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g2', 'mae_p')} />
                <BoxSeletor placeholder="AVÓ M." value={arvore.g2.mae_m} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g2', 'mae_m')} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 220 }}>
                <BoxSeletor placeholder="BIS PP" value={arvore.g3.mae_pp} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'mae_pp')} />
                <BoxSeletor placeholder="BIS PM" value={arvore.g3.mae_pm} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'mae_pm')} />
                <BoxSeletor placeholder="BIS MP" value={arvore.g3.mae_mp} opcoes={machos} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'mae_mp')} />
                <BoxSeletor placeholder="BIS MM" value={arvore.g3.mae_mm} opcoes={femeas} onChange={(v:any) => atualizarNoEstado(v?.id || null, 'g3', 'mae_mm')} />
                <Box className="connector"><Box className="line-h" /><Box className="bracket" /></Box>
             </Box>
             <Box className="column" sx={{ width: 180 }}>
                {[...Array(8)].map((_, i) => <BoxSeletor key={i} placeholder="TAT." small />)}
             </Box>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}

function BoxSeletor({ placeholder, value, opcoes, onChange, destaque = "white", original = false }: any) {
  // A IA agora só trava o que já é "passado imutável" (veio do banco originalmente)
  // Se for uma escolha nova da sessão, o onChange permite trocar.
  const isLocked = original; 

  return (
    <Box sx={{ ml: 2, position: 'relative' }}>
      <Autocomplete
        disabled={isLocked}
        options={opcoes || []}
        getOptionLabel={(opt: any) => `${opt.nome || ''} - ${opt.anilha || ''}`}
        value={value || null}
        onChange={(_, v) => onChange && onChange(v)}
        renderInput={(params) => (
          <TextField 
            {...params} 
            size="small" 
            placeholder={value?.nome ? `${value.nome} - ${value.anilha}` : placeholder}
            sx={{ 
              bgcolor: isLocked ? '#f1f5f9' : destaque, 
              borderRadius: 1.5,
              '& .MuiOutlinedInput-root': { 
                height: 36, fontSize: '0.75rem', 
                border: isLocked ? '1px solid #cbd5e1' : '1px solid #3b82f6', 
                '& fieldset': { border: 'none' } 
              },
              '& .MuiInputBase-input::placeholder': { color: isLocked ? '#64748b' : '#1e40af', opacity: 1, fontWeight: 'bold' }
            }} 
          />
        )}
      />
      {/* Botão de Limpeza rápida para o que não está travado */}
      {!isLocked && value?.id && (
          <IconButton 
            size="small" 
            onClick={() => onChange(null)}
            sx={{ position: 'absolute', right: -30, top: 2, color: '#ff4444' }}
          >
              <ClearIcon fontSize="inherit" />
          </IconButton>
      )}
    </Box>
  );
}