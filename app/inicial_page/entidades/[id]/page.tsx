"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formataDados } from "@/lib/formataDados";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Typography, Button, TextField, Paper, CircularProgress,
  Container, Divider
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function CadastroEntidade() {
  const router = useRouter();
  const params = useParams();
  const { empresaId } = useEmpresa();
  
  const idEntidade = params.id !== "novo" ? params.id : null;
  const [loading, setLoading] = useState(false);

  // Estados dos campos (Todos os solicitados anteriormente)
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [tipo, setTipo] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const carregarEntidade = useCallback(async () => {
    if (!idEntidade) return;
    setLoading(true);
    const { data } = await supabase.from("entidades").select("*").eq("id", idEntidade).single();
    if (data) {
      setNome(data.nome || "");
      setSigla(data.sigla || "");
      setTipo(data.tipo || "");
      setCep(formataDados(data.cep || "", "cep"));
      setEndereco(data.endereco || "");
      setNumero(data.numero || "");
      setBairro(data.bairro || "");
      setCidade(data.cidade || "");
      setUf(data.uf || "");
      setContatoNome(data.contato_nome || "");
      setTelefone(formataDados(data.telefone || "", "celular"));
    }
    setLoading(false);
  }, [idEntidade]);

  useEffect(() => { carregarEntidade(); }, [carregarEntidade]);

  const handleCepChange = async (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    if (apenasNumeros.length > 8) return;
    setCep(formataDados(apenasNumeros, "cep"));

    if (apenasNumeros.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${apenasNumeros}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setUf(data.uf || "");
        }
      } catch (err) { console.error("Erro CEP:", err); }
    }
  };

  const handleSalvar = async () => {
    if (!empresaId) return alert("Empresa não identificada.");
    setLoading(true);

    const payload = {
      empresa_id: empresaId,
      nome, sigla, tipo,
      cep: cep.replace(/\D/g, ""),
      endereco, numero, bairro, cidade, uf,
      contato_nome: contatoNome,
      telefone: telefone.replace(/\D/g, "")
    };

    const { error } = idEntidade 
      ? await supabase.from("entidades").update(payload).eq("id", idEntidade)
      : await supabase.from("entidades").insert([payload]);

    if (error) alert("Erro: " + error.message);
    else {
      alert("Registro salvo com sucesso!");
      router.push("/inicial_page/entidades");
    }
    setLoading(false);
  };

  if (loading && idEntidade) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 🚀 ESTILO PADRÃO DE BORDA: 4px sólida com cor definida */}
      <Paper 
        variant="outlined" 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          borderColor: "#cbd5e1", // Cor visível
          borderWidth: "4px",      // Espessura de 4px
          borderStyle: "solid",
          bgcolor: "#ffffff"
        }}
      >
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
                component="img"
                src="/icons/entidades.png"
                alt="Ícone Criadouro"
                sx={{ width: 96, height: 96, objectFit: 'contain' }}
            />
            <Typography variant="h5" fontWeight="900" color="#1e293b">
              {idEntidade ? "Editar Entidade" : "Nova Entidade"}
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.back()}
            sx={{ fontWeight: "bold", color: "#64748b", textTransform: 'none' }}
          >
            Voltar para a lista
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Dados Principais */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Nome da Entidade" sx={{ flex: 3 }} value={nome} onChange={(e) => setNome(e.target.value)} />
            <TextField label="Sigla" sx={{ flex: 1 }} value={sigla} onChange={(e) => setSigla(e.target.value)} />
            <TextField label="Tipo" sx={{ flex: 1 }} value={tipo} onChange={(e) => setTipo(e.target.value)} />
          </Box>

          <Divider sx={{ my: 1, fontWeight: 'bold' }}>📍 LOCALIZAÇÃO E ENDEREÇO</Divider>

          {/* Endereço Completo */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="CEP" sx={{ flex: 1 }} value={cep} onChange={(e) => handleCepChange(e.target.value)} />
            <TextField label="Endereço / Logradouro" sx={{ flex: 3 }} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            <TextField label="Número" sx={{ flex: 1 }} value={numero} onChange={(e) => setNumero(e.target.value)} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Bairro" sx={{ flex: 1 }} value={bairro} onChange={(e) => setBairro(e.target.value)} />
            <TextField label="Cidade" sx={{ flex: 2 }} value={cidade} onChange={(e) => setCidade(e.target.value)} />
            <TextField 
              label="UF" 
              sx={{ width: { sm: '100px' } }} 
              value={uf} 
              onChange={(e) => setUf(e.target.value.toUpperCase())} 
              inputProps={{ maxLength: 2 }} 
            />
          </Box>

          <Divider sx={{ my: 1, fontWeight: 'bold' }}>📞 DADOS DE CONTATO</Divider>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Nome do Responsável / Contato" sx={{ flex: 2 }} value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} />
            <TextField 
              label="Telefone / Celular" 
              sx={{ flex: 1 }} 
              value={telefone} 
              onChange={(e) => setTelefone(formataDados(e.target.value, "celular"))} 
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar} 
              sx={{ px: 8, py: 1.5, fontWeight: "900", bgcolor: "#1e293b", borderRadius: 2 }}
            >
              Salvar Registro
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}