"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Box, Button, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, Typography
} from "@mui/material";
import { useEmpresa } from "../../../context/empresaContext"; // 🔹 caminho ajustado

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NovoCriadouro() {
  const router = useRouter();
  const { empresaId } = useEmpresa(); // 🔹 pega o UUID da empresa logada

  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | "">("");
  const [continuar, setContinuar] = useState(false);
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

  const handleSalvar = async () => {
    if (!empresaId) {
      alert("Nenhuma empresa selecionada no contexto. Faça login novamente.");
      return;
    }

    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

    const { error } = await supabase.from("criadouros").insert([{
      tipo_pessoa: tipoPessoa,
      nome_fantasia: nomeFantasiaFinal,
      razao_social: razaoSocialFinal,
      documento,
      cep,
      endereco,
      cidade,
      estado,
      responsavel_nome: responsavelNome,
      responsavel_cpf: responsavelCpf,
      email,
      telefone,
      e_proprio: eProprio,
      empresa_uuid: empresaId, // 🔹 salva o UUID da empresa logada
    }]);

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      alert("Criadouro cadastrado com sucesso!");
      router.push("/inicial_page/criadouros");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#0D47A1", fontWeight: "bold", textAlign: "center" }}>
        Novo Criadouro
      </Typography>

      {!continuar && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <FormControl>
            <FormLabel sx={{ textAlign: "center", mb: 2 }}>Tipo de Pessoa</FormLabel>
            <RadioGroup
              value={tipoPessoa}
              onChange={(e) => setTipoPessoa(e.target.value as "PF" | "PJ")}
              row
              sx={{ justifyContent: "center" }}
            >
              <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física" />
              <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica" />
            </RadioGroup>
            <Button
              variant="contained"
              sx={{ mt: 3, alignSelf: "center" }}
              onClick={() => tipoPessoa ? setContinuar(true) : alert("Selecione PF ou PJ")}
            >
              Continuar
            </Button>
          </FormControl>
        </Box>
      )}

      {continuar && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
          {tipoPessoa === "PF" && (
            <>
              <TextField label="Nome" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} fullWidth />
              <TextField label="CPF" value={documento} onChange={(e) => setDocumento(formatCPF(e.target.value))} sx={{ width: { xs: "100%", sm: "50%" } }} />
            </>
          )}
          {tipoPessoa === "PJ" && (
            <>
              <TextField label="Razão Social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} fullWidth />
              <TextField label="Nome Fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} fullWidth />
              <TextField label="CNPJ" value={documento} onChange={(e) => setDocumento(formatCNPJ(e.target.value))} sx={{ width: { xs: "100%", sm: "50%" } }} />
            </>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="CEP" value={cep} onChange={(e) => setCep(e.target.value)} sx={{ width: "30%" }} />
            <TextField label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ width: "20%" }} />
            <TextField label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} sx={{ flex: 1 }} />
          </Box>

          <TextField label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} fullWidth />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Responsável Nome" value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} sx={{ flex: 1 }} />
            <TextField label="Responsável CPF" value={responsavelCpf} onChange={(e) => setResponsavelCpf(e.target.value)} sx={{ flex: 1 }} />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ flex: 1 }} />
            <TextField label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} sx={{ flex: 1 }} />
          </Box>

          <FormControlLabel control={<Checkbox checked={eProprio} onChange={(e) => setEProprio(e.target.checked)} />} label="É próprio" />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={() => router.push("/inicial_page/criadouros")}>
              Cancelar
            </Button>
            <Button variant="contained" color="primary" onClick={handleSalvar}>
              Salvar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}