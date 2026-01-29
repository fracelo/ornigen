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

  // 🔹 Senha
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);

  const router = useRouter();

  const handleContinuar = () => {
    if (tipoPessoa !== "") {
      setContinuar(true);
    } else {
      alert("Selecione o tipo de pessoa antes de continuar.");
    }
  };

  const handleSalvar = async () => {
    // 🔹 Validações obrigatórias
    if (!razaoSocial) {
      alert("O campo Nome/Razão Social é obrigatório.");
      return;
    }
    if (!documento) {
      alert("O campo Documento (CPF/CNPJ) é obrigatório.");
      return;
    }
    if (!email) {
      alert("O campo E-mail é obrigatório.");
      return;
    }
    if (!senha || !confirmacaoSenha) {
      alert("Informe a senha e a confirmação da senha.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      alert("As senhas não coincidem.");
      return;
    }

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
        senha, //  ideal: salvar hash da senha
      },
    ]);

    if (error) {
      alert("Erro ao salvar empresa: " + error.message);
    } else {
      alert("Empresa cadastrada com sucesso!");
      router.push("/loginempresa"); // redireciona para tela de login
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2 className="login-title">Cadastro de Empresa</h2>

        {!continuar && (
          <FormControl component="fieldset" className="form-group">
            <FormLabel component="legend">Informe o tipo de Pessoa</FormLabel>
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
                  required
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="input"
                  required
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
                  required
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
                  onChange={(e) => setDocumento(e.target.value)}
                  className="input"
                  required
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
              required
            />
            <input
              type="text"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="input"
            />

            {/* Senha e confirmação */}
            <div style={{ position: "relative" }}>
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input"
                required
              />
              <span
                onClick={() => setShowSenha(!showSenha)}
                style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}
              >
                {showSenha ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showConfirmacao ? "text" : "password"}
                placeholder="Confirme a senha"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                className="input"
                required
              />
              <span
                onClick={() => setShowConfirmacao(!showConfirmacao)}
                style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}
              >
                {showConfirmacao ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>

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
                Salvar Empresa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//  Fim da página