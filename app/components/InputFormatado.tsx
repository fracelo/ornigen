import { TextField, InputAdornment } from "@mui/material";
import { formataDados } from "@/lib/formataDados";

interface Props {
  label: string;
  value: number;
  tipo: "moeda" | "decimal";
  onChange: (valor: number) => void;
  fullWidth?: boolean;
}

export function InputFormatado({ label, value, tipo, onChange, fullWidth = true }: Props) {
  // Converte o número do banco (1.5) para o formato da máscara (150) para a função formatar
  const valorParaExibir = formataDados((value * 100).toFixed(0), tipo);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    const valorNumerico = parseFloat(apenasNumeros) / 100;
    onChange(valorNumerico);
  };

  return (
    <TextField
      label={label}
      fullWidth={fullWidth}
      value={valorParaExibir}
      onChange={handleChange}
      InputProps={{
        startAdornment: tipo === "moeda" ? <InputAdornment position="start">R$</InputAdornment> : null,
      }}
      inputProps={{ inputMode: "numeric" }} // Abre teclado numérico no celular
    />
  );
}