"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  MenuItem, Stack, Autocomplete, Divider, CircularProgress
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";

interface IFormTransferencia {
  tipo: string;
  origem_id: number | null;
  destino_id: number | null;
  passaro_id: number | null;
  nome_passaro: string;
  anilha_passaro: string;
  especie_id: number | string;
  pai_id: number | null;
  nome_pai: string;
  anilha_pai: string;
  mae_id: number | null;
  nome_mae: string;
  anilha_mae: string;
  observacao: string;
}

function TransferenciaFormContent() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();
  const isNovo = id === "novo";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [criadouros, setCriadouros] = useState<any[]>([]);
  const [passarosProprios, setPassarosProprios] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);

  const [form, setForm] = useState<IFormTransferencia>({
    tipo: "S",
    origem_id: null,
    destino_id: null,
    passaro_id: null,
    nome_passaro: "",
    anilha_passaro: "",
    especie_id: "",
    pai_id: null,
    nome_pai: "",
    anilha_pai: "",
    mae_id: null,
    nome_mae: "",
    anilha_mae: "",
    observacao: ""
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      const [resC, resP, resE] = await Promise.all([
        supabase.from("criadouros").select("*").eq("empresa_uuid", empresaId).order('razao_social'),
        // Buscamos o pássaro com JOIN para o pai e mãe para pegar nomes e anilhas na Saída
        supabase.from("passaros").select(`
          *, 
          especies_sispass(nomes_comuns),
          pai:pai_id(id, nome, anilha),
          mae:mae_id(id, nome, anilha)
        `).eq("empresa_id", empresaId).eq("status", "Ativo"),
        supabase.from("especies_sispass").select("id, nomes_comuns").order("nomes_comuns")
      ]);

      setCriadouros(resC.data || []);
      setPassarosProprios(resP.data || []);
      setEspecies(resE.data || []);

      const proprio = resC.data?.find(c => c.e_proprio);
      if (isNovo) {
        setForm(prev => ({ ...prev, origem_id: proprio?.id || null }));
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleMudarTipo = (novoTipo: string) => {
    const proprio = criadouros.find(c => c.e_proprio);
    setForm({
      tipo: novoTipo,
      origem_id: novoTipo === 'S' ? proprio?.id : null,
      destino_id: novoTipo === 'E' ? proprio?.id : null,
      passaro_id: null,
      nome_passaro: "",
      anilha_passaro: "",
      especie_id: "",
      pai_id: null,
      nome_pai: "",
      anilha_pai: "",
      mae_id: null,
      nome_mae: "",
      anilha_mae: "",
      observacao: ""
    });
  };

  const handleSelecionarPassaroSaida = (passaro: any) => {
    if (!passaro) return;
    setForm(prev => ({
      ...prev,
      passaro_id: passaro.id,
      nome_passaro: passaro.nome,
      anilha_passaro: passaro.anilha,
      especie_id: passaro.especie_id,
      pai_id: passaro.pai?.id || null,
      nome_pai: passaro.pai?.nome || "Não informado",
      anilha_pai: passaro.pai?.anilha || "",
      mae_id: passaro.mae?.id || null,
      nome_mae: passaro.mae?.nome || "Não informado",
      anilha_mae: passaro.mae?.anilha || ""
    }));
  };

  const handleSalvar = async () => {
    if (!form.origem_id || !form.destino_id || !form.nome_passaro) return alert("Preencha os campos obrigatórios.");
    setSalvando(true);
    try {
      let finalPassaroId = form.passaro_id;

      if (form.tipo === 'E') {
        let pId = null; let mId = null;
        if (form.nome_pai) {
          const { data: p } = await supabase.from("passaros").insert([{ nome: form.nome_pai, anilha: form.anilha_pai, sexo: 'M', status: 'Externo', empresa_id: empresaId, especie_id: form.especie_id }]).select().single();
          pId = p?.id;
        }
        if (form.nome_mae) {
          const { data: m } = await supabase.from("passaros").insert([{ nome: form.nome_mae, anilha: form.anilha_mae, sexo: 'F', status: 'Externo', empresa_id: empresaId, especie_id: form.especie_id }]).select().single();
          mId = m?.id;
        }
        const { data: novoP } = await supabase.from("passaros").insert([{
          nome: form.nome_passaro, anilha: form.anilha_passaro, especie_id: form.especie_id, pai_id: pId, mae_id: mId, status: 'Ativo', empresa_id: empresaId, usuario_id: usuarioId, origem_id: form.origem_id, destino_id: form.destino_id
        }]).select().single();
        finalPassaroId = novoP?.id;
      } else {
        await supabase.from("passaros").update({ status: 'Transferido', destino_id: form.destino_id }).eq("id", form.passaro_id);
      }

      await supabase.from("transferencias_passaros").insert([{ ...form, passaro_id: finalPassaroId, empresa_id: empresaId }]);
      alert("Sucesso!");
      router.push("/inicial_page/passaros/transferencias");
    } catch (err) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  const criadouroProprio = criadouros.find(c => c.e_proprio);
  const criadourosTerceiros = criadouros.filter(c => !c.e_proprio);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1" }}>
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SwapHorizIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" fontWeight="900">Transferência</Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3, bgcolor: "#f8fafc" }}>
            <Stack spacing={3}>
              <TextField select label="Tipo" fullWidth value={form.tipo} onChange={(e) => handleMudarTipo(e.target.value)}>
                <MenuItem value="E">ENTRADA</MenuItem>
                <MenuItem value="S">SAÍDA</MenuItem>
              </TextField>
              <Stack direction="row" spacing={2}>
                <Autocomplete fullWidth disabled={form.tipo === 'S'} options={form.tipo === 'S' ? [criadouroProprio] : criadourosTerceiros} getOptionLabel={(o) => o?.razao_social || ""} value={criadouros.find(c => c.id === form.origem_id) || null} onChange={(_, v) => setForm(p => ({ ...p, origem_id: v?.id || null }))} renderInput={(p) => <TextField {...p} label="Origem" size="small" />} />
                <Autocomplete fullWidth disabled={form.tipo === 'E'} options={form.tipo === 'E' ? [criadouroProprio] : criadourosTerceiros} getOptionLabel={(o) => o?.razao_social || ""} value={criadouros.find(c => c.id === form.destino_id) || null} onChange={(_, v) => setForm(p => ({ ...p, destino_id: v?.id || null }))} renderInput={(p) => <TextField {...p} label="Destino" size="small" />} />
              </Stack>
            </Stack>
          </Paper>

          <Box>
            <Divider sx={{ mb: 3 }}>PÁSSARO</Divider>
            {form.tipo === 'S' ? (
              <Autocomplete options={passarosProprios} getOptionLabel={(o) => `${o.nome} - ${o.anilha}`} onChange={(_, v) => handleSelecionarPassaroSaida(v)} renderInput={(p) => <TextField {...p} label="Selecionar do Plantel" />} />
            ) : (
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField label="Nome" fullWidth value={form.nome_passaro} onChange={(e) => setForm(p => ({...p, nome_passaro: e.target.value}))} />
                  <TextField label="Anilha" fullWidth value={form.anilha_passaro} onChange={(e) => setForm(p => ({...p, anilha_passaro: e.target.value}))} />
                </Stack>
                <Autocomplete options={especies} getOptionLabel={(o) => o.nomes_comuns?.[0] || ""} onChange={(_, v) => setForm(p => ({ ...p, especie_id: v?.id || "" }))} renderInput={(p) => <TextField {...p} label="Espécie" />} />
              </Stack>
            )}
          </Box>

          <Box>
            <Divider sx={{ mb: 3 }}>GENEALOGIA</Divider>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Nome Pai" disabled={form.tipo === 'S'} value={form.nome_pai} onChange={(e) => setForm(p => ({...p, nome_pai: e.target.value}))} size="small" />
              <TextField label="Anilha Pai" disabled={form.tipo === 'S'} value={form.anilha_pai} onChange={(e) => setForm(p => ({...p, anilha_pai: e.target.value}))} size="small" />
              <TextField label="Nome Mãe" disabled={form.tipo === 'S'} value={form.nome_mae} onChange={(e) => setForm(p => ({...p, nome_mae: e.target.value}))} size="small" />
              <TextField label="Anilha Mãe" disabled={form.tipo === 'S'} value={form.anilha_mae} onChange={(e) => setForm(p => ({...p, anilha_mae: e.target.value}))} size="small" />
            </Box>
          </Box>

          <TextField label="Observação" multiline rows={2} value={form.observacao} onChange={(e) => setForm(p => ({...p, observacao: e.target.value}))} />

          {/* RODAPÉ COM OS 3 BOTÕES SOLICITADOS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => router.back()} color="inherit">Sair</Button>
            
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="secondary" startIcon={<PrintIcon />} disabled={isNovo}>Imprimir Comprovante</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={salvando} sx={{ bgcolor: "#1e293b" }}>Salvar Transferência</Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function Page() { return <Suspense fallback={<CircularProgress />}><TransferenciaFormContent /></Suspense>; }