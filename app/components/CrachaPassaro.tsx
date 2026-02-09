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

async function getAscendentes(passaroId: number, nivel: number = 3): Promise<any> {
  if (!passaroId || nivel === 0) return null;

  const { data } = await supabase
    .from("passaros")
    .select("id, nome, anilha, pai_id, mae_id, data_nascimento")
    .eq("id", passaroId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome,
    anilha: data.anilha,
    data_nascimento: data.data_nascimento,
    pai: await getAscendentes(data.pai_id, nivel - 1),
    mae: await getAscendentes(data.mae_id, nivel - 1),
  };
}

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
        fontSize: "0.7rem",
        pl: 1,
      }}
    >
      {filled.map((n, idx) => (
        <Box key={idx} sx={{ minHeight: "1.2em" }}>
          {n?.nome || ""}
        </Box>
      ))}
    </Box>
  );
}

export default function CrachaPassaro({ form }: { form: any }) {
  const [ascendentes, setAscendentes] = useState<any>(null);

  useEffect(() => {
    const atualizarArvore = async () => {
      const asc = {
        pai: form.pai_id ? await getAscendentes(form.pai_id) : null,
        mae: form.mae_id ? await getAscendentes(form.mae_id) : null,
      };
      setAscendentes(asc);
    };
    atualizarArvore();
  }, [form.pai_id, form.mae_id]);

  const col1: any[] = [
    ascendentes?.pai?.pai,
    ascendentes?.pai?.mae,
    ascendentes?.mae?.pai,
    ascendentes?.mae?.mae,
  ];

  const col2: any[] = [];
  col1.forEach((n) => {
    col2.push(n?.pai || null, n?.mae || null);
  });

  const col3: any[] = [];
  col2.forEach((n) => {
    col3.push(n?.pai || null, n?.mae || null);
  });

  return (
    <Box
      sx={{
        width: "9cm",
        height: "5.5cm",
        display: "flex",
        border: "1px solid #000",
        alignItems: "center",
        justifyContent: "flex-start", // alinhado à esquerda
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
            justifyContent: "center",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.75rem",
            p: 1,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: "2cm",
              height: "2cm",
              backgroundColor: "white",
              mb: 1,
              alignSelf: "center",
            }}
          >
            {/* Logo do criadouro */}
          </Box>

          {/* Dados principais alinhados à esquerda */}
          <div style={{ marginLeft: "4px" }}>{form.nome}</div>
          <div style={{ marginLeft: "4px" }}>{form.anilha}</div>
          <div style={{ marginLeft: "4px" }}>{formatDate(form.data_nascimento)}</div>
          <div style={{ marginLeft: "4px" }}>{form.pai_nome ? `Pai: ${form.pai_nome}` : ""}</div>
          <div style={{ marginLeft: "4px" }}>{form.mae_nome ? `Mãe: ${form.mae_nome}` : ""}</div>
        </Box>

        {/* Lado direito: colunas da árvore */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "row" }}>
          {renderColumn(col1, 4)}
          {renderColumn(col2, 8)}
          {renderColumn(col3, 16)}
        </Box>
      </Box>
    </Box>
  );
}