"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
} from "@mui/material";
import { useEmpresa } from "../context/empresaContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditar = searchParams.get("editar") === "true";

  const { setEmpresaId } = useEmpresa();

  const [continuar, setContinuar] = useState(isEditar);

  // Estados
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | "">("");
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

  // Carregar dados no modo edição
  useEffect(() => {
    const carregarEmpresa = async () => {
      if (isEditar) {
        const empresaId = searchParams.get("id");
        if (empresaId) {
          const { data, error } = await supabase
            .from("empresas")
            .select("*")
            .eq("id", empresaId)
            .single();

          if (error) {
            alert("Erro ao carregar empresa: " + error.message);
            return;
          }

          if (data) {
            setTipoPessoa(data.tipo_pessoa);
            setRazaoSocial(data.razao_social);
            setNomeFantasia(data.nome_fantasia);
            setDocumento(data.documento);
            setCep(data.cep);
            setEndereco(data.endereco);
            setCidade(data.cidade);
            setEstado(data.estado);
            setResponsavelNome(data.responsavel_nome);
            setResponsavelCpf(data.responsavel_cpf);
            setEmail(data.email);
            setTelefone(data.telefone);
          }
        }
      }
    };

    carregarEmpresa();
  }, [isEditar, searchParams]);

  // Primeira etapa
  const handleSalvarPrimeiraEtapa = () => {
    if (!tipoPessoa) {
      alert("Selecione o tipo de pessoa.");
      return;
    }
    if (!documento) {
      alert("Informe o documento (CPF ou CNPJ).");
      return;
    }
    setContinuar(true);
  };

  // Etapa final
  const handleSalvarFinal = async () => {
    let nomeFantasiaFinal = nomeFantasia;
    let razaoSocialFinal = razaoSocial;

    if (tipoPessoa === "PF") {
      nomeFantasiaFinal = razaoSocial;
      razaoSocialFinal = razaoSocial;
    }

   let result;
if (isEditar) {
  const empresaId = searchParams.get("id");
  result = await supabase
    .from("empresas")
    .update({
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
    })
    .eq("id", empresaId)   // 🔹 garante que atualiza o registro existente
    .select("id")
    .single();
      } else {
        result = await supabase
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
            },
          ])
          .select("id")
          .single();
      }

    const { data, error } = result;

    if (error || !data) {
      alert("Erro ao salvar empresa: " + (error?.message ?? "sem dados"));
      return;
    }

    if (!isEditar) {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        alert("Usuário não autenticado");
        return;
      }

      const { error: vinculoError } = await supabase.from("empresa_usuarios").insert([
            {
              usuario_id: userData.user.id,
              empresa_id: data.id,
              papel: "owner",   // ✅ corrigido para usar 'papel'
            },
          ]);

      if (vinculoError) {
        alert("Erro ao vincular usuário à empresa: " + vinculoError.message);
        return;
      }

      setEmpresaId(data.id);
    }

    alert(isEditar ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!");
    router.push("/inicial_page");
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2 className="login-title">{isEditar ? "Editar Empresa" : "Cadastro de Empresa"}</h2>

        {/* Etapa inicial */}
        {!continuar && !isEditar && (
          <div className="form-group">
            <p className="etapa-msg">
              Para começar, selecione o tipo de pessoa e informe o documento (CPF ou CNPJ).
            </p>

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
              onChange={(e) => setDocumento(e.target.value)}
              className="input"
            />

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

            <div className="form-row">
              <input
                type="text"
                placeholder="CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Estado (UF)"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
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

            <div className="form-actions">
              {!isEditar && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setContinuar(false)}
                >
                  Voltar
                </Button>
              )}
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSalvarFinal}
              >
                {isEditar ? "Atualizar Empresa" : "Cadastrar Empresa"}
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}