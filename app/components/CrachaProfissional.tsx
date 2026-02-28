"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from "@/lib/supabaseClient";
import { formataDados } from "@/lib/formataDados"; // Importando sua lib

interface CrachaProps {
  passaroId: string | number;
  empresaId: string;
}

export const CrachaProfissional: React.FC<CrachaProps> = ({ passaroId, empresaId }) => {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const carregarDadosCompletos = useCallback(async () => {
    if (!passaroId || !empresaId) return;
    setLoading(true);
    try {
      // 1. QUERY COMPLETA (Até 4ª Geração)
      const { data: passaro, error } = await supabase
        .from("passaros")
        .select(`
          *,
          especies_sispass ( nomes_comuns ),
          pai:pai_id ( 
            nome, anilha, sexo,
            pai:pai_id ( nome, anilha, sexo, pai:pai_id ( nome, anilha, sexo ), mae:mae_id ( nome, anilha, sexo ) ), 
            mae:mae_id ( nome, anilha, sexo, pai:pai_id ( nome, anilha, sexo ), mae:mae_id ( nome, anilha, sexo ) ) 
          ),
          mae:mae_id ( 
            nome, anilha, sexo,
            pai:pai_id ( nome, anilha, sexo, pai:pai_id ( nome, anilha, sexo ), mae:mae_id ( nome, anilha, sexo ) ), 
            mae:mae_id ( nome, anilha, sexo, pai:pai_id ( nome, anilha, sexo ), mae:mae_id ( nome, anilha, sexo ) ) 
          )
        `)
        .eq("id", passaroId)
        .single();

      if (error) throw error;

      // 2. BUSCA EMPRESA
      const { data: empresa } = await supabase
        .from("empresas")
        .select(`nome_fantasia, cidade, estado, telefone1, telefone2, logo_url`)
        .eq("id", empresaId)
        .single();

      setDados({ passaro, empresa });
    } catch (err) {
      console.error("Erro ao carregar árvore:", err);
    } finally {
      setLoading(false);
    }
  }, [passaroId, empresaId]);

  useEffect(() => { carregarDadosCompletos(); }, [carregarDadosCompletos]);

  if (loading || !dados) return <div className="w-[160mm] h-[50mm] flex items-center justify-center border border-gray-200 text-[7pt] uppercase">Carregando Genealogia...</div>;

  const { passaro, empresa } = dados;
  const machoStyle = "bg-[#004080] text-white";
  const femeaStyle = "bg-[#c2185b] text-white";
  const dataFormatada = passaro.data_nascimento ? passaro.data_nascimento.split('-').reverse().join('/') : "---";
  
  const P = passaro.pai;
  const M = passaro.mae;

  // Função auxiliar para renderizar células do 4º nível com cor dinâmica
  const Celula4G = ({ animal, fallbackSex }: { animal: any, fallbackSex: 'M' | 'F' }) => {
    const isFemea = animal?.sexo === 'F' || fallbackSex === 'F';
    return (
      <div className={`${isFemea ? femeaStyle : machoStyle} text-[2.8pt] text-center leading-none truncate px-[0.2mm] py-[0.3mm] rounded-[0.5px] h-[2.8mm] flex items-center justify-center mb-[0.2mm]`}>
        {animal?.nome || animal?.anilha || (isFemea ? "♀" : "♂")}
      </div>
    );
  };

  return (
    <div className="flex w-[160mm] h-[50mm] bg-white text-black overflow-hidden border border-gray-300 font-sans uppercase print:m-0 break-inside-avoid">
      
      {/* --- FRENTE --- */}
      <div className="flex w-[80mm] h-full border-r border-dashed border-gray-400">
        <div className="w-[30mm] h-full flex flex-col items-center justify-between pt-4 pb-2 border-r border-gray-100 bg-gray-50">
          <div className="w-[26mm] h-[26mm] flex items-center justify-center bg-white border border-gray-200 p-1">
            {empresa?.logo_url ? <img src={empresa.logo_url} className="max-w-full max-h-full object-contain" /> : <div className="text-[5pt] text-gray-300">LOGO</div>}
          </div>
          <div className="text-center w-full px-1">
            <p className="text-[6pt] font-black text-blue-900 leading-tight truncate mb-0.5">{empresa?.nome_fantasia}</p>
            <div className="flex flex-col text-[5pt] font-bold text-gray-600 leading-tight">
              {/* FORMATANDO TELEFONES AQUI */}
              <span>{formataDados(empresa?.telefone1, "celular")}</span>
              <span>{formataDados(empresa?.telefone2, "celular")}</span>
            </div>
            <p className="text-[5pt] font-black text-blue-900 border-t border-gray-200 mt-1 pt-0.5">{empresa?.cidade} - {empresa?.estado}</p>
          </div>
        </div>

        <div className="w-[50mm] h-full bg-[#001f3f] p-2 text-white relative flex flex-col">
          <div className="border-b border-blue-400 pb-1 mb-2">
            <span className="text-[11pt] font-black truncate block leading-none">{passaro.nome}</span>
          </div>
          <div className="space-y-1">
            <div className="bg-white rounded-xs px-1.5 py-0.5 flex items-center gap-1 border-l-[3px] border-yellow-400">
              <span className="text-[5pt] font-bold text-gray-400 min-w-[10mm]">ANILHA:</span>
              <span className="text-[6.5pt] font-black text-blue-900">{passaro.anilha}</span>
            </div>
            <div className="bg-white rounded-xs px-1.5 py-0.5 flex items-center gap-1 border-l-[3px] border-yellow-400">
              <span className="text-[5pt] font-bold text-gray-400 min-w-[10mm]">ESPÉCIE:</span>
              <span className="text-[6pt] font-black text-blue-900 truncate">{passaro.especies_sispass?.nomes_comuns?.[0] || "---"}</span>
            </div>
            <div className="bg-white rounded-xs px-1.5 py-0.5 flex items-center gap-1 border-l-[3px] border-yellow-400">
              <span className="text-[5pt] font-bold text-gray-400 min-w-[10mm]">SEXO:</span>
              <span className={`text-[6pt] font-black ${passaro.sexo === 'M' ? 'text-blue-800' : 'text-pink-700'}`}>{passaro.sexo === 'M' ? 'MACHO' : 'FÊMEA'}</span>
            </div>
            <div className="bg-white rounded-xs px-1.5 py-0.5 flex items-center gap-1 border-l-[3px] border-yellow-400">
              <span className="text-[5pt] font-bold text-gray-400 min-w-[10mm]">NASC:</span>
              <span className="text-[6pt] font-black text-blue-900">{dataFormatada}</span>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-white p-0.5 rounded-xs">
            <QRCodeSVG value={String(passaro.id)} size={35} />
          </div>
        </div>
      </div>

      {/* --- VERSO (GENEALOGIA) --- */}
      <div className="w-[80mm] h-full bg-white flex items-stretch p-0.5">
        <div className="grid grid-cols-4 w-full h-full gap-x-0.5">
          
          {/* 1G */}
          <div className="flex flex-col justify-around h-full py-4">
            <div className={`${machoStyle} text-[4.2pt] p-0.5 rounded-xs truncate text-center font-bold`}>{P?.nome || "---"}</div>
            <div className={`${femeaStyle} text-[4.2pt] p-0.5 rounded-xs truncate text-center font-bold`}>{M?.nome || "---"}</div>
          </div>

          {/* 2G */}
          <div className="flex flex-col justify-around h-full py-2">
            <div className={`${machoStyle} text-[4pt] p-0.5 rounded-xs truncate text-center`}>{P?.pai?.nome || P?.pai?.anilha || "---"}</div>
            <div className={`${femeaStyle} text-[4pt] p-0.5 rounded-xs truncate text-center`}>{P?.mae?.nome || P?.mae?.anilha || "---"}</div>
            <div className={`${machoStyle} text-[4pt] p-0.5 rounded-xs truncate text-center`}>{M?.pai?.nome || M?.pai?.anilha || "---"}</div>
            <div className={`${femeaStyle} text-[4pt] p-0.5 rounded-xs truncate text-center`}>{M?.mae?.nome || M?.mae?.anilha || "---"}</div>
          </div>

          {/* 3G */}
          <div className="flex flex-col justify-around h-full py-1">
            <div className={`${machoStyle} text-[3.2pt] truncate text-center`}>{P?.pai?.pai?.nome || P?.pai?.pai?.anilha || "♂"}</div>
            <div className={`${femeaStyle} text-[3.2pt] truncate text-center`}>{P?.pai?.mae?.nome || P?.pai?.mae?.anilha || "♀"}</div>
            <div className={`${machoStyle} text-[3.2pt] truncate text-center`}>{P?.mae?.pai?.nome || P?.mae?.pai?.anilha || "♂"}</div>
            <div className={`${femeaStyle} text-[3.2pt] truncate text-center`}>{P?.mae?.mae?.nome || P?.mae?.mae?.anilha || "♀"}</div>
            <div className={`${machoStyle} text-[3.2pt] truncate text-center`}>{M?.pai?.pai?.nome || M?.pai?.pai?.anilha || "♂"}</div>
            <div className={`${femeaStyle} text-[3.2pt] truncate text-center`}>{M?.pai?.mae?.nome || M?.pai?.mae?.anilha || "♀"}</div>
            <div className={`${machoStyle} text-[3.2pt] truncate text-center`}>{M?.mae?.pai?.nome || M?.mae?.pai?.anilha || "♂"}</div>
            <div className={`${femeaStyle} text-[3.2pt] truncate text-center`}>{M?.mae?.mae?.nome || M?.mae?.mae?.anilha || "♀"}</div>
          </div>

          {/* 4G */}
          <div className="flex flex-col justify-around h-full py-0.5">
            <Celula4G animal={P?.pai?.pai?.pai} fallbackSex="M" />
            <Celula4G animal={P?.pai?.pai?.mae} fallbackSex="F" />
            <Celula4G animal={P?.pai?.mae?.pai} fallbackSex="M" />
            <Celula4G animal={P?.pai?.mae?.mae} fallbackSex="F" />
            <Celula4G animal={P?.mae?.pai?.pai} fallbackSex="M" />
            <Celula4G animal={P?.mae?.pai?.mae} fallbackSex="F" />
            <Celula4G animal={P?.mae?.mae?.pai} fallbackSex="M" />
            <Celula4G animal={P?.mae?.mae?.mae} fallbackSex="F" />
            <Celula4G animal={M?.pai?.pai?.pai} fallbackSex="M" />
            <Celula4G animal={M?.pai?.pai?.mae} fallbackSex="F" />
            <Celula4G animal={M?.pai?.mae?.pai} fallbackSex="M" />
            <Celula4G animal={M?.pai?.mae?.mae} fallbackSex="F" />
            <Celula4G animal={M?.mae?.pai?.pai} fallbackSex="M" />
            <Celula4G animal={M?.mae?.pai?.mae} fallbackSex="F" />
            <Celula4G animal={M?.mae?.mae?.pai} fallbackSex="M" />
            <Celula4G animal={M?.mae?.mae?.mae} fallbackSex="F" />
          </div>

        </div>
      </div>
    </div>
  );
};