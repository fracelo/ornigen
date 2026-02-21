"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import {
  Box, TextField, Button, Typography, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Paper, Container, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ScienceIcon from "@mui/icons-material/Science";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

import CrachaPassaro from "@/components/CrachaPassaro";

function PassaroFormContent() {
  const { id } = useParams();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [subindo, setSubindo] = useState(false);
  const [form, setForm] = useState<any>(null);
  
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);
  const [criadouros, setCriadouros] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [midias, setMidias] = useState<any[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [tipoMidia, setTipoMidia] = useState('foto');
  const [descricaoMidia, setDescricaoMidia] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [mediaView, setMediaView] = useState<any>(null);

  const carregarDadosBase = useCallback(async () => {
    if (!empresaId) return;

    try {
      const [resP, resM, resC, resE] = await Promise.all([
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
        supabase.from("criadouros").select("id, nome_fantasia, razao_social").eq("empresa_uuid", empresaId),
        supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns')
      ]);

      setPais(resP.data || []);
      setMaes(resM.data || []);
      setEspecies(resE.data || []);
      setCriadouros(resC.data || []);

      if (id && id !== "novo") {
        const { data: passaro } = await supabase.from("passaros").select(`*, especies_sispass:especie_id(nomes_comuns)`).eq("id", id).single();
        if (passaro) {
          setForm({ ...passaro, especie_nome: passaro.especies_sispass?.nomes_comuns?.[0] || "" });
          const { data: resMidias } = await supabase.from("passaros_midia").select("*").eq("passaro_id", id).order('created_at', { ascending: false });
          setMidias(resMidias || []);
        }
      } else {
        setForm({
          nome: "", anilha: "", data_nascimento: "", especie_id: "", sexo: "M",
          pai_id: "", mae_id: "", origem_id: "", descricao: "", 
          codigo_sispass_ave: "", status_sispass: "Ativo", tipo_anilha: "Fechada",
          data_sexagem: "", laboratorio_sexagem: "", laudo_url: ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId]);

  useEffect(() => { carregarDadosBase(); }, [carregarDadosBase]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value ?? "" }));
  };

  const handleSalvarMidiaReal = async () => {
    if (!arquivo || id === "novo") return;
    setSubindo(true);
    try {
      const fileName = `${Date.now()}_${arquivo.name.replace(/\s/g, '_')}`;
      const fullPath = `${empresaId}/midias/${fileName}`;
      await supabase.storage.from('laudos').upload(fullPath, arquivo);
      const { data: publicUrlData } = supabase.storage.from('laudos').getPublicUrl(fullPath);
      
      await supabase.from("passaros_midia").insert([{
        passaro_id: Number(id),
        empresa_id: empresaId,
        usuario_id: usuarioId,
        tipo: tipoMidia,
        url: publicUrlData.publicUrl,
        descricao: descricaoMidia || "",
        data_registro: new Date().toISOString().split('T')[0]
      }]);

      setModalAberto(false);
      setArquivo(null);
      setDescricaoMidia("");
      await carregarDadosBase(); 
    } catch (e: any) {
      alert("Erro ao salvar mídia: " + e.message);
    } finally {
      setSubindo(false);
    }
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.anilha) return alert("Nome e Anilha são obrigatórios!");
    setLoading(true);
    const { especies_sispass, especie_nome, ...payload } = form;
    const cleanPayload = { ...payload, pai_id: payload.pai_id || null, mae_id: payload.mae_id || null, origem_id: payload.origem_id || null, especie_id: payload.especie_id || null };

    if (id === "novo") {
      const { data, error } = await supabase.from("passaros").insert([{ ...cleanPayload, empresa_id: empresaId, usuario_id: usuarioId }]).select().single();
      if (!error && data) router.push(`/inicial_page/passaros/${data.id}`);
      else { alert("Erro ao salvar"); setLoading(false); }
    } else {
      const { error } = await supabase.from("passaros").update(cleanPayload).eq("id", id);
      if (!error) router.push("/inicial_page/passaros");
      else { alert("Erro ao salvar"); setLoading(false); }
    }
  };

  if (loading || !form) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="900" color="primary">📝 Cadastro de Pássaro</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Voltar</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* 1. DADOS BÁSICOS */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>1. Dados do Pássaro & SISPASS</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
              <Box sx={{ gridColumn: 'span 8' }}><TextField label="Nome" name="nome" value={form.nome || ""} onChange={handleChange} fullWidth size="small" /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField label="Anilha" name="anilha" value={form.anilha || ""} onChange={handleChange} fullWidth size="small" /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField type="date" label="Nascimento" name="data_nascimento" value={form.data_nascimento || ""} onChange={handleChange} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Box>
              <Box sx={{ gridColumn: 'span 5' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Espécie</InputLabel>
                  <Select name="especie_id" value={form.especie_id || ""} label="Espécie" onChange={handleChange}>
                    {especies.map(e => <MenuItem key={e.id} value={e.id}>{e.nomes_comuns?.[0]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 3' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sexo</InputLabel>
                  <Select name="sexo" value={form.sexo || "M"} label="Sexo" onChange={handleChange}>
                    <MenuItem value="M">Macho ♂</MenuItem><MenuItem value="F">Fêmea ♀</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {/* 2. GENEALOGIA */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>2. Genealogia</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Pai</InputLabel>
                <Select name="pai_id" value={form.pai_id || ""} label="Pai" onChange={handleChange}>
                  <MenuItem value="">Nenhum / Desconhecido</MenuItem>
                  {pais.map(p => <MenuItem key={p.id} value={p.id}>{p.nome} ({p.anilha})</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Mãe</InputLabel>
                <Select name="mae_id" value={form.mae_id || ""} label="Mãe" onChange={handleChange}>
                  <MenuItem value="">Nenhuma / Desconhecida</MenuItem>
                  {maes.map(m => <MenuItem key={m.id} value={m.id}>{m.nome} ({m.anilha})</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* 3. SEXAGEM */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#fbfcfe' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#1976d2' }}>3. Sexagem e Certificação</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
              <Box sx={{ gridColumn: 'span 4' }}><TextField type="date" label="Data Sexagem" name="data_sexagem" value={form.data_sexagem || ""} onChange={handleChange} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Box>
              <Box sx={{ gridColumn: 'span 8' }}><TextField label="Laboratório" name="laboratorio_sexagem" value={form.laboratorio_sexagem || ""} onChange={handleChange} fullWidth size="small" /></Box>
            </Box>
          </Paper>

          {/* 4. GALERIA */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">4. Galeria de Mídias</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)}>Adicionar</Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
              {midias.map((m) => (
                <Paper key={m.id} variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
                  <Box sx={{ height: 120, bgcolor: '#f0f0f0', borderRadius: 1, mb: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* 🔹 AJUSTE: objectFit contain para aparecer inteiro */}
                    {m.tipo === 'foto' ? (
                      <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <VideoLibraryIcon sx={{ fontSize: 50, color: '#666' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => setMediaView(m)}><VisibilityIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_midia").delete().eq("id", m.id); carregarDadosBase(); } }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}><CrachaPassaro form={form} /></Paper>
            <Button variant="contained" fullWidth size="large" startIcon={<SaveIcon />} onClick={handleSalvar} sx={{ height: 60, fontWeight: 'bold' }}>Salvar Alterações</Button>
        </Box>
      </Box>

      {/* 🔹 MODAL VISUALIZAÇÃO (OLHAR) - BLINDADO CONTRA ERRO DE NULL E COM CONTAIN */}
      <Dialog open={!!mediaView} onClose={() => setMediaView(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ bgcolor: '#000', p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
          {mediaView && (
            <>
              {mediaView.tipo === 'foto' ? (
                <img 
                  src={mediaView.url || ""} 
                  alt="" 
                  style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} 
                />
              ) : (
                <video 
                  src={mediaView.url || ""} 
                  controls 
                  autoPlay 
                  style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} 
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#000' }}>
            <Button onClick={() => setMediaView(null)} sx={{ color: '#fff' }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL UPLOAD */}
      <Dialog open={modalAberto} onClose={() => setModalAberto(false)}>
        <DialogTitle>Nova Mídia</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Tipo" fullWidth value={tipoMidia} onChange={(e) => setTipoMidia(e.target.value)} size="small">
            <MenuItem value="foto">Foto</MenuItem>
            <MenuItem value="video">Vídeo</MenuItem>
          </TextField>
          <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
            {arquivo ? arquivo.name : "Escolher Arquivo"}<input type="file" hidden onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
          </Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvarMidiaReal} disabled={subindo || !arquivo}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function PassaroPage() {
  return (
    <Suspense fallback={<CircularProgress />}><PassaroFormContent /></Suspense>
  );
}