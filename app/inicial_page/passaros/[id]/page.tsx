"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import { formataDados } from "@/lib/formataDados";
import {
  Box, TextField, Button, Typography, CircularProgress, Paper, Container, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Autocomplete, Radio, RadioGroup, FormControlLabel,
  Stack, Divider, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Avatar, Checkbox
} from "@mui/material";

// Ícones
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import AddIcon from "@mui/icons-material/Add";
import AddModeratorIcon from "@mui/icons-material/AddModerator";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

// Componentes
import { CrachaProfissional } from "@/components/CrachaProfissional";

function PassaroFormContent() {
  const params = useParams();
  const idUrl = (params?.id as string) || "";
  const isNovo = idUrl === "novo";
  
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<any>(null);
  
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [todasEntidades, setTodasEntidades] = useState<any[]>([]);
  const [entidadesVinculadas, setEntidadesVinculadas] = useState<any[]>([]);
  const [torneios, setTorneios] = useState<any[]>([]);
  const [estoqueAnilhasGlobal, setEstoqueAnilhasGlobal] = useState<any[]>([]);
  const [saude, setSaude] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);

  const [modalSaudeAberto, setModalSaudeAberto] = useState(false);
  const [novaSaude, setNovaSaude] = useState({ medicamento_id: "", data_programada: new Date().toISOString().split('T')[0], dose: "" });
  const [exibirEstoque, setExibirEstoque] = useState(false);
  const [modalAnilhaRapida, setModalAnilhaRapida] = useState(false);
  const [novaAnilhaNum, setNovaAnilhaNum] = useState("");
  const [modalTorneioAberto, setModalTorneioAberto] = useState(false);
  const [modalEntidadeAberto, setModalEntidadeAberto] = useState(false);
  const [novoTorneio, setNovoTorneio] = useState<any>({ data_inicio: "", categoria: "", colocacao: "", entidade_id: "" });
  const [novoVinculo, setNovoVinculo] = useState({ entidade_id: "", numero_socio: "", data_registro: new Date().toISOString().split('T')[0] });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      const [resP, resM, resA, resE, resEnt, resMed] = await Promise.all([
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
        supabase.from("anilhas").select("*").eq("empresa_id", empresaId).eq("status", 1).is("passaro_filhote_id", null),
        supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns'),
        supabase.from("entidades").select("*").eq("empresa_id", empresaId).order('nome'),
        supabase.from("medicamentos").select("*").eq("empresa_id", empresaId).order('nome')
      ]);

      setPais(resP.data || []);
      setMaes(resM.data || []);
      setEstoqueAnilhasGlobal(resA.data || []);
      setEspecies(resE.data || []);
      setTodasEntidades(resEnt.data || []);
      setMedicamentos(resMed.data || []);
      
      if (isNovo) {
        setForm({ nome: "", anilha: "", sexo: "M", status: "Ativo", especie_id: "", data_nascimento: new Date().toISOString().split('T')[0], mae_id: null, pai_id: null, reprodutor: false });
      } else {
        const passaroId = Number(idUrl);
        const { data: passaro } = await supabase.from("passaros").select(`*`).eq("id", passaroId).single();
        if (passaro) {
          setForm(passaro);
          const [resVinculo, resTor, resSaude] = await Promise.all([
            supabase.from("passaros_entidades").select("*, entidades(nome, sigla)").eq("passaro_id", passaroId),
            supabase.from("passaros_torneios").select("*, entidades(nome, sigla)").eq("passaro_id", passaroId).order('data_inicio', { ascending: false }),
            supabase.from("passaros_saude").select("*, medicamentos(nome, tipo)").eq("passaro_id", passaroId).order('data_programada', { ascending: false })
          ]);
          setEntidadesVinculadas(resVinculo.data || []);
          setTorneios(resTor.data || []);
          setSaude(resSaude.data || []);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [idUrl, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvarPassaro = async () => {
    if (salvando || !form) return;
    setSalvando(true);
    try {
      const formFinal = { ...form, reprodutor: !!form.reprodutor };
      if (isNovo) {
        const { data: n, error } = await supabase.from("passaros").insert([{ ...formFinal, empresa_id: empresaId, usuario_id: usuarioId }]).select().single();
        if (error) throw error;
        if (form.anilha) await supabase.from("anilhas").update({ status: 2, passaro_filhote_id: n.id }).eq("numero", form.anilha);
        router.push(`/inicial_page/passaros/${n.id}`);
      } else {
        await supabase.from("passaros").update(formFinal).eq("id", form.id);
        alert("Salvo com sucesso!");
        carregarDados();
      }
    } catch (err) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const handleImprimirCracha = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const crachaHtml = document.getElementById('area-cracha-profissional')?.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body onload="window.print(); window.close();">
          <div style="display:flex; justify-content:center; padding:20px;">${crachaHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAgendarSaude = async () => {
    if (!novaSaude.medicamento_id) return;
    await supabase.from("passaros_saude").insert([{ ...novaSaude, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalSaudeAberto(false);
    setNovaSaude({ medicamento_id: "", data_programada: new Date().toISOString().split('T')[0], dose: "" });
    carregarDados();
  };

  const handleSalvarAnilhaRapida = async () => {
    if (!novaAnilhaNum || !form?.mae_id) return;
    await supabase.from("anilhas").insert([{ numero: novaAnilhaNum, empresa_id: empresaId, passaro_femea_id: form.mae_id, status: 1 }]);
    setModalAnilhaRapida(false); setNovaAnilhaNum(""); carregarDados();
  };

  const handleAddTorneio = async () => {
    await supabase.from("passaros_torneios").insert([{ ...novoTorneio, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalTorneioAberto(false); carregarDados();
  };

  const handleAddEntidade = async () => {
    await supabase.from("passaros_entidades").insert([{ ...novoVinculo, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalEntidadeAberto(false); carregarDados();
  };

  const anilhasDisponiveis = estoqueAnilhasGlobal.filter(a => a.passaro_femea_id === form?.mae_id);

  if (loading || !form) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="900" color="primary" sx={{ textTransform: 'capitalize' }}>
          {isNovo ? "Novo filhote" : "Ficha técnica"}
        </Typography>
        <Stack direction="row" spacing={1}>
           {!isNovo && (
             <Button variant="outlined" color="secondary" startIcon={<WorkspacePremiumIcon />} onClick={() => window.open(`/inicial_page/passaros/laudo-pedigree?id=${form.id}`, '_blank')}>Laudo pedigree</Button>
           )}
           <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/passaros")} size="small">Voltar</Button>
           <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvarPassaro} disabled={salvando} size="small">Salvar</Button>
        </Stack>
      </Box>

      <Stack spacing={2}>
        
        {/* Identificação */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <AssignmentIndIcon color="primary" fontSize="small" />
            <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Identificação e laudo</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
            <Box sx={{ gridColumn: 'span 12' }}><TextField label="Nome" fullWidth size="small" value={form.nome || ""} onChange={(e) => setForm({...form, nome: e.target.value})} /></Box>
            <Box sx={{ gridColumn: 'span 4' }}><TextField label="Anilha" fullWidth size="small" value={form.anilha || ""} disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#d32f2f", fontWeight: '900' } }} /></Box>
            <Box sx={{ gridColumn: 'span 4' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sexo</InputLabel>
                <Select value={form.sexo || "M"} label="Sexo" onChange={(e) => setForm({...form, sexo: e.target.value})}><MenuItem value="M">Macho (♂)</MenuItem><MenuItem value="F">Fêmea (♀)</MenuItem></Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: 'span 4' }}><TextField type="date" label="Nascimento" fullWidth size="small" value={form.data_nascimento || ""} onChange={(e) => setForm({...form, data_nascimento: e.target.value})} InputLabelProps={{ shrink: true }} /></Box>
            <Box sx={{ gridColumn: 'span 12' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Espécie</InputLabel>
                <Select value={form.especie_id || ""} label="Espécie" onChange={(e: any) => setForm({...form, especie_id: e.target.value})}>
                  {especies.map(e => <MenuItem key={e.id} value={e.id}>{e.nomes_comuns?.[0]}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Genealogia */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <AccountTreeIcon color="primary" fontSize="small" />
            <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Genealogia</Typography>
          </Stack>
          <Stack spacing={2}>
            <Autocomplete options={pais} getOptionLabel={(o) => `${o.nome} (${o.anilha})`} value={pais.find(p => p.id === form.pai_id) || null} onChange={(_, v) => setForm({...form, pai_id: v?.id})} renderInput={(params) => <TextField {...params} label="Pai" size="small" />} />
            <Stack direction="row" spacing={1}>
              <Autocomplete sx={{ flex: 1 }} options={maes} getOptionLabel={(o) => `${o.nome} (${o.anilha})`} value={maes.find(m => m.id === form.mae_id) || null} onChange={(_, v) => { setForm({...form, mae_id: v?.id, anilha: ""}); setExibirEstoque(false); }} renderInput={(params) => <TextField {...params} label="Mãe" size="small" />} />
              <Tooltip title="Anilhas cadastradas"><Button variant="outlined" size="small" onClick={() => setExibirEstoque(!exibirEstoque)} disabled={!form.mae_id} startIcon={<FingerprintIcon />}>Anilhas</Button></Tooltip>
              <Tooltip title="Nova anilha rápida"><IconButton color="primary" onClick={() => setModalAnilhaRapida(true)} disabled={!form.mae_id}><AddIcon /></IconButton></Tooltip>
            </Stack>
            {exibirEstoque && (
              <Box sx={{ p: 1.5, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px dashed #2196f3' }}>
                <RadioGroup row value={form.anilha} onChange={(e) => setForm({...form, anilha: e.target.value})}>
                  {anilhasDisponiveis.map((an: any) => (<FormControlLabel key={an.id} value={an.numero} control={<Radio size="small" />} label={<Typography variant="caption">{an.numero}</Typography>} />))}
                </RadioGroup>
              </Box>
            )}
            {!isNovo && (
              <Button variant="outlined" fullWidth startIcon={<AccountTreeIcon />} onClick={() => router.push(`/inicial_page/passaros/${idUrl}/genealogia-visual`)} size="small">Genealogia visual</Button>
            )}
          </Stack>
        </Paper>

        {/* Crachá */}
        {!isNovo && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Pré-visualização do crachá</Typography>
              <Button size="small" startIcon={<PrintIcon />} variant="contained" color="secondary" onClick={handleImprimirCracha}>Imprimir PDF</Button>
            </Stack>
            <Box id="area-cracha-profissional" sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
               <CrachaProfissional passaroId={form.id} empresaId={empresaId as string} />
            </Box>
          </Paper>
        )}

        {/* Saúde */}
        {!isNovo && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" spacing={1} alignItems="center"><AddModeratorIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Saúde e medicamentos</Typography></Stack>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModalSaudeAberto(true)}>Agendar</Button>
            </Stack>
            <TableContainer><Table size="small"><TableBody>
              {saude.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontSize: '0.7rem' }}><b>{new Date(item.data_programada).toLocaleDateString()}</b></TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}><b>{item.medicamentos?.nome}</b> - {item.dose}</TableCell>
                  <TableCell align="right">{item.data_aplicacao ? <CheckCircleIcon color="success" sx={{ fontSize: 18 }} /> : <Typography variant="caption" color="warning.main">Pendente</Typography>}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></TableContainer>
          </Paper>
        )}

        {/* Filiações */}
        {!isNovo && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" spacing={1} alignItems="center"><CorporateFareIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Filiações e clubes</Typography></Stack>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModalEntidadeAberto(true)}>Vincular</Button>
            </Stack>
            <TableContainer><Table size="small"><TableBody>
              {entidadesVinculadas.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontSize: '0.7rem' }}><b>{item.entidades?.sigla}</b> - {item.entidades?.nome}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>Sócio: {item.numero_socio}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></TableContainer>
          </Paper>
        )}

        {/* Torneios */}
        {!isNovo && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" spacing={1} alignItems="center"><EmojiEventsIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'capitalize' }}>Torneios e premiações</Typography></Stack>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModalTorneioAberto(true)}>Registrar</Button>
            </Stack>
            <TableContainer><Table size="small"><TableBody>
              {torneios.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontSize: '0.7rem' }}><b>{new Date(item.data_inicio).toLocaleDateString()}</b></TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}><b>{item.colocacao}º Lugar</b> - {item.categoria}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{item.entidades?.sigla}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></TableContainer>
          </Paper>
        )}

      </Stack>

      {/* Modais */}
      <Dialog open={modalAnilhaRapida} onClose={() => setModalAnilhaRapida(false)}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Nova anilha para mãe</DialogTitle>
        <DialogContent>
          <TextField label="Número da anilha" fullWidth size="small" sx={{ mt: 1 }} value={novaAnilhaNum} onChange={(e) => setNovaAnilhaNum(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setModalAnilhaRapida(false)}>Cancelar</Button><Button variant="contained" onClick={handleSalvarAnilhaRapida}>Salvar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalSaudeAberto} onClose={() => setModalSaudeAberto(false)}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Agendar saúde</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Medicamento</InputLabel>
              <Select value={novaSaude.medicamento_id} label="Medicamento" onChange={(e) => setNovaSaude({...novaSaude, medicamento_id: e.target.value})}>
                {medicamentos.map(med => <MenuItem key={med.id} value={med.id}>{med.nome} ({med.tipo})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="date" label="Data" fullWidth size="small" InputLabelProps={{ shrink: true }} value={novaSaude.data_programada} onChange={(e) => setNovaSaude({...novaSaude, data_programada: e.target.value})} />
            <TextField label="Dose" fullWidth size="small" value={novaSaude.dose} onChange={(e) => setNovaSaude({...novaSaude, dose: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalSaudeAberto(false)}>Sair</Button><Button variant="contained" onClick={handleAgendarSaude}>Gravar</Button></DialogActions>
      </Dialog>
      
      <Dialog open={modalEntidadeAberto} onClose={() => setModalEntidadeAberto(false)}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Vincular clube</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Entidade</InputLabel>
              <Select value={novoVinculo.entidade_id} label="Entidade" onChange={(e) => setNovoVinculo({...novoVinculo, entidade_id: e.target.value as string})}>
                {todasEntidades.map(ent => <MenuItem key={ent.id} value={ent.id}>{ent.nome}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nº Registro / sócio" fullWidth size="small" value={novoVinculo.numero_socio} onChange={(e) => setNovoVinculo({...novoVinculo, numero_socio: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalEntidadeAberto(false)}>Sair</Button><Button variant="contained" onClick={handleAddEntidade}>Salvar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalTorneioAberto} onClose={() => setModalTorneioAberto(false)}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Registrar torneio</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
             <TextField type="date" label="Data" fullWidth size="small" InputLabelProps={{ shrink: true }} value={novoTorneio.data_inicio} onChange={(e) => setNovoTorneio({...novoTorneio, data_inicio: e.target.value})} />
             <FormControl fullWidth size="small">
              <InputLabel>Entidade organizadora</InputLabel>
              <Select value={novoTorneio.entidade_id} label="Entidade organizadora" onChange={(e) => setNovoTorneio({...novoTorneio, entidade_id: e.target.value as string})}>
                {todasEntidades.map(ent => <MenuItem key={ent.id} value={ent.id}>{ent.nome}</MenuItem>)}
              </Select>
            </FormControl>
             <TextField label="Categoria" fullWidth size="small" value={novoTorneio.categoria} onChange={(e) => setNovoTorneio({...novoTorneio, categoria: e.target.value})} />
             <TextField label="Colocação" type="number" fullWidth size="small" value={novoTorneio.colocacao} onChange={(e) => setNovoTorneio({...novoTorneio, colocacao: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalTorneioAberto(false)}>Cancelar</Button><Button variant="contained" onClick={handleAddTorneio}>Gravar</Button></DialogActions>
      </Dialog>

    </Container>
  );
}

export default function PassaroPage() { return <Suspense fallback={<CircularProgress />}><PassaroFormContent /></Suspense>; }