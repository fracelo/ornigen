"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
} from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CriadourosPage() {
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | "">("");
  const [continuar, setContinuar] = useState(false);

  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
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

  const router = useRouter();

  // 🔹 Máscara CPF
  const formatCPF = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  // 🔹 Máscara CNPJ
  const formatCNPJ = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);

  const handleContinuar = () => {
    if (tipoPessoa !== "") {
      setContinuar(true);
    } else {
      alert("Selecione o tipo de pessoa antes de continuar.");
    }
  };

  const handleSalvar = async () => {
    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

    const { error } = await supabase.from("criadouros").insert([
      {
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
      },
    ]);

    if (error) {
      alert("Erro ao salvar criadouro: " + error.message);
    } else {
      alert("Criadouro cadastrado com sucesso!");
      router.push("/inicial_page");
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2 className="login-title">Cadastro de Criadouro</h2>

        {!continuar && (
          <FormControl component="fieldset" className="form-group">
            <FormLabel component="legend">
              Informe o tipo de Pessoa do Criadouro
            </FormLabel>
            <RadioGroup
              value={tipoPessoa}
              onChange={(e) => setTipoPessoa(e.target.value as "PF" | "PJ")}
            >
              <FormControlLabel
                value="PF"
                control={<Radio />}
                label="Pessoa Física"
              />
              <FormControlLabel
                value="PJ"
                control={<Radio />}
                label="Pessoa Jurídica"
              />
            </RadioGroup>

            <Button
              variant="contained"
              color="primary"
              onClick={handleContinuar}
              sx={{ mt: 2 }}
            >
              Continuar
            </Button>
          </FormControl>
        )}

        {continuar && (
          <div className="form-group">
            {tipoPessoa === "PF" && (
              <>
                <input
                  type="text"
                  placeholder="Nome"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={documento}
                  onChange={(e) => setDocumento(formatCPF(e.target.value))}
                  className="input"
                />
              </>
            )}

            {tipoPessoa === "PJ" && (
              <>
                <input
                  type="text"
                  placeholder="Razão Social"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Nome Fantasia"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="CNPJ"
                  value={documento}
                  onChange={(e) => setDocumento(formatCNPJ(e.target.value))}
                  className="input"
                />
              </>
            )}

            {/* Campos comuns */}
            <input
              type="text"
              placeholder="CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Estado (UF)"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Responsável Nome"
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Responsável CPF"
              value={responsavelCpf}
              onChange={(e) => setResponsavelCpf(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="input"
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={eProprio}
                onChange={(e) => setEProprio(e.target.checked)}
              />
              É próprio
            </label>

            <div className="form-actions">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setContinuar(false)}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSalvar}
              >
                Salvar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}