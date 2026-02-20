"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Box, CircularProgress, Button, Typography, Paper } from "@mui/material";
import CrachaPassaro from "@/components/CrachaPassaro";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/context/authContext";

function ImprimirContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get("ids")?.split(",") || [];
  
  const { usuarioLogado, carregando } = useAuth();
  
  const [passaros, setPassaros] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [debugMsg, setDebugMsg] = useState("Iniciando...");

  useEffect(() => {
    const carregarDados = async () => {
      // Monitoramento via estado para você ver na tela o que está rolando
      if (carregando) {
        setDebugMsg("Aguardando autenticação...");
        return;
      }

      if (!usuarioLogado) {
        setDebugMsg("Não logado! Redirecionando...");
        router.push("/login");
        return;
      }

      if (ids.length === 0 || ids[0] === "") {
        setDebugMsg("Nenhum ID de pássaro recebido na URL.");
        setLoadingDados(false);
        return;
      }

      setDebugMsg(`Buscando ${ids.length} pássaros no banco...`);

      const { data, error } = await supabase
        .from("passaros")
        .select(`
          *, 
          especies_sispass:especie_id(nomes_comuns),
          criadouros:origem_id(nome_fantasia, razao_social)
        `)
        .in("id", ids);

      if (error) {
        console.error("Erro Supabase:", error);
        setDebugMsg("Erro no banco: " + error.message);
        setLoadingDados(false);
        return;
      }

      if (!data || data.length === 0) {
        setDebugMsg("O banco não retornou nenhum registro para esses IDs.");
      } else {
        const formatados = data.map(p => ({
          ...p,
          especie_nome: p.especies_sispass?.nomes_comuns?.[0] || "Não informada",
          origem_nome: p.criadouros?.nome_fantasia || p.criadouros?.razao_social || "Própria"
        }));
        setPassaros(formatados);
        setDebugMsg("Sucesso! Renderizando...");
      }
      setLoadingDados(false);
    };

    carregarDados();
  }, [carregando, usuarioLogado, ids, router]);

  // Tela de Loading com Debug
  if (carregando || loadingDados) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="h6">{debugMsg}</Typography>
        <Typography variant="caption">IDs: {ids.join(", ")}</Typography>
      </Box>
    );
  }

  // Se não houver pássaros após o loading
  if (passaros.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h5" color="error">Ops! Nada para imprimir.</Typography>
        <Typography sx={{ mt: 2 }}>{debugMsg}</Typography>
        <Button onClick={() => window.close()} sx={{ mt: 4 }}>Voltar</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#525659', minHeight: '100vh', py: 4, "@media print": { bgcolor: '#fff', py: 0 } }}>
      
      {/* Botões - Somem na impressão */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, position: 'fixed', top: 20, left: 0, right: 0, zIndex: 1000, "@media print": { display: 'none' } }}>
        <Paper elevation={4} sx={{ p: 1.5, display: 'flex', gap: 2, borderRadius: 10, px: 3 }}>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir Agora</Button>
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => window.close()} color="inherit">Fechar</Button>
        </Paper>
      </Box>

      {/* Grid A4 */}
      <Box sx={{
        width: '210mm', minHeight: '297mm', padding: '10mm', margin: '0 auto', bgcolor: 'white',
        display: 'grid', gridTemplateColumns: '100mm 100mm', gridAutoRows: '60mm', gap: '5mm', justifyContent: 'center',
        "@media print": { margin: 0, padding: '10mm' }
      }}>
        {passaros.map((passaro) => (
          <Box key={passaro.id} sx={{
            width: '100mm', height: '60mm', border: '1px dashed #ccc',
            display: 'flex', justifyContent: 'center', alignItems: 'center', pageBreakInside: 'avoid', overflow: 'hidden'
          }}>
            <Box sx={{ transform: 'scale(0.98)' }}>
              <CrachaPassaro form={passaro} />
            </Box>
          </Box>
        ))}
      </Box>

      <style jsx global>{`
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; }
      `}</style>
    </Box>
  );
}

export default function PaginaImpressao() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ImprimirContent />
    </Suspense>
  );
}