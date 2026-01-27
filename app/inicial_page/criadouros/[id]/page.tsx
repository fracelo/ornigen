"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Box, Button, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, Typography
} from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditarCriadouro() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

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

  // 🔹 Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      const { data, error } = await supabase
        .from("criadouros")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("Erro ao carregar criadouro: " + error.message);
      } else if (data) {
        setTipoPessoa(data.tipo_pessoa as "PF" | "PJ");
        setRazaoSocial(data.razao_social || "");
        setNomeFantasia(data.nome_fantasia || "");
        setDocumento(data.documento || "");
        setCep(data.cep || "");
        setEndereco(data.endereco || "");
        setCidade(data.cidade || "");
        setEstado(data.estado || "");
        setResponsavelNome(data.responsavel_nome || "");
        setResponsavelCpf(data.responsavel_cpf || "");
        setEmail(data.email || "");
        setTelefone(data.telefone || "");
        setEProprio(data.e_proprio || false);
      }
    };

    if (!isNaN(id)) carregarDados();
  }, [id]);

  // 🔹 Máscaras
  const formatCPF = (v: string) => v.replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);

  const formatCNPJ = (v: string) => v.replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    .slice(0, 18);

  // 🔹 Salvar alterações
  const handleSalvar = async () => {
    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

    const { error } = await supabase
      .from("criadouros")
      .update({
        tipo_pessoa: tipoPessoa,
        nome_fantasia: nomeFantasiaFinal,
        razao_social: razaoSocialFinal,
        documento, cep, endereco, cidade, estado,
        responsavel_nome: responsavelNome,
        responsavel_cpf: responsavelCpf,
        email, telefone, e_proprio: eProprio,
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert("Criadouro atualizado com sucesso!");
      router.push("/inicial_page/criadouros");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#0D47A1", fontWeight: "bold" }}>
        Editar Criadouro
      </Typography>

      {/* Tipo de Pessoa */}
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel>Tipo de Pessoa</FormLabel>
        <RadioGroup
          value={tipoPessoa}
          onChange={(e) => setTipoPessoa(e.target.value as "PF" | "PJ")}
          row
        >
          <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física" />
          <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica" />
        </RadioGroup>
      </FormControl>

      {/* Campos dinâmicos */}
      {tipoPessoa === "PF" && (
        <>
          <TextField label="Nome" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="CPF" value={documento} onChange={(e) => setDocumento(formatCPF(e.target.value))} sx={{ width: { xs: "100%", sm: "50%" }, mb: 2 }} />
        </>
      )}

      {tipoPessoa === "PJ" && (
        <>
          <TextField label="Razão Social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Nome Fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="CNPJ" value={documento} onChange={(e) => setDocumento(formatCNPJ(e.target.value))} sx={{ width: { xs: "100%", sm: "50%" }, mb: 2 }} />
        </>
      )}

      {/* Linha com CEP, Estado e Cidade */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField label="CEP" value={cep} onChange={(e) => setCep(e.target.value)} sx={{ width: "30%" }} />
        <TextField label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ width: "20%" }} />
        <TextField label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} sx={{ flex: 1 }} />
      </Box>

      <TextField label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} fullWidth sx={{ mb: 2 }} />

      {/* Linha com Responsável Nome e CPF */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField label="Responsável Nome" value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} sx={{ flex: 1 }} />
        <TextField label="Responsável CPF" value={responsavelCpf} onChange={(e) => setResponsavelCpf(e.target.value)} sx={{ flex: 1 }} />
      </Box>

      {/* Linha com Email e Telefone */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ flex: 1 }} />
        <TextField label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} sx={{ flex: 1 }} />
      </Box>

      <FormControlLabel
        control={<Checkbox checked={eProprio} onChange={(e) => setEProprio(e.target.checked)} />}
        label="É próprio"
        sx={{ mb: 2 }}
      />

 {/* Botões */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push("/inicial_page/criadouros")}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSalvar}
        >
          Salvar
        </Button>
      </Box>

    </Box>    /* fecha o Box principal */
  );          // fecha o return
}             // fecha a função
