"use client";
import { Box, Button, Paper, Typography } from "@mui/material";
import CrachaPassaro from "@/components/CrachaPassaro";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";

export default function ModalImpressao({ passaros, aoFechar }: { passaros: any[], aoFechar: () => void }) {
  if (passaros.length === 0) return null;

  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      bgcolor: 'rgba(0,0,0,0.8)', zIndex: 9999, overflowY: 'auto',
      display: 'block', padding: '20px',
      "@media print": { position: 'static', bgcolor: 'white', padding: 0, overflow: 'visible' }
    }}>
      {/* Botões que somem na impressão */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, "@media print": { display: 'none' } }}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Confirmar Impressão</Button>
        <Button variant="contained" color="error" startIcon={<CloseIcon />} onClick={aoFechar}>Cancelar</Button>
      </Box>

      {/* A Folha A4 */}
      <Paper sx={{
        width: '210mm', minHeight: '297mm', margin: '0 auto', bgcolor: 'white',
        padding: '10mm', display: 'grid', gridTemplateColumns: '100mm 100mm',
        gridAutoRows: '60mm', gap: '5mm', justifyContent: 'center',
        "@media print": { boxShadow: 'none', margin: 0 }
      }}>
        {passaros.map((p) => (
          <Box key={p.id} sx={{
            width: '100mm', height: '60mm', border: '1px dashed #ccc',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            pageBreakInside: 'avoid'
          }}>
             <CrachaPassaro form={p} />
          </Box>
        ))}
      </Paper>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .MuiBox-root, .MuiPaper-root { visibility: visible; }
          /* Garante que APENAS o modal e seu conteúdo apareçam */
          #modal-impressao-root, #modal-impressao-root * { visibility: visible; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </Box>
  );
}