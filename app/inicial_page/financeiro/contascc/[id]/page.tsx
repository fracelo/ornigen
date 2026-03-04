"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  MenuItem, Stack 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formataDados } from "@/lib/formataDados";

export default function FormContaCorrente() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [form, setForm] = useState({
    nome_conta: "",
    tipo: "B", // B ou C
    banco: "",
    agencia: "",
    conta_numero: "",
    saldo_inicial: "0",
    limite: "0",
  });

  useEffect(() => {
    if (!isNovo && empresaId) {
      const load = async () => {
        const { data } = await supabase.from("contascorrente").select("*").eq("id", id).single();
        if (data) {
          setForm({
            ...data,
            saldo_inicial: String(Math.round(data.saldo_inicial * 100)),
            limite: String(Math.round(data.limite * 100)),
          });
        }
      };
      load();
    }
  }, [id, isNovo, empresaId]);

  const handleSalvar = async () => {
    const payload = { 
      ...form, 
      empresa_id: empresaId,
      saldo_inicial: parseFloat(form.saldo_inicial || "0") / 100,
      limite: parseFloat(form.limite || "0") / 100
    };
    
    if (form.tipo === 'C') {
      payload.banco = "";
      payload.agencia = "";
      payload.limite = 0;
      payload.conta_numero = "";
    }

    const { error } = isNovo 
      ? await supabase.from("contascorrente").insert([payload])
      : await supabase.from("contascorrente").update(payload).eq("id", id);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Conta salva com sucesso!");
      router.push("/inicial_page/financeiro/contas");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Box de cor visível envolvendo o cadastro conforme padrão OrniGen */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          borderColor: "#cbd5e1", 
          borderWidth: "4px", 
          borderStyle: "solid",
          bgcolor: "#ffffff"
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="900" color="#1e293b">
              {isNovo ? "Nova Conta" : "Editar Conta"}
            </Typography>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.back()}
              sx={{ color: "#64748b", fontWeight: "bold" }}
            >
              Voltar
            </Button>
          </Box>

          <TextField
            select
            label="Tipo de Conta"
            fullWidth
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <MenuItem value="B">Banco (Conta Corrente/Poupança)</MenuItem>
            <MenuItem value="C">Caixa (Dinheiro Vivo/Interno)</MenuItem>
          </TextField>

          <TextField 
            label="Nome da Conta (Apelido)" 
            fullWidth 
            value={form.nome_conta}
            onChange={(e) => setForm({ ...form, nome_conta: e.target.value })}
            placeholder="Ex: Itaú Criador ou Cofre"
          />

          {form.tipo === 'B' && (
            <>
              {/* Banco em linha sozinha */}
              <TextField 
                label="Nome do Banco" 
                fullWidth 
                value={form.banco} 
                onChange={(e) => setForm({...form, banco: e.target.value})} 
              />
              
              {/* Agência e Número na mesma linha */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  label="Agência" 
                  fullWidth 
                  value={form.agencia} 
                  onChange={(e) => setForm({...form, agencia: e.target.value})} 
                />
                <TextField 
                  label="Número da Conta" 
                  fullWidth 
                  value={form.conta_numero} 
                  onChange={(e) => setForm({...form, conta_numero: e.target.value})} 
                />
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Saldo Inicial" 
              fullWidth
              value={formataDados(form.saldo_inicial, "moeda")}
              // Alinhamento à direita para valores financeiros
              inputProps={{ style: { textAlign: 'right' } }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setForm({ ...form, saldo_inicial: val });
              }}
            />
            
            {form.tipo === 'B' && (
              <TextField 
                label="Limite" 
                fullWidth
                value={formataDados(form.limite, "moeda")}
                // Alinhamento à direita para valores financeiros
                inputProps={{ style: { textAlign: 'right' } }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, limite: val });
                }}
              />
            )}
          </Box>

          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={handleSalvar}
            sx={{ 
              bgcolor: "#1e293b", 
              py: 1.5, 
              fontWeight: "900",
              borderRadius: 2,
              "&:hover": { bgcolor: "#334155" } 
            }}
          >
            Gravar Dados da Conta
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}