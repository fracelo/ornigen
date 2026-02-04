export function formataDados(d: string, tipo: string): string {
  if (!d) return "";

  switch (tipo.toLowerCase()) {
    case "cpf": {
      let valor = d.replace(/\D/g, "");
      if (valor.length !== 11) return valor;

      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(valor)) return "CPF inválido";

      // Validação dos dígitos verificadores
      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(valor.charAt(i)) * (10 - i);
      let digito1 = (soma * 10) % 11;
      if (digito1 === 10) digito1 = 0;
      if (digito1 !== parseInt(valor.charAt(9))) return "CPF inválido";

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(valor.charAt(i)) * (11 - i);
      let digito2 = (soma * 10) % 11;
      if (digito2 === 10) digito2 = 0;
      if (digito2 !== parseInt(valor.charAt(10))) return "CPF inválido";

      // Se válido, retorna formatado
      return valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    case "cnpj": {
      let valor = d.replace(/\D/g, "");
      if (valor.length !== 14) return valor;

      if (/^(\d)\1+$/.test(valor)) return "CNPJ inválido";

      const calcDigito = (base: string, pesoInicial: number) => {
        let soma = 0;
        let peso = pesoInicial;
        for (let i = 0; i < base.length; i++) {
          soma += parseInt(base.charAt(i)) * peso;
          peso = peso === 2 ? 9 : peso - 1;
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
      };

      const digito1 = calcDigito(valor.substring(0, 12), 5);
      const digito2 = calcDigito(valor.substring(0, 13), 6);

      if (digito1 !== parseInt(valor.charAt(12)) || digito2 !== parseInt(valor.charAt(13))) {
        return "CNPJ inválido";
      }

      return valor
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    case "cep": {
      let valor = d.replace(/\D/g, "");
      return valor.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
    }

    case "celular": {
      let valor = d.replace(/\D/g, "");
      return valor
        .replace(/^(\d{2})(\d)/, "$1 $2")
        .replace(/(\d{1})(\d{4})(\d)/, "$1 $2-$3")
        .replace(/(-\d{4})(\d+?)$/, "$1");
    }

    case "email": {
      return d.trim().toLowerCase();
    }

    default:
      return d;
  }
}