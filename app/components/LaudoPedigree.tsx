"use client";

import { Box, Typography, Paper, Divider } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";

export default function LaudoPedigree({ passaro, empresa }: { passaro: any; empresa: any }) {
  if (!passaro) return null;

  // Função para calcular Consanguinidade (Wright's Coefficient adaptado)
  const calcularF = () => {
    let f = 0;
    const idsPai = [passaro.pai?.id, passaro.pai?.pai?.id, passaro.pai?.mae?.id, 
                    passaro.pai?.pai?.pai_id, passaro.pai?.pai?.mae_id, 
                    passaro.pai?.mae?.pai_id, passaro.pai?.mae?.mae_id].filter(Boolean);
    
    const idsMae = [passaro.mae?.id, passaro.mae?.pai?.id, passaro.mae?.mae?.id, 
                    passaro.mae?.pai?.pai_id, passaro.mae?.pai?.mae_id, 
                    passaro.mae?.mae?.pai_id, passaro.mae?.mae?.mae_id].filter(Boolean);

    const comuns = idsPai.filter(id => idsMae.includes(id));
    
    // Simplificação para 4 gerações
    if (comuns.length > 0) {
      comuns.forEach(() => { f += 6.25; }); // Peso médio por ancestral comum em 4 ger.
      if (passaro.pai?.id === passaro.mae?.id) f = 50; 
    }
    return f > 25 ? 25 : f; // Teto para exibição visual
  };

  const fValue = calcularF();

  const BoxAve = ({ ave, titulo, cor = "#fff", small = false }: any) => (
    <Box sx={{
      p: small ? 0.5 : 1,
      mb: 1,
      border: '1px solid #ccc',
      borderRadius: '4px',
      bgcolor: cor,
      minHeight: small ? '40px' : '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#666', fontWeight: 'bold' }}>{titulo}</Typography>
      <Typography sx={{ fontSize: small ? '0.7rem' : '0.85rem', fontWeight: 'bold', lineHeight: 1 }}>
        {ave?.nome || "---"}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem' }}>{ave?.anilha || ""}</Typography>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ 
      p: '10mm', width: '210mm', minHeight: '297mm', margin: 'auto', 
      bgcolor: 'white', color: 'black', fontFamily: 'Roboto, Arial' 
    }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '2px solid #1976d2', pb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight="900" color="primary">{empresa?.nome_fantasia}</Typography>
          <Typography variant="caption">SISTEMA ORNIGEN - GESTÃO GENÉTICA</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight="bold">PEDIGREE GENEALÓGICO</Typography>
          <Typography variant="caption">ID: {passaro.id}</Typography>
        </Box>
      </Box>

      {/* Ave Principal - IDENTIFICAÇÃO DETALHADA */}
      <Box sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: '#f0f4f8', 
        border: '2px solid #1976d2', 
        borderRadius: 2,
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Identificação do Exemplar
              </Typography>
              <Typography variant="h5" fontWeight="900" sx={{ lineHeight: 1.1 }}>{passaro.nome}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ANILHA: {passaro.anilha}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                SISPASS: {passaro.codigo_sispass_ave || "Não informado"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.1)' }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">Espécie</Typography>
              <Typography variant="body2" fontWeight="bold">
                {passaro.especies_sispass?.nomes_comuns?.[0] || "---"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Data de Nascimento</Typography>
              <Typography variant="body2" fontWeight="bold">
                {passaro.data_nascimento ? new Date(passaro.data_nascimento).toLocaleDateString('pt-BR') : "---"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Sexo</Typography>
              <Typography variant="body2" fontWeight="bold">
                {passaro.sexo === 'M' ? 'Macho ♂' : 'Fêmea ♀'}
              </Typography>
            </Box>
          </Box>

          {/* Linha da Sexagem */}
          <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #ccc' }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
              <strong>Sexagem confirmada pelo:</strong> {passaro.laboratorio || "Laudo não anexado"}
            </Typography>
          </Box>
      </Box>

      {/* Árvore de 4 Gerações */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.5fr', gap: 1 }}>
        
        {/* G1: Pais */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          <BoxAve ave={passaro.pai} titulo="PAI (G1)" cor="#e3f2fd" />
          <BoxAve ave={passaro.mae} titulo="MÃE (G1)" cor="#fce4ec" />
        </Box>

        {/* G2: Avós */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <BoxAve ave={passaro.pai?.pai} titulo="AVÔ PATERNO" />
          <BoxAve ave={passaro.pai?.mae} titulo="AVÓ PATERNA" />
          <BoxAve ave={passaro.mae?.pai} titulo="AVÔ MATERNO" />
          <BoxAve ave={passaro.mae?.mae} titulo="AVÓ MATERNA" />
        </Box>

        {/* G3: Bisavós */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <BoxAve ave={passaro.pai?.pai?.pai} titulo="BISAVÔ" small />
          <BoxAve ave={passaro.pai?.pai?.mae} titulo="BISAVÓ" small />
          <BoxAve ave={passaro.pai?.mae?.pai} titulo="BISAVÔ" small />
          <BoxAve ave={passaro.pai?.mae?.mae} titulo="BISAVÓ" small />
          <BoxAve ave={passaro.mae?.pai?.pai} titulo="BISAVÔ" small />
          <BoxAve ave={passaro.mae?.pai?.mae} titulo="BISAVÓ" small />
          <BoxAve ave={passaro.mae?.mae?.pai} titulo="BISAVÔ" small />
          <BoxAve ave={passaro.mae?.mae?.mae} titulo="BISAVÓ" small />
        </Box>
      </Box>

      {/* Análise Genética */}
      <Box sx={{ mt: 4, p: 2, bgcolor: '#fffde7', border: '1px dashed #fbc02d', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon color="warning" />
          <Typography variant="subtitle2" fontWeight="bold">COEFICIENTE DE CONSANGUINIDADE (WRIGHT'S F): {fValue.toFixed(2)}%</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.7rem', mt: 0.5, color: '#555' }}>
          * Este cálculo analisa a probabilidade de homozigose por ancestralidade comum até a 4ª geração.
        </Typography>
      </Box>

      {/* Assinatura */}
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box sx={{ width: '250px', borderTop: '1px solid #000', textAlign: 'center', pt: 1 }}>
          <Typography variant="caption">Assinatura do Criador Responsável</Typography>
        </Box>
        <Typography variant="caption" color="textSecondary">Documento gerado pelo OrniGen em {new Date().toLocaleDateString()}</Typography>
      </Box>
    </Paper>
  );
}