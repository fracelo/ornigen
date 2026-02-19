// Tipagem centralizada para os pássaros
export interface Passaro {
  id: number;
  nome: string;
  anilha: string;
  data_nascimento?: string | null;
  especie_nome?: string | null;
  pai_id?: number | null;
  mae_id?: number | null;
}