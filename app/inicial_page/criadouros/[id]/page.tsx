"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formataDados } from "@/lib/formataDados";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Typography, Button, TextField, Paper, CircularProgress,
  Container, Divider, FormControlLabel, Checkbox, MenuItem, Select, FormControl, InputLabel,
  Radio, RadioGroup, FormLabel
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import HouseSidingIcon from "@mui/icons-material/HouseSiding";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CadastroCriadouroPage() {
  const router = useRouter();
  const params = useParams();
  const { empresaId } = useEmpresa();
  
  // O ID pode vir de params.id (dependendo da sua rota configurada)
  const idCriadouro = params.id ? Number(params.id) : null;
  const isEdicao = !!idCriadouro;

  const [loading, setLoading] = useState(false);
  const [etapaInicial, setEtapaInicial] = useState(!isEdicao); // Pula a escolha PF/PJ se for edição

  // Estados do Formulário
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | "">("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [documento, setDocumento] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [eProprio, setEProprio] = useState(false);

  // Novos campos SISPASS/IBAMA
  const [ctfNumero, setCtfNumero] = useState("");
  const [registroSispass, setRegistroSispass] = useState("");
  const [categoriaCriador, setCategoriaCriador] = useState("Amador");
  const [dataValidade, setDataValidade] = useState("");
  const [capacidadeAves, setCapacidadeAves] = useState(0);

  // 🔹 Carregar dados para Edição
  const carregarDados = useCallback(async () => {
    if (!idCriadouro) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("criadouros")
      .select("*")
      .eq("id", idCriadouro)
      .single();

    if (data) {
      setTipoPessoa(data.tipo_pessoa?.trim() as "PF" | "PJ");
      setRazaoSocial(data.razao_social || "");
      setNomeFantasia(data.nome_fantasia || "");
      setDocumento(formataDados(data.documento || "", data.tipo_pessoa?.trim() === "PF" ? "cpf" : "cnpj"));
      setCep(formataDados(data.cep || "", "cep"));
      setEndereco(data.endereco || "");
      setCidade(data.cidade || "");
      setEstado(data.estado || "");
      setResponsavelNome(data.responsavel_nome || "");
      setResponsavelCpf(formataDados(data.responsavel_cpf || "", "cpf"));
      setEmail(data.email || "");
      setTelefone(formataDados(data.telefone || "", "celular"));
      setEProprio(data.e_proprio || false);
      // Campos Novos
      setCtfNumero(data.ctf_numero || "");
      setRegistroSispass(data.registro_sispass || "");
      setCategoriaCriador(data.categoria_criador || "Amador");
      setDataValidade(data.data_validade_licenca || "");
      setCapacidadeAves(data.capacidade_maxima_aves || 0);
    }
    setLoading(false);
  }, [idCriadouro]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // 🔹 Lógica de CEP Automático
  const handleCepChange = async (v: string) => {
    const limpo = v.replace(/\D/g, "");
    setCep(formataDados(limpo, "cep"));
    if (limpo.length === 8) {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const d = await res.json();
      if (!d.erro) {
        setEndereco(d.logradouro || "");
        setCidade(d.localidade || "");
        setEstado(d.uf || "");
      }
    }
  };

  const handleSalvar = async () => {
    if (!empresaId) return alert("Sessão expirada. Recarregue a página.");
    setLoading(true);

    const dadosFinal = {
      tipo_pessoa: tipoPessoa,
      razao_social: razaoSocial,
      nome_fantasia: tipoPessoa === "PF" ? razaoSocial : nomeFantasia,
      documento: documento.replace(/\D/g, ""),
      cep: cep.replace(/\D/g, ""),
      endereco, cidade, estado,
      responsavel_nome: responsavelNome,
      responsavel_cpf: responsavelCpf.replace(/\D/g, ""),
      email, telefone, e_proprio: eProprio,
      empresa_uuid: empresaId,
      ctf_numero: ctfNumero,
      registro_sispass: registroSispass,
      categoria_criador: categoriaCriador,
      data_validade_licenca: dataValidade || null,
      capacidade_maxima_aves: capacidadeAves
    };

    const { error } = isEdicao 
      ? await supabase.from("criadouros").update(dadosFinal).eq("id", idCriadouro)
      : await supabase.from("criadouros").insert([dadosFinal]);

    if (error) alert("Erro ao salvar: " + error.message);
    else {
      alert(isEdicao ? "Criadouro atualizado!" : "Criadouro cadastrado!");
      router.push("/inicial_page/criadouros");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HouseSidingIcon color="primary" sx={{ fontSize: 30 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              {isEdicao ? "Editar Criadouro" : "Novo Criadouro"}
            </Typography>
          </Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Voltar</Button>
        </Box>

        {/* Escolha Inicial PF/PJ (Apenas para novos cadastros) */}
        {etapaInicial && !isEdicao ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <FormControl>
              <FormLabel sx={{ mb: 2, fontSize: '1.2rem' }}>Tipo de Registro do Criadouro</FormLabel>
              <RadioGroup row value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as "PF" | "PJ")}>
                <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física" />
                <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica" />
              </RadioGroup>
              <Button 
                variant="contained" 
                sx={{ mt: 4, px: 6 }} 
                disabled={!tipoPessoa} 
                onClick={() => setEtapaInicial(false)}
              >
                Continuar para o Formulário
              </Button>
            </FormControl>
          </Box>
        ) : (
          <Box>
            {/* 1ª LINHA: NOME E DOCUMENTO */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label={tipoPessoa === "PF" ? "Nome Completo" : "Razão Social"}
                sx={{ flex: 3 }}
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                InputProps={{ style: { fontSize: '1.1rem', fontWeight: '600' } }}
              />
              <TextField
                label={tipoPessoa === "PF" ? "CPF" : "CNPJ"}
                sx={{ width: { sm: '220px' } }}
                value={documento}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setDocumento(formataDados(v, tipoPessoa === "PF" ? "cpf" : "cnpj"));
                }}
              />
            </Box>

            {/* 2ª LINHA: FANTASIA (SE PJ) */}
            {tipoPessoa === "PJ" && (
              <Box sx={{ mb: 3 }}>
                <TextField label="Nome Fantasia" fullWidth value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
              </Box>
            )}

            {/* 3ª LINHA: ENDEREÇO */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="CEP" sx={{ width: '150px' }} value={cep} onChange={(e) => handleCepChange(e.target.value)} />
              <TextField label="Logradouro" sx={{ flex: 1 }} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              <TextField label="Cidade" sx={{ flex: 1 }} value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <TextField label="UF" sx={{ width: '80px' }} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} inputProps={{ maxLength: 2 }} />
            </Box>

            <Divider sx={{ my: 3 }}>Responsável e Contato</Divider>

            {/* 4ª LINHA: RESPONSÁVEL */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Nome do Responsável" sx={{ flex: 2 }} value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
              <TextField label="CPF Responsável" sx={{ flex: 1 }} value={responsavelCpf} onChange={(e) => setResponsavelCpf(formataDados(e.target.value, "cpf"))} />
            </Box>

            {/* 5ª LINHA: CONTATO */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="E-mail" sx={{ flex: 2 }} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Telefone" sx={{ flex: 1 }} value={telefone} onChange={(e) => setTelefone(formataDados(e.target.value, "celular"))} />
              <FormControlLabel control={<Checkbox checked={eProprio} onChange={(e) => setEProprio(e.target.checked)} />} label="É próprio" sx={{ ml: 1 }} />
            </Box>

            <Divider sx={{ my: 3 }}>Dados SISPASS / IBAMA</Divider>

            {/* 6ª LINHA: REGISTROS AMBIENTAIS */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="CTF (IBAMA)" sx={{ flex: 1 }} value={ctfNumero} onChange={(e) => setCtfNumero(e.target.value)} />
              <TextField label="Registro SISPASS" sx={{ flex: 1 }} value={registroSispass} onChange={(e) => setRegistroSispass(e.target.value)} />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Categoria</InputLabel>
                <Select value={categoriaCriador} label="Categoria" onChange={(e) => setCategoriaCriador(e.target.value)}>
                  <MenuItem value="Amador">Amador</MenuItem>
                  <MenuItem value="Comercial">Comercial</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* 7ª LINHA: VALIDADE E CAPACIDADE */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Validade da Licença" type="date" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
              <TextField label="Capacidade Máxima Aves" type="number" sx={{ flex: 1 }} value={capacidadeAves} onChange={(e) => setCapacidadeAves(Number(e.target.value))} />
              <Box sx={{ flex: 1 }} />
            </Box>

            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => router.back()}>Cancelar</Button>
              <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={loading} sx={{ px: 6 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Salvar Alterações"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}