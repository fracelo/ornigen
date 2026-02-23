"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, Autocomplete, 
  TextField, Button, CircularProgress, Avatar, Stack, Chip, IconButton 
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";

interface PassaroBase {
  id: number;
  nome: string;
  anilha: string;
  sexo: string;
  data_nascimento: string | null;
}

export default function GenealogiaVisualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: passaroId } = use(params);
  const { empresaId } = useEmpresa();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alvo, setAlvo] = useState<PassaroBase | null>(null);
  const [todosPassaros, setTodosPassaros] = useState<PassaroBase[]>([]);
  const [idsOriginais, setIdsOriginais] = useState<number[]>([]);

  const [arvore, setArvore] = useState<any>({ 
    pai: null, mae: null, 
    g2: {}, g3: {}, g4: {} 
  });

  const buscarNoBanco = async (id: number) => {
    const { data } = await (supabase.from("passaros").select(`
      id, nome, anilha, data_nascimento, sexo,
      pai:pai_id(id, nome, anilha, data_nascimento, sexo, 
        pai:pai_id(id, nome, anilha, data_nascimento, sexo, pai:pai_id(id, nome, anilha, data_nascimento, sexo), mae:mae_id(id, nome, anilha, data_nascimento, sexo)), 
        mae:mae_id(id, nome, anilha, data_nascimento, sexo, pai:pai_id(id, nome, anilha, data_nascimento, sexo), mae:mae_id(id, nome, anilha, data_nascimento, sexo))
      ), 
      mae:mae_id(id, nome, anilha, data_nascimento, sexo, 
        pai:pai_id(id, nome, anilha, data_nascimento, sexo, pai:pai_id(id, nome, anilha, data_nascimento, sexo), mae:mae_id(id, nome, anilha, data_nascimento, sexo)), 
        mae:mae_id(id, nome, anilha, data_nascimento, sexo, pai:pai_id(id, nome, anilha, data_nascimento, sexo), mae:mae_id(id, nome, anilha, data_nascimento, sexo))
      )
    `).eq("id", id).single() as any);
    return data;
  };

  const carregarComCascata = async (id: number | null, nivel: string, chave: string, initial = false) => {
    if (!initial && idsOriginais.includes(arvore[chave]?.id)) return;

    if (!id) {
      setArvore((prev: any) => {
        const n = { ...prev };
        const lado = chave.split('_')[0];
        if (nivel === 'g1') {
          n[chave] = null;
          n.g2[`${lado}_p`] = null; n.g2[`${lado}_m`] = null;
        }
        return { ...n };
      });
      return;
    }

    const d = await buscarNoBanco(id);
    setArvore((prev: any) => {
      const n = { ...prev };
      if (nivel === 'g1') {
        n[chave] = d;
        n.g2[`${chave}_p`] = d.pai; n.g2[`${chave}_m`] = d.mae;
        n.g3[`${chave}_pp`] = d.pai?.pai; n.g3[`${chave}_pm`] = d.pai?.mae;
        n.g3[`${chave}_mp`] = d.mae?.pai; n.g3[`${chave}_mm`] = d.mae?.mae;
      } else if (nivel === 'g2') {
        n.g2[chave] = d;
        const [l, t] = chave.split('_');
        n.g3[`${l}_${t}p`] = d.pai; n.g3[`${l}_${t}m`] = d.mae;
      } else if (nivel === 'g3') {
        n.g3[chave] = d;
        const [l, t] = chave.split('_');
        n.g4[`${l}_${t}p`] = d.pai; n.g4[`${l}_${t}m`] = d.mae;
      }
      return { ...n };
    });
  };

  const inicializar = useCallback(async () => {
    if (!passaroId || !empresaId) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from("passaros").select("*").eq("id", passaroId).single();
      setAlvo(p);
      const { data: t } = await supabase.from("passaros").select("id, nome, anilha, sexo, data_nascimento").eq("empresa_id", empresaId).eq("especie_id", p.especie_id);
      setTodosPassaros(t || []);
      setIdsOriginais([p.pai_id, p.mae_id].filter(Boolean));
      if (p.pai_id) await carregarComCascata(p.pai_id, 'g1', 'pai', true);
      if (p.mae_id) await carregarComCascata(p.mae_id, 'g1', 'mae', true);
    } finally { setLoading(false); }
  }, [passaroId, empresaId]);

  useEffect(() => { inicializar(); }, [inicializar]);

  const opcoesValidas = (s: string, d: string | null, temPredecessor: boolean) => {
    if (!temPredecessor) return [];
    return todosPassaros.filter(p => p.sexo === s && p.id !== alvo?.id && (!d || !p.data_nascimento || new Date(p.data_nascimento) < new Date(d)));
  };

  const handleGravar = async () => {
    setSalvando(true);
    try {
      const updates = [];
      updates.push(supabase.from("passaros").update({ pai_id: arvore.pai?.id || null, mae_id: arvore.mae?.id || null }).eq("id", passaroId));
      if (arvore.pai?.id && !idsOriginais.includes(arvore.pai.id)) updates.push(supabase.from("passaros").update({ pai_id: arvore.g2.pai_p?.id || null, mae_id: arvore.g2.pai_m?.id || null }).eq("id", arvore.pai.id));
      if (arvore.mae?.id && !idsOriginais.includes(arvore.mae.id)) updates.push(supabase.from("passaros").update({ pai_id: arvore.g2.mae_p?.id || null, mae_id: arvore.g2.mae_m?.id || null }).eq("id", arvore.mae.id));
      await Promise.all(updates);
      alert("Sucesso!");
      router.back();
    } finally { setSalvando(false); }
  };

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth={false} sx={{ py: 1, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`
        .tree-container { display: flex; gap: 40px; align-items: center; padding: 10px 0; }
        .col { display: flex; flex-direction: column; justify-content: space-around; height: 750px; position: relative; }
        
        /* Conector que fica entre as colunas */
        .conn { position: absolute; right: -40px; top: 0; bottom: 0; width: 40px; display: flex; align-items: center; justify-content: center; }
        
        /* Linha horizontal que sai do combo da esquerda */
        .line-out { width: 15px; height: 1.5px; background: #94a3b8; position: absolute; left: -5px; }
        
        /* O colchete (bracket) */
        .bracket { position: absolute; left: 10px; top: 22%; bottom: 22%; width: 1.5px; background: #94a3b8; display: flex; flex-direction: column; justify-content: space-between; }
        
        /* Riscos horizontais que apontam para a DIREITA (para os combos da frente) */
        .bracket::before, .bracket::after { content: ""; width: 15px; height: 1.5px; background: #94a3b8; align-self: flex-start; margin-left: 0px; transform: translateX(0); }
      `}</style>

      <Paper elevation={1} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid #1e40af' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>{alvo?.nome} <span style={{fontSize: '12px', fontWeight: 'normal'}}>({alvo?.anilha})</span></Typography>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleGravar} disabled={salvando}>Gravar</Button>
      </Paper>

      <Stack spacing={2}>
        {['pai', 'mae'].map((lado) => (
          <Box key={lado} sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Chip 
              label={`LINHAGEM DO ${lado.toUpperCase()}`} 
              sx={{ mb: 2, fontWeight: 'bold', color: 'white', bgcolor: lado === 'pai' ? '#0D47A1' : '#880E4F' }} 
            />
            
            <Box className="tree-container">
              <Box className="col">
                <SeletorCompacto label={lado === 'pai' ? "PAI" : "MÃE"} value={arvore[lado]} opcoes={opcoesValidas(lado === 'pai' ? 'M' : 'F', alvo?.data_nascimento || null, true)} onChange={(v:any) => carregarComCascata(v?.id, 'g1', lado)} original={idsOriginais.includes(arvore[lado]?.id)} />
                <Box className="conn">
                  <Box className="line-out" />
                  <Box className="bracket" />
                </Box>
              </Box>

              <Box className="col">
                <SeletorCompacto label="AVÔ" value={arvore.g2[`${lado}_p`]} opcoes={opcoesValidas('M', arvore[lado]?.data_nascimento, !!arvore[lado])} onChange={(v:any) => carregarComCascata(v?.id, 'g2', `${lado}_p`)} />
                <SeletorCompacto label="AVÓ" value={arvore.g2[`${lado}_m`]} opcoes={opcoesValidas('F', arvore[lado]?.data_nascimento, !!arvore[lado])} onChange={(v:any) => carregarComCascata(v?.id, 'g2', `${lado}_m`)} />
                <Box className="conn">
                   <Box className="line-out" />
                   <Box className="bracket" />
                </Box>
              </Box>

              <Box className="col">
                {['pp', 'pm', 'mp', 'mm'].map(s => {
                  const paiMaeG2 = arvore.g2[`${lado}_${s[0] === 'p' ? 'p' : 'm'}`];
                  return (
                    <SeletorCompacto key={s} label="BIS." value={arvore.g3[`${lado}_${s}`]} opcoes={opcoesValidas(s.endsWith('p') ? 'M' : 'F', paiMaeG2?.data_nascimento, !!paiMaeG2)} onChange={(v:any) => carregarComCascata(v?.id, 'g3', `${lado}_${s}`)} />
                  );
                })}
                <Box className="conn">
                   <Box className="line-out" />
                   <Box className="bracket" />
                </Box>
              </Box>

              <Box className="col">
                {['ppp', 'ppm', 'pmp', 'pmm', 'mpp', 'mpm', 'mmp', 'mmm'].map((s, i) => {
                  const ancestralG3 = arvore.g3[`${lado}_${s.substring(0, 2)}`];
                  return (
                    <SeletorCompacto key={i} label="TAT." value={arvore.g4[`${lado}_${s}`]} opcoes={opcoesValidas(s.endsWith('p') ? 'M' : 'F', ancestralG3?.data_nascimento, !!ancestralG3)} onChange={(v:any) => {}} />
                  );
                })}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}

function SeletorCompacto({ label, value, opcoes, onChange, original }: any) {
  return (
    <Box sx={{ width: 175, position: 'relative' }}>
      <Autocomplete
        disabled={original}
        options={opcoes || []}
        getOptionLabel={(o) => `${o.nome} - ${o.anilha}`}
        value={value || null}
        noOptionsText="Sem opções"
        onChange={(_, v) => onChange(v)}
        size="small"
        renderInput={(p) => (
          <TextField 
            {...p} 
            label={label} 
            variant="outlined" 
            InputLabelProps={{ style: { fontSize: '10px' } }}
            InputProps={{ 
              ...p.InputProps, 
              style: { fontSize: '12px', height: '28px', padding: '0 4px' } 
            }}
          />
        )}
      />
      {!original && value && (
        <IconButton size="small" onClick={() => onChange(null)} sx={{ position: 'absolute', right: -24, top: 2, color: '#ef4444', p: 0 }}>
          <ClearIcon sx={{ fontSize: '14px' }} />
        </IconButton>
      )}
    </Box>
  );
}