"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import { useEmpresa } from "../../context/empresaContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ListaPassaros() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();
  const { empresaId } = useEmpresa();

  useEffect(() => {
    if (empresaId) {
      carregarRegistros();
    }
  }, [empresaId]);

  const carregarRegistros = async () => {
     // 🔹 1ª chamada: recalcula genealogia geral
    await supabase.rpc("atualizar_genealogia_empresa", { empresa_uuid: empresaId });

    // 1ª query: pássaros da empresa
    const { data: passaros, error } = await supabase
      .from("passaros")
      .select(`
        id,
        nome,
        anilha,
        sexo,
        especie_id,
        origem_id,
        pai_id,
        mae_id
      `)
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (error) {
      console.log("Erro ao carregar pássaros:", JSON.stringify(error, null, 2));
      return;
    }

    // 2ª query: todos os nomes de pássaros
    const { data: todos, error: err2 } = await supabase
      .from("passaros")
      .select("id, nome");

    if (err2) {
      console.log("Erro ao carregar nomes:", JSON.stringify(err2, null, 2));
      setRegistros(passaros || []);
      return;
    }

    // mapa id → nome
    const mapaNomes: Record<number, string> = {};
    todos?.forEach((p) => {
      mapaNomes[p.id] = p.nome;
    });

    // substitui ids por nomes
    const registrosComNomes = passaros?.map((p) => ({
      ...p,
      pai_nome: p.pai_id ? mapaNomes[p.pai_id] : null,
      mae_nome: p.mae_id ? mapaNomes[p.mae_id] : null,
    }));

    setRegistros(registrosComNomes || []);
  };

  const filtrarRegistros = () => {
    return registros.filter(
      (r) =>
        r.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        r.anilha?.toLowerCase().includes(busca.toLowerCase())
    );
  };

  const editarRegistro = (id: number) => {
    router.push(`/inicial_page/passaros/${id}`);
  };

  const novoRegistro = () => {
    router.push("/inicial_page/passaros/novo");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          color: "#0D47A1",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Lista de Pássaros
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por Nome, Anilha ou Espécie"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ width: "600px" }} // 🔹 campo maior
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={novoRegistro}
          sx={{ minWidth: 180, height: 40 }}
        >
          Novo
        </Button>
        <Button
          variant="contained" // 🔹 igual ao botão Novo
          color="primary"
          size="large"
          onClick={listarCrachas}
          sx={{ minWidth: 180, height: 40 }}
        >
          Listar Crachás
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#1976d2" }}>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Nome</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Pai</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Mãe</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Anilha</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Sexo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtrarRegistros().map((r, index) => (
            <TableRow
              key={r.id}
              hover
              onClick={() => editarRegistro(r.id)}
              sx={{
                cursor: "pointer",
                backgroundColor: index % 2 === 0 ? "#e3f2fd" : "#90caf9",
                "& td": { borderBottom: "1px solid #000" },
              }}
            >
              <TableCell>{r.nome}</TableCell>
              <TableCell>{r.pai_nome || "-"}</TableCell>
              <TableCell>{r.mae_nome || "-"}</TableCell>
              <TableCell>{r.anilha}</TableCell>
              <TableCell>{r.sexo}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}