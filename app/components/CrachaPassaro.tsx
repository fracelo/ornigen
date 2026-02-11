"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// 🔹 Busca genealogia direto da tabela genealogia
async function getGenealogia(passaroId: number, empresaId: string) {
  const { data, error } = await supabase
    .from("genealogia")
    .select(`
      lado,
      nivel,
      ascendente_id,
      passaros!genealogia_ascendente_id_fkey (
        id,
        nome,
        anilha,
        data_nascimento
      )
    `)
    .eq("passaro_id", passaroId)
    .eq("empresa_id", empresaId)
    .order("lado", { ascending: true })
    .order("nivel", { ascending: true });

  if (error) {
    console.error("Erro ao buscar genealogia:", error);
    return [];
  }

  return data;
}

// 🔹 Renderização de coluna com fonte adaptativa
function renderColumn(nodes: any[], expectedCount: number) {
  const filled = [...nodes];
  while (filled.length < expectedCount) {
    filled.push(null);
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "flex-start",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {filled.map((n, idx) => (
        <Box
          key={idx}
          sx={{
            minHeight: "1em",
            lineHeight: 1.1,
            fontSize: `${0.55 + idx * 0.05}rem`, // fonte cresce conforme nível
          }}
        >
          {n?.passaros?.nome || ""}
        </Box>
      ))}
    </Box>
  );
}

export default function CrachaPassaro({ form }: { form: any }) {
  const [genealogia, setGenealogia] = useState<any[]>([]);

  useEffect(() => {
    const atualizarArvore = async () => {
      if (form.id && form.empresa_id) {
        const asc = await getGenealogia(form.id, form.empresa_id);
        setGenealogia(asc);
      }
    };
    atualizarArvore();
  }, [form.id, form.empresa_id]);

  // 🔹 Separar colunas por nível
  const col1 = genealogia.filter((g) => g.nivel === 1);
  const col2 = genealogia.filter((g) => g.nivel === 2);
  const col3 = genealogia.filter((g) => g.nivel === 3);
  const col4 = genealogia.filter((g) => g.nivel === 4);

  return (
    <Box
      sx={{
        width: "9cm",
        height: "5.5cm",
        display: "flex",
        border: "1px solid #000",
        alignItems: "center",
        justifyContent: "flex-start",
        mx: "auto",
      }}
    >
      <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
        {/* Lado esquerdo: fundo azul */}
        <Box
          sx={{
            width: "3cm",
            height: "100%",
            backgroundColor: "darkblue",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.65rem",
            p: 0.5,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: "2cm",
              height: "2cm",
              backgroundColor: "white",
              mb: 0.5,
              alignSelf: "center",
            }}
          >
            {/* Logo do criadouro */}
          </Box>

          {/* Labels e dados principais */}
          <div style={{ fontSize: "0.55rem", marginBottom: "2px" }}>Nome</div>
          <div style={{ marginLeft: "4px", fontSize: "0.65rem" }}>{form.nome}</div>

          <div style={{ fontSize: "0.55rem", marginBottom: "2px" }}>Anilha</div>
          <div style={{ marginLeft: "4px", fontSize: "0.65rem" }}>{form.anilha}</div>

          <div style={{ marginLeft: "4px", fontSize: "0.65rem" }}>
            {formatDate(form.data_nascimento)}
          </div>

          <div style={{ marginLeft: "4px", fontSize: "0.6rem" }}>
            {form.especie_nome_portugues}
          </div>

          <div style={{ marginLeft: "4px", fontSize: "0.6rem" }}>
            {form.pai_nome ? `Pai: ${form.pai_nome}` : ""}
          </div>
          <div style={{ marginLeft: "4px", fontSize: "0.6rem" }}>
            {form.mae_nome ? `Mãe: ${form.mae_nome}` : ""}
          </div>
        </Box>

        {/* Lado direito: árvore genealógica */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "row" }}>
          {renderColumn(col1, 4)}
          {renderColumn(col2, 8)}
          {renderColumn(col3, 16)}
          {renderColumn(col4, 32)}
        </Box>
      </Box>
    </Box>
  );
}