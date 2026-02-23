"use client";

import { Box, Typography, Button, Paper, Stack, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function TabelaPlanos({ planos = [], planoAtualId, onSelecionar, isPublic }) {
  
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  // Trava de segurança: se não houver planos, mostra que está carregando ou vazio
  if (!planos || planos.length === 0) {
    return <Typography sx={{ textAlign: 'center', py: 4 }}>Carregando planos...</Typography>;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      gap: 3, 
      justifyContent: 'center',
      alignItems: 'stretch',
      width: '100%'
    }}>
      {planos.map((plano) => {
        const isAtual = planoAtualId === plano.id;

        return (
          <Paper 
            key={plano.id || Math.random()} 
            variant="outlined" 
            sx={{ 
              p: 4, flex: 1, borderRadius: 4, position: 'relative',
              display: 'flex', flexDirection: 'column',
              borderColor: isAtual ? 'primary.main' : 'divider',
              borderWidth: isAtual ? 2 : 1,
              bgcolor: isAtual ? '#f0f7ff' : 'white',
              boxShadow: isAtual ? '0px 10px 20px rgba(25, 118, 210, 0.1)' : 'none'
            }}
          >
            {isAtual && (
              <Box sx={{ 
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                bgcolor: 'primary.main', color: 'white', px: 2, py: 0.5, borderRadius: 1, 
                fontSize: '0.75rem', fontWeight: 'bold', z_index: 10, whiteSpace: 'nowrap'
              }}>
                PLANO ATUAL
              </Box>
            )}

            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
              {plano.nome}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', height: 40 }}>
              {plano.descricao}
            </Typography>
            
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {formatarMoeda(plano.valor_mensal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                por mês / usuário
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2} sx={{ mb: 4, flexGrow: 1 }}>
              <FeatureItem label={`Até ${plano.limite_passaros} pássaros`} check={true} />
              <FeatureItem label={`${plano.limite_pedigree_mes} Pedigrees/mês`} check={plano.limite_pedigree_mes > 0} />
              <FeatureItem label="Crachá" check={plano.permite_cracha} />
              <FeatureItem label="Reserva" check={plano.permite_reserva_ovos} />
              <FeatureItem label="Alimentos" check={plano.permite_custos_alimentos} />
              <FeatureItem label="Saúde" check={plano.permite_remedios_agenda} />
              <FeatureItem label="Financeiro" check={plano.permite_financeiro_full} />
            </Stack>

            <Button 
              variant={isAtual ? "outlined" : "contained"} 
              fullWidth 
              size="large"
              onClick={() => onSelecionar && onSelecionar(plano.id)}
              disabled={isAtual && !isPublic}
            >
              {isPublic ? "Começar Agora" : (isAtual ? "Plano Ativo" : "Mudar")}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
}

function FeatureItem({ label, check }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {check ? <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 16 }} /> : <CancelIcon sx={{ color: '#d32f2f', fontSize: 16 }} />}
      <Typography variant="body2" sx={{ color: check ? 'text.primary' : 'text.disabled', fontSize: '0.85rem' }}>{label}</Typography>
    </Stack>
  );
}