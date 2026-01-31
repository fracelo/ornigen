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

import { useSearchParams } from "next/navigation";

export default function CadastroEmpresaPage() {
  const searchParams = useSearchParams();
  const isNovo = searchParams.get("novo") === "true";

  // Se veio do link de login, já começa no fluxo de nova empresa
  const [continuar, setContinuar] = useState(isNovo);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CadastroEmpresaPage() {
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

  // Senha
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);

  const router = useRouter();

  const formatCPF = (value: string) =>
    value.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  const formatCNPJ = (value: string) =>
    value.replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);

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
    // Se passou nas validações, libera os outros campos
    setContinuar(true);
  };

  const handleSalvarFinal = async () => {
    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

    const handleSalvarFinal = async () => {
  let nomeFantasiaFinal = nomeFantasia;
  let razaoSocialFinal = razaoSocial;

  if (tipoPessoa === "PF") {
    nomeFantasiaFinal = razaoSocial;
    razaoSocialFinal = razaoSocial;
  }

  const { data, error } = await supabase
    .from("empresas")
    .insert([
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
    ])
    .select("id") // pega o id da empresa criada
    .single();

  if (error) {
    alert("Erro ao salvar empresa: " + error.message);
  } else {
    alert("Empresa cadastrada com sucesso!");
    // 🔹 Redireciona para cadastro de usuário com empresaId
    router.push(`/usuarios?empresaId=${data.id}`);
  }
};


  return (
    <div className="login-container">
      <div className="card login-card">
        <h2 className="login-title">Cadastro de Empresa</h2>

        {/* Etapa inicial: tipo de pessoa + documento + senha */}
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

        {/* Etapa final: outros campos */}
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

            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                placeholder="CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Estado (UF)"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
            </div>

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
