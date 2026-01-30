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
import { Visibility, VisibilityOff } from "@mui/icons-material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmpresasPage() {
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

  // Senha
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);

  const [loadingCEP, setLoadingCEP] = useState(false);

  const router = useRouter();

  // 🔹 Máscara CPF
  const formatCPF = (value: string) =>
    value.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  // 🔹 Máscara CNPJ
  const formatCNPJ = (value: string) =>
    value.replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);

  // 🔹 Máscara CEP (xxxxx-xxx)
  const formatCEP = (value: string) =>
    value.replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);

  // 🔹 Máscara Telefone
  const formatTelefone = (value: string) => {
    const onlyNums = value.replace(/\D/g, "");
    if (onlyNums.length === 11) {
      return onlyNums.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "$1 $2 $3 $4");
    } else if (onlyNums.length === 10) {
      return onlyNums.replace(/(\d{2})(\d{4})(\d{4})/, "$1 $2 $3");
    }
    return onlyNums;
  };

  // 🔹 Consulta ViaCEP
  const handleCEPChange = async (value: string) => {
    const cepNumerico = value.replace(/\D/g, "");
    setCep(formatCEP(value));

    if (cepNumerico.length === 8) {
      setLoadingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        } else {
          alert("CEP não encontrado.");
        }
      } catch (error) {
        alert("Erro ao consultar CEP.");
      } finally {
        setLoadingCEP(false);
      }
    }
  };

  const handleSalvarPrimeiraEtapa = () => {
    if (!tipoPessoa) {
      alert("Selecione o tipo de pessoa.");
      return;
    }
    if (!documento) {
      alert("Informe o documento (CPF ou CNPJ).");
      return;
    }
    if (!senha || !confirmacaoSenha) {
      alert("Informe a senha e a confirmação.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      alert("As senhas não coincidem.");
      return;
    }
    setContinuar(true);
  };

  const handleSalvarFinal = async () => {
    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

    const { error } = await supabase.from("empresas").insert([
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
        senha,
      },
    ]);

    if (error) {
      alert("Erro ao salvar empresa: " + error.message);
    } else {
      alert("Empresa cadastrada com sucesso!");
      router.push("/loginempresas");
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2 className="login-title">Cadastro de Empresa</h2>

        {/* Etapa inicial */}
        {!continuar && (
          <div className="form-group">
            <FormControl component="fieldset">
              <FormLabel>Tipo de Pessoa</FormLabel>
              <RadioGroup
                value={tipoPessoa}
                onChange={(e) => setTipoPessoa(e.target.value as "PF" | "PJ")}
              >
                <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física" />
                <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica" />
              </RadioGroup>
            </FormControl>

            <input
              type="text"
              placeholder={tipoPessoa === "PJ" ? "CNPJ" : "CPF"}
              value={documento}
              onChange={(e) =>
                setDocumento(
                  tipoPessoa === "PJ"
                    ? formatCNPJ(e.target.value)
                    : formatCPF(e.target.value)
                )
              }
              className="input"
            />

            {/* Senha */}
            <div style={{ position: "relative" }}>
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input"
              />
              <span
                onClick={() => setShowSenha(!showSenha)}
                style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}
              >
                {showSenha ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>

            {/* Confirmação */}
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmacao ? "text" : "password"}
                placeholder="Confirme a senha"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                className="input"
              />
              <span
                onClick={() => setShowConfirmacao(!showConfirmacao)}
                style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}
              >
                {showConfirmacao ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSalvarPrimeiraEtapa}
              sx={{ mt: 2 }}
            >
              Salvar e Continuar
            </Button>
          </div>
        )}

        {/* Etapa final */}
        {continuar && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Razão Social / Nome"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="input"
            />
            {tipoPessoa === "PJ" && (
              <input
                type="text"
                placeholder="Nome Fantasia"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="input"
              />
            )}

                        {/* CEP + Estado */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                placeholder="CEP"
                value={cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                className="input"
                style={{ flex: 1, maxWidth: "120px" }}
                maxLength={9}
              />
              {loadingCEP && <span>Consultando CEP...</span>}
              <input
                type="text"
                placeholder="UF"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                className="input"
                style={{ flex: 1, maxWidth: "60px" }}
                maxLength={2}
              />
            </div>

            {/* Endereço + Cidade */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Endereço"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="input"
                style={{ flex: 2 }}
              />
              <input
                type="text"
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
            </div>

            {/* Responsável Nome + CPF */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Responsável Nome"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="input"
                style={{ flex: 2 }}
              />
              <input
                type="text"
                placeholder="Responsável CPF"
                value={responsavelCpf}
                onChange={(e) => setResponsavelCpf(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
            </div>

            {/* E-mail */}
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              style={{ maxWidth: "300px" }}
            />

            {/* Telefone */}
            <input
              type="text"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              className="input"
              style={{ maxWidth: "200px" }}
              inputMode="numeric"
              pattern="[0-9]*"
            />

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
                onClick={handleSalvarFinal}
              >
                Salvar Empresa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}