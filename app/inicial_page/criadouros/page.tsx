"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  Paper,
  TableContainer,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function ListaCriadouros() {
  const [busca, setBusca] = useState("");
  const [classificacao, setClassificacao] = useState("todos");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    const { data, error } = await supabase.from("criadouros").select("*").order("razao_social");
    if (!error && data) {
      setRegistros(data);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter((r) => {
      const passTexto = (r.razao_social || "").toLowerCase().includes(busca.toLowerCase()) || 
                        (r.nome_fantasia || "").toLowerCase().includes(busca.toLowerCase());
      
      const passClassificacao = 
        classificacao === "todos" ||
        (classificacao === "tipo_criadouro" && r.tipo_criadouro) ||
        (classificacao === "tipo_cliente" && r.tipo_cliente) ||
        (classificacao === "tipo_fornecedor" && r.tipo_fornecedor) ||
        (classificacao === "tipo_funcionario" && r.tipo_funcionario) ||
        (classificacao === "tipo_socio" && r.tipo_socio) ||
        (classificacao === "tipo_entidade" && r.tipo_entidade) ||
        (classificacao === "tipo_outros" && r.tipo_outros);

      return passTexto && passClassificacao;
    });
  };

  const larguraTotalTabela = "1200px"; 

  // Função auxiliar para renderizar as etiquetas de classificação na linha
  const renderClassificacoes = (r: any) => {
    const labels = [];
    if (r.tipo_criadouro) labels.push({ text: "Criadouro", color: "#e2e8f0" });
    if (r.tipo_cliente) labels.push({ text: "Cliente", color: "#dcfce7" });
    if (r.tipo_fornecedor) labels.push({ text: "Fornecedor", color: "#fef9c3" });
    if (r.tipo_funcionario) labels.push({ text: "Func.", color: "#fee2e2" });
    if (r.tipo_socio) labels.push({ text: "Sócio", color: "#f3e8ff" });
    if (r.tipo_entidade) labels.push({ text: "Clube", color: "#dbeafe" });
    
    return (
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {labels.map((l, i) => (
          <Chip 
            key={i} 
            label={l.text} 
            size="small" 
            sx={{ 
              fontSize: '10px', 
              height: '18px', 
              fontWeight: 'bold',
              bgcolor: l.color,
              color: '#1e293b',
              border: '1px solid rgba(0,0,0,0.05)'
            }} 
          />
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ width: "100%", py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box
          component="img"
          src="/icons/contatos.png"
          alt="Ícone Contatos"
          sx={{ width: 64, height: 64, objectFit: 'contain' }}
        />
        <Typography variant="h4" sx={{ fontWeight: "900", color: "#1e293b" }}>
          Gestão de Contatos
        </Typography>
      </Box>

      <Box sx={{ 
        display: "flex", 
        alignItems: "center",
        gap: 2, 
        mb: 3, 
        width: "100%",
        maxWidth: larguraTotalTabela, 
      }}>
        
        <TextField
          placeholder="Pesquisar por nome ou razão social..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "#fff", borderRadius: 1, flex: 2 }}
        />

        <FormControl size="small" sx={{ minWidth: 200, bgcolor: "#fff" }}>
          <InputLabel id="label-classificacao">Classificação</InputLabel>
          <Select
            labelId="label-classificacao"
            value={classificacao}
            label="Classificação"
            onChange={(e) => setClassificacao(e.target.value)}
            startAdornment={<InputAdornment position="start"><FilterListIcon sx={{ fontSize: 20 }} /></InputAdornment>}
          >
            <MenuItem value="todos">Todos os Contatos</MenuItem>
            <MenuItem value="tipo_criadouro">Criadouros</MenuItem>
            <MenuItem value="tipo_cliente">Clientes</MenuItem>
            <MenuItem value="tipo_fornecedor">Fornecedores</MenuItem>
            <MenuItem value="tipo_funcionario">Funcionários</MenuItem>
            <MenuItem value="tipo_socio">Sócios</MenuItem>
            <MenuItem value="tipo_entidade">Clubes / Associações</MenuItem>
            <MenuItem value="tipo_outros">Outros</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/inicial_page/criadouros/novo")}
          sx={{ 
            minWidth: 180, 
            bgcolor: "#1e293b", 
            fontWeight: "bold", 
            borderRadius: 1.5,
            textTransform: 'none',
            height: "40px",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "#334155" }
          }}
        >
          Novo Contato
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 3,
          width: "100%",
          maxWidth: larguraTotalTabela, 
          overflow: "hidden"
        }}
      >
        <Table sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              {/* 🔹 NOVA COLUNA DE CLASSIFICAÇÃO */}
              <TableCell sx={{ fontWeight: "900", width: "180px", color: "#475569" }}>Classificação</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "420px", color: "#475569" }}>Razão Social / Nome</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "300px", color: "#475569" }}>Cidade</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "60px", color: "#475569" }} align="center">UF</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "240px", color: "#475569" }}>Documento / Registro</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrarRegistros().map((r, index) => (
              <TableRow
                key={r.id}
                hover
                onClick={() => router.push(`/inicial_page/criadouros/${r.id}`)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc",
                  "&:hover": { backgroundColor: "#f1f5f9 !important" }
                }}
              >
                {/* 🔹 RENDERIZAÇÃO DAS TAGS */}
                <TableCell>
                  {renderClassificacoes(r)}
                </TableCell>

                <TableCell sx={{ fontWeight: "600", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.razao_social || r.nome_fantasia}
                </TableCell>

                <TableCell sx={{ color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.cidade}
                </TableCell>

                <TableCell align="center" sx={{ color: "#64748b", fontWeight: "bold" }}>
                  {r.estado}
                </TableCell>

                <TableCell sx={{ color: "#64748b", fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {r.documento || r.registro_sispass || "---"}
                </TableCell>
              </TableRow>
            ))}
            {filtrarRegistros().length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                  Nenhum registro localizado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}