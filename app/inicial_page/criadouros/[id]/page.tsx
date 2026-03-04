"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formataDados } from "@/lib/formataDados";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Typography, Button, TextField, Paper, CircularProgress,
  Container, Divider, FormControlLabel, Checkbox, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CadastroCriadouro() {
  const router = useRouter();
  const params = useParams();
  
  const idCriadouro = params.id !== "novo" ? params.id : null;
  const { empresaId } = useEmpresa();

  const [loading, setLoading] = useState(false);
  const [continuar, setContinuar] = useState(!!idCriadouro);

  // Estados dos Campos
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

  const [ctfNumero, setCtfNumero] = useState("");
  const [registroSispass, setRegistroSispass] = useState("");
  const [categoriaCriador, setCategoriaCriador] = useState("Amador");
  const [dataValidade, setDataValidade] = useState("");
  const [capacidadeAves, setCapacidadeAves] = useState(0);

  const carregarCriadouro = useCallback(async () => {
    if (!idCriadouro) return;
    setLoading(true);
    const { data, error } = await supabase.from("criadouros").select("*").eq("id", idCriadouro).single();
    if (data && !error) {
      setTipoPessoa(data.tipo_pessoa?.trim() as any);
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
      setEProprio(data.e_proprio);
      setCtfNumero(data.ctf_numero || "");
      setRegistroSispass(data.registro_sispass || "");
      setCategoriaCriador(data.categoria_criador || "Amador");
      setDataValidade(data.data_validade_licenca || "");
      setCapacidadeAves(data.capacidade_maxima_aves || 0);
      setContinuar(true);
    }
    setLoading(false);
  }, [idCriadouro]);

  useEffect(() => { carregarCriadouro(); }, [carregarCriadouro]);

  const handleCepChange = async (v: string) => {
    const limpo = v.replace(/\D/g, "");
    setCep(formataDados(limpo, "cep"));

    if (limpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const dados = await res.json(); // Alterado de 'd' para 'dados'
        
        if (!dados.erro) {
          setEndereco(dados.logradouro || "");
          setCidade(dados.localidade || ""); // Agora 'dados' existe aqui
          setEstado(dados.uf || "");
        }
      } catch (err) { 
        console.error("Erro ao buscar CEP:", err); 
      }
    }
  };

  const handleSalvar = async () => {
    if (!empresaId) return alert("Erro de contexto: Empresa não identificada.");
    setLoading(true);

    const payload = {
      tipo_pessoa: tipoPessoa,
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia || razaoSocial,
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

    const { error } = idCriadouro 
      ? await supabase.from("criadouros").update(payload).eq("id", idCriadouro)
      : await supabase.from("criadouros").insert([payload]);

    if (error) alert("Erro: " + error.message);
    else {
      alert("Criadouro salvo com sucesso!");
      router.push("/inicial_page/criadouros");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        variant="outlined" 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          borderColor: "#cbd5e1", 
          borderWidth: "4px",      
          borderStyle: "solid",
          bgcolor: "#ffffff"
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 🖼️ Ícone personalizado de 96px */}
            <Box
              component="img"
              src="/icons/criadouros.png"
              alt="Ícone Criadouro"
              sx={{ width: 96, height: 96, objectFit: 'contain' }}
            />
            <Typography variant="h4" fontWeight="900" color="#1e293b">
              {idCriadouro ? "Editar Criadouro" : "Novo Criadouro"}
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push("/inicial_page/criadouros")}
            sx={{ fontWeight: "bold", color: "#64748b" }}
          >
            Voltar
          </Button>
        </Box>

        {loading && idCriadouro && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!continuar && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Selecione o tipo de registro:</Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button size="large" variant={tipoPessoa === "PF" ? "contained" : "outlined"} onClick={() => setTipoPessoa("PF")}>Pessoa Física</Button>
              <Button size="large" variant={tipoPessoa === "PJ" ? "contained" : "outlined"} onClick={() => setTipoPessoa("PJ")}>Pessoa Jurídica</Button>
            </Box>
            <Button variant="contained" sx={{ mt: 5, px: 8, fontWeight: 'bold' }} disabled={!tipoPessoa} onClick={() => setContinuar(true)}>Continuar</Button>
          </Box>
        )}

        {continuar && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label={tipoPessoa === "PF" ? "Nome Completo" : "Razão Social"}
                sx={{ flex: 3 }}
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
              />
              <TextField
                label={tipoPessoa === "PF" ? "CPF" : "CNPJ"}
                sx={{ flex: 1, minWidth: '200px' }}
                value={documento}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setDocumento(formataDados(v, tipoPessoa === "PF" ? "cpf" : "cnpj"));
                }}
              />
            </Box>

            {tipoPessoa === "PJ" && (
              <Box>
                <TextField label="Nome Fantasia" fullWidth value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="CEP" sx={{ width: '150px' }} value={cep} onChange={(e) => handleCepChange(e.target.value)} />
              <TextField label="Endereço" sx={{ flex: 1 }} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              
              <TextField label="UF" sx={{ width: '80px' }} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} inputProps={{ maxLength: 2 }} />
            </Box>

            <Divider sx={{ my: 1, fontWeight: 'bold' }}>Dados do Responsável e Contato</Divider>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Nome do Responsável" sx={{ flex: 2 }} value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
              <TextField label="CPF Responsável" sx={{ flex: 1 }} value={responsavelCpf} onChange={(e) => setResponsavelCpf(formataDados(e.target.value, "cpf"))} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="E-mail" sx={{ flex: 2 }} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Telefone" sx={{ flex: 1 }} value={telefone} onChange={(e) => setTelefone(formataDados(e.target.value, "celular"))} />
              <FormControlLabel control={<Checkbox checked={eProprio} onChange={(e) => setEProprio(e.target.checked)} />} label="É próprio" sx={{ ml: 1 }} />
            </Box>

            <Divider sx={{ my: 1, fontWeight: 'bold' }}>Registros Ambientais (IBAMA / SISPASS)</Divider>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<SaveIcon />} 
                onClick={handleSalvar} 
                disabled={loading} 
                sx={{ 
                  px: 6, 
                  fontWeight: "bold", 
                  bgcolor: "#1e293b", 
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#334155" } 
                }}
              >
                {loading ? "Processando..." : "Salvar Criadouro"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}