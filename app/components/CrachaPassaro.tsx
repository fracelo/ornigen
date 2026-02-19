"use client";

import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// 🔹 Busca genealogia com alias para diferenciar os dois FKs
async function getGenealogia(passaroId: number, empresaId: string) {
  const { data, error } = await supabase
    .from("genealogia")
    .select(`
      lado,
      nivel,
      passaro:passaros!genealogia_passaro_id_fkey (
        id,
        nome,
        anilha,
        data_nascimento
      ),
      ascendente:passaros!genealogia_ascendente_id_fkey (
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

// 🔹 Renderização de coluna da árvore
function renderColumn(nodes: any[], expectedCount: number) {
  const filled = [...nodes];
  while (filled.length < expectedCount) filled.push(null);
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
            lineHeight: 1.2,
            fontSize: "0.55rem", // fonte reduzida (~8pt)
          }}
        >
          {n?.ascendente?.nome || ""}
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

  const col1 = genealogia.filter((g) => g.nivel === 1);
  const col2 = genealogia.filter((g) => g.nivel === 2);
  const col3 = genealogia.filter((g) => g.nivel === 3);
  const col4 = genealogia.filter((g) => g.nivel === 4);

  return (
    <Box
      sx={{
        width: "10cm",
        height: "6cm",
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
            width: "3cm", // 🔹 reduzido
            height: "100%",
            backgroundColor: "darkblue",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.55rem", // fonte reduzida (~8pt)
            p: 0.5,
            gap: 0.3, // espaçamento vertical compacto
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
              borderRadius: "4px",
            }}
          />

          {/* Dados principais com labels e valores em negrito */}
          <div>Nome: <strong>{form.nome}</strong></div>
          <div>Anilha: <strong>{form.anilha}</strong></div>
          <div>Nascimento: <strong>{formatDate(form.data_nascimento)}</strong></div>
          <div>Espécie: <strong>{form.especie_nome_portugues}</strong></div>
          <div>Mãe: <strong>{form.mae_nome || ""}</strong></div>
          <div>Pai: <strong>{form.pai_nome || ""}</strong></div>
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