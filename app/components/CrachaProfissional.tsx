"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CrachaProps {
  passaro: {
    id: string;
    nome: string; 
    anilha: string;
    especie: string;
    sexo: string;
    nascimento: string;
    pai_nome?: string;
    mae_nome?: string;
  };
  empresa: {
    nome_fantasia: string;
    cidade: string;
    uf: string;
    telefone1?: string;
    telefone2?: string;
    logo_url?: string;
  };
}

export const CrachaProfissional: React.FC<CrachaProps> = ({ passaro, empresa }) => {
  const machoStyle = "bg-[#004080] text-white";
  const femeaStyle = "bg-[#c2185b] text-white";
  const azulEscuro = "#001f3f";

  return (
    <div className="flex w-[160mm] h-[50mm] bg-white text-black overflow-hidden print:m-0 border border-gray-300 shadow-sm">
      
      {/* --- FRENTE (80mm) --- */}
      <div className="flex w-[80mm] h-full border-r border-dashed border-gray-400">
        
        {/* Lado Esquerdo: Identificação do Criatório (30mm) */}
        <div className="w-[30mm] h-full flex flex-col items-center justify-between py-2 border-r border-gray-100 bg-gray-50">
          <div className="flex flex-col items-center w-full px-1">
            <div className="w-[22mm] h-[22mm] mb-1 flex items-center justify-center bg-white border border-gray-200 rounded-xs overflow-hidden p-0.5">
              {empresa.logo_url ? (
                <img src={empresa.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-[6pt] text-gray-400 font-bold uppercase">Logo</div>
              )}
            </div>
            <span className="text-[7pt] font-black text-blue-900 text-center uppercase leading-tight px-1">
              {empresa.nome_fantasia}
            </span>
          </div>

          {/* Telefones Centralizados por linha e Localização */}
          <div className="text-center w-full px-1">
            <p className="text-[5.5pt] font-bold text-gray-700 leading-none mb-1">{empresa.telefone1}</p>
            <p className="text-[5.5pt] font-bold text-gray-700 leading-none mb-1.5">{empresa.telefone2}</p>
            <p className="text-[5.5pt] font-black text-blue-900 uppercase border-t border-gray-200 pt-1">
              {empresa.cidade} - {empresa.uf}
            </p>
          </div>
        </div>

        {/* Lado Direito: Dados do Pássaro (50mm) - Cores Invertidas */}
        <div className="w-[50mm] h-full bg-[#001f3f] p-2 text-white relative flex flex-col">
          <div className="flex justify-between items-start border-b border-blue-400 pb-1 mb-2">
            <span className="text-[13pt] font-black tracking-tighter uppercase truncate w-[75%] leading-none">
              {passaro.nome}
            </span>
            <span className="text-[4.5pt] bg-red-600 px-1 rounded font-bold uppercase">Original</span>
          </div>

          <div className="space-y-1.5">
            {/* Espécie - Label Branco / Fundo Branco info Azul */}
            <div className="flex flex-col">
              <span className="text-[4pt] uppercase font-bold mb-0.5 ml-0.5">Espécie</span>
              <div className="bg-white rounded-xs px-1 py-0.5">
                <span className="text-[7.5pt] font-bold text-[#001f3f] leading-none truncate block">
                  {passaro.especie}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {/* Sexo */}
              <div className="flex flex-col">
                <span className="text-[4pt] uppercase font-bold mb-0.5 ml-0.5">Sexo</span>
                <div className="bg-white rounded-xs px-1 py-0.5 text-center">
                  <span className={`text-[7pt] font-black uppercase ${passaro.sexo === 'M' ? 'text-blue-800' : 'text-pink-700'}`}>
                    {passaro.sexo === 'M' ? 'Macho' : 'Fêmea'}
                  </span>
                </div>
              </div>
              {/* Nascimento */}
              <div className="flex flex-col">
                <span className="text-[4pt] uppercase font-bold mb-0.5 ml-0.5">Nascimento</span>
                <div className="bg-white rounded-xs px-1 py-0.5 text-center">
                  <span className="text-[7pt] font-bold text-[#001f3f]">
                    {passaro.nascimento}
                  </span>
                </div>
              </div>
            </div>

            {/* Anilha - Destaque Principal */}
            <div className="flex flex-col pt-1">
              <span className="text-[4pt] uppercase font-bold mb-0.5 ml-0.5">Anilha de Identificação</span>
              <div className="bg-white rounded-xs px-1 py-1 text-center border-l-4 border-yellow-500">
                <span className="text-[11pt] font-black text-[#001f3f] leading-none">
                  {passaro.anilha}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-1 right-1 bg-white p-0.5 rounded-sm">
            <QRCodeSVG value={passaro.id} size={46} />
          </div>
        </div>
      </div>

      {/* --- VERSO: GENEALOGIA --- */}
      <div className="w-[80mm] h-full bg-white p-1 flex flex-col">
        <div className="text-center mb-1">
          <span className="text-[7.5pt] font-black text-blue-900 border-b border-red-600 px-3 uppercase italic">
            Genealogia Profissional
          </span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="grid grid-cols-4 w-full gap-x-0.5 items-center">
            {/* 1ª GER */}
            <div className="flex flex-col gap-8">
              <div className={`${machoStyle} text-[5.5pt] p-0.5 rounded-sm truncate`}>P: {passaro.pai_nome || '---'}</div>
              <div className={`${femeaStyle} text-[5.5pt] p-0.5 rounded-sm truncate`}>M: {passaro.mae_nome || '---'}</div>
            </div>
            {/* 2ª GER */}
            <div className="flex flex-col gap-1.5">
              <div className={`${machoStyle} text-[4.5pt] p-0.5 rounded-xs opacity-90`}>Avô P.</div>
              <div className={`${femeaStyle} text-[4.5pt] p-0.5 rounded-xs opacity-90`}>Avó P.</div>
              <div className={`${machoStyle} text-[4.5pt] p-0.5 rounded-xs opacity-90 mt-2`}>Avô M.</div>
              <div className={`${femeaStyle} text-[4.5pt] p-0.5 rounded-xs opacity-90`}>Avó M.</div>
            </div>
            {/* 3ª GER */}
            <div className="flex flex-col gap-0.5">
              {[1, 3, 5, 7].map(n => (
                <React.Fragment key={n}>
                  <div className={`${machoStyle} text-[3.5pt] px-0.5 opacity-80`}>Bis {n}</div>
                  <div className={`${femeaStyle} text-[3.5pt] px-0.5 opacity-80 ${n < 7 ? 'mb-0.5' : ''}`}>Bis {n+1}</div>
                </React.Fragment>
              ))}
            </div>
            {/* 4ª GER */}
            <div className="flex flex-col gap-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`${i % 2 === 0 ? machoStyle : femeaStyle} text-[2.8pt] px-0.5 border-b border-white/10 scale-95`}>Tri {i + 1}</div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-0.5 px-1">
          <span className="text-[4pt] text-gray-400 uppercase italic">Autenticidade via QR-Code</span>
          <span className="text-[3.5pt] text-gray-300 uppercase">Gestão {empresa.nome_fantasia}</span>
        </div>
      </div>

    </div>
  );
};