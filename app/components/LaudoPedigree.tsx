"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function LaudoPedigree({ passaro, empresa }: { passaro: any; empresa: any }) {
  if (!passaro) return null;

  const boxStyle = (isPrincipal = false) => ({
    p: 1.5,
    border: isPrincipal ? '2px solid #1976d2' : '1px solid #ccc',
    borderRadius: '8px',
    bgcolor: isPrincipal ? '#f0f7ff' : '#fff',
    minHeight: '70px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  });

  return (
    <Paper elevation={0} sx={{ p: '15mm', width: '210mm', minHeight: '297mm', margin: 'auto', bgcolor: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, borderBottom: '3px solid #1976d2', pb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="primary">{empresa?.nome_fantasia || "CRIADOURO"}</Typography>
          <Typography variant="body2">{empresa?.cidade} - {empresa?.estado}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight="bold">PEDIGREE OFICIAL</Typography>
          <Typography variant="subtitle2" color="primary">OrniGen Genealogy System</Typography>
        </Box>
      </Box>

      {/* Dados do Pássaro */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="900">{passaro.nome}</Typography>
          <Typography>Anilha: <strong>{passaro.anilha}</strong></Typography>
          <Typography>Espécie: {passaro.especies_sispass?.nomes_comuns?.[0]}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography fontWeight="bold">Sexo: {passaro.sexo === 'M' ? 'Macho ♂' : 'Fêmea ♀'}</Typography>
          <Typography>ID: {passaro.id}</Typography>
        </Box>
      </Box>

      {/* Árvore Genealógica */}
      
      <Box sx={{ display: 'flex', gap: 3, minHeight: '450px' }}>
        {/* Pais */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          <Box sx={boxStyle(true)}>
            <Typography variant="caption" fontWeight="bold">PAI</Typography>
            <Typography variant="body2" fontWeight="bold">{passaro.pai_nome || "---"}</Typography>
          </Box>
          <Box sx={boxStyle(true)}>
            <Typography variant="caption" fontWeight="bold">MÃE</Typography>
            <Typography variant="body2" fontWeight="bold">{passaro.mae_nome || "---"}</Typography>
          </Box>
        </Box>

        {/* Avós */}
        <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={boxStyle()}><Typography variant="caption">Avô Paterno</Typography><Typography variant="body2">{passaro.avo_paterno_nome || "---"}</Typography></Box>
            <Box sx={boxStyle()}><Typography variant="caption">Avó Paterna</Typography><Typography variant="body2">{passaro.ava_paterna_nome || "---"}</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={boxStyle()}><Typography variant="caption">Avô Materno</Typography><Typography variant="body2">{passaro.avo_materno_nome || "---"}</Typography></Box>
            <Box sx={boxStyle()}><Typography variant="caption">Avó Materna</Typography><Typography variant="body2">{passaro.ava_materna_nome || "---"}</Typography></Box>
          </Box>
        </Box>
      </Box>

      {/* Rodapé */}
      <Box sx={{ mt: 'auto', pt: 10 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          <Box sx={{ flex: 1, borderTop: '1px solid #000', textAlign: 'center' }}>
            <Typography variant="caption">Assinatura do Criador</Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 2, textAlign: 'center', border: '1px dashed #ccc' }}>
            <Typography variant="body2" fontWeight="bold">Autenticidade OrniGen</Typography>
            <Typography variant="caption">ID: {passaro.id}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}