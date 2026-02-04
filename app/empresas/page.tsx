"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import { useEmpresa } from "../context/empresaContext";
import { formataDados } from "../lib/formataDados";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const { empresaId, setEmpresaId } = useEmpresa();

  const isEditar = !!empresaId;
  const [continuar, setContinuar] = useState(isEditar);

  // Estados
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ" | "">("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [documento, setDocumento] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Carregar dados no modo edição
  useEffect(() => {
    const carregarEmpresa = async () => {
      if (isEditar && empresaId) {
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
          setNumero(data.numero ?? "");
          setBairro(data.bairro ?? "");
          setCidade(data.cidade);
          setEstado(data.estado);
          setResponsavelNome(data.responsavel_nome);
          setResponsavelCpf(data.responsavel_cpf);
          setEmail(data.email);
          setTelefone(data.telefone);
        }
      }
    };

    carregarEmpresa();
  }, [isEditar, empresaId]);

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
    if (isEditar && empresaId) {
      result = await supabase
        .from("empresas")
        .update({
          tipo_pessoa: tipoPessoa,
          nome_fantasia: nomeFantasiaFinal,
          razao_social: razaoSocialFinal,
          documento,
          cep,
          endereco,
          numero,
          bairro,
          cidade,
          estado,
          responsavel_nome: responsavelNome,
          responsavel_cpf: responsavelCpf,
          email,
          telefone,
        })
        .eq("id", empresaId)
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
            numero,
            bairro,
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
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        alert("Usuário não autenticado");
        return;
      }

      const { error: vinculoError } = await supabase.from("empresa_usuarios").insert([
        {
          usuario_id: userData.user.id,
          empresa_id: data.id,
          papel: "owner",
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
    <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "700px", background: "#fff", padding: "20px", borderRadius: "8px" }}>
        <h2 style={{ color: "#0d47a1", marginBottom: "20px" }}>
          {isEditar ? "Editar Empresa" : "Cadastro de Empresa"}
        </h2>

        {/* Etapa inicial */}
        {!continuar && !isEditar && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <p>Selecione o tipo de pessoa e informe o documento.</p>

            <div>
              <label>Tipo de Pessoa</label>
              <div style={{ display: "flex", gap: "20px" }}>
                <label>
                  <input
                    type="radio"
                    value="PF"
                    checked={tipoPessoa === "PF"}
                    onChange={() => setTipoPessoa("PF")}
                  />
                  Pessoa Física
                </label>
                <label>
                  <input
                    type="radio"
                    value="PJ"
                    checked={tipoPessoa === "PJ"}
                    onChange={() => setTipoPessoa("PJ")}
                  />
                  Pessoa Jurídica
                </label>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>{tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
              <input
                type="text"
                value={formataDados(documento, tipoPessoa === "PJ" ? "cnpj" : "cpf")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumento(e.target.value)}
              />
            </div>

            <Button variant="contained" color="primary" onClick={handleSalvarPrimeiraEtapa}>
              Salvar e Continuar
            </Button>
          </div>
        )}

        {/* Etapa final */}
        {(continuar || isEditar) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>Nome / Razão Social</label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRazaoSocial(e.target.value)}
              />
            </div>

            {tipoPessoa === "PJ" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label>Nome Fantasia</label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeFantasia(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>{tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
              <input
                type="text"
                value={formataDados(documento, tipoPessoa === "PJ" ? "cnpj" : "cpf")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumento(e.target.value)}
              />
            </div>

                      <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: "0 0 120px", display: "flex", flexDirection: "column" }}>
                <label>CEP</label>
                <input
                  type="text"
                  value={formataDados(cep, "cep")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCep(e.target.value)}
                />
              </div>

              <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                <label>Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCidade(e.target.value)}
                />
              </div>

              <div style={{ flex: "0 0 60px", display: "flex", flexDirection: "column" }}>
                <label>UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={estado}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEstado(e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>

            {/* Endereço + Número + Bairro */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: "2", display: "flex", flexDirection: "column" }}>
                <label>Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndereco(e.target.value)}
                />
              </div>

              <div style={{ flex: "0 0 80px", display: "flex", flexDirection: "column" }}>
                <label>Número</label>
                <input
                  type="text"
                  maxLength={8}
                  value={numero}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumero(e.target.value)}
                />
              </div>

              <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                <label>Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBairro(e.target.value)}
                />
              </div>
            </div>

            {/* Responsável Nome + CPF */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                <label>Responsável Nome</label>
                <input
                  type="text"
                  value={responsavelNome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResponsavelNome(e.target.value)
                  }
                />
              </div>

              <div style={{ flex: "0 0 200px", display: "flex", flexDirection: "column" }}>
                <label>Responsável CPF</label>
                <input
                  type="text"
                  value={formataDados(responsavelCpf, "cpf")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResponsavelCpf(e.target.value)
                  }
                />
              </div>
            </div>

            {/* Email + Celular */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: "2", display: "flex", flexDirection: "column" }}>
                <label>E-mail</label>
                <input
                  type="email"
                  value={formataDados(email, "email")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                <label>Celular</label>
                <input
                  type="text"
                  value={formataDados(telefone, "celular")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelefone(e.target.value)}
                />
              </div>
            </div>

            {/* Botões */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              {!isEditar && (
                <Button variant="outlined" color="secondary" onClick={() => setContinuar(false)}>
                  Voltar
                </Button>
              )}
              <Button variant="contained" color="primary" onClick={handleSalvarFinal}>
                {isEditar ? "Atualizar Empresa" : "Cadastrar Empresa"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}