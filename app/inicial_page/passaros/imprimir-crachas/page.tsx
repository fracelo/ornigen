"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEmpresa } from "@/context/empresaContext";
import { Box, Button, CircularProgress, Typography, Container } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import { CrachaProfissional } from "@/components/CrachaProfissional";

function ConteudoImpressaoCrachas() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  
  const idsParam = searchParams.get("ids");
  const [listaIds, setListaIds] = useState<string[]>([]);

  useEffect(() => {
    if (idsParam) setListaIds(idsParam.split(","));
  }, [idsParam]);

  if (!empresaId || listaIds.length === 0) {
    return (
      <Box p={10} textAlign="center">
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Agrupa os IDs em grupos de 5 (5 crachás por folha A4)
  const gruposDeAves = [];
  for (let i = 0; i < listaIds.length; i += 5) {
    gruposDeAves.push(listaIds.slice(i, i + 5));
  }

  return (
    <Box sx={{ bgcolor: "#525659", minHeight: "100vh" }} className="main-wrapper">
      
      {/* BARRA DE FERRAMENTAS - no-print */}
      <Box className="no-print" sx={{ 
        bgcolor: "white", 
        py: 1.5, 
        position: "fixed", 
        top: 0, 
        width: "100%",
        zIndex: 2000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center"
      }}>
        <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} variant="outlined" size="small">
            Voltar
          </Button>
          <Typography variant="h6" fontWeight="900" sx={{ color: '#0D47A1' }}>
            IMPRESSÃO PROFISSIONAL ({listaIds.length} AVES)
          </Typography>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} color="primary">
            Imprimir Agora
          </Button>
        </Container>
      </Box>

      {/* CONTEÚDO PARA IMPRESSÃO */}
      <Box className="print-content-container" sx={{ pt: 10, pb: 4 }}>
        {gruposDeAves.map((grupo, index) => (
          <Box key={index} className="folha-a4">
            {grupo.map((id) => (
              <Box key={id} className="item-cracha">
                <CrachaProfissional passaroId={id} empresaId={empresaId} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <style jsx global>{`
        /* ESTILO PARA TELA */
        .folha-a4 {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 8mm 0;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 0 15px rgba(0,0,0,0.4);
        }

        .item-cracha { margin-bottom: 2mm; }

        /* ESTILO PARA IMPRESSORA */
        @media print {
          /* 1. Esconde TUDO que não for o conteúdo de impressão */
          body * {
            visibility: hidden;
          }

          /* 2. Mostra apenas as folhas A4 e o que está dentro delas */
          .print-content-container, 
          .print-content-container *, 
          .folha-a4, 
          .folha-a4 * {
            visibility: visible;
          }

          /* 3. Posiciona a área de impressão no topo absoluto */
          .print-content-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .folha-a4 {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }

          .item-cracha {
            margin-bottom: 1.5mm !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </Box>
  );
}

export default function PaginaImprimirCrachas() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ConteudoImpressaoCrachas />
    </Suspense>
  );
}