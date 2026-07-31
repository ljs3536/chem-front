// src/components/Molecule2D.tsx
"use client";

import { useEffect, useState } from "react";

interface Molecule2DProps {
  smiles: string;
  width?: number;
  height?: number;
}

declare global {
  interface Window {
    initRDKitModule?: () => Promise<any>;
    RDKit?: any;
  }
}

export default function Molecule2D({
  smiles,
  width = 300,
  height = 200,
}: Molecule2DProps) {
  const [svg, setSvg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function renderMolecule() {
      try {
        // RDKit Module 초기화 (싱글톤 패턴)
        if (!window.RDKit && window.initRDKitModule) {
          window.RDKit = await window.initRDKitModule();
        }

        if (window.RDKit && smiles) {
          const mol = window.RDKit.get_mol(smiles);
          if (mol) {
            const svgContent = mol.get_svg(width, height);
            if (isMounted) setSvg(svgContent);
            mol.delete(); // 메모리 해제
          }
        }
      } catch (err) {
        console.error("RDKit 2D 렌더링 실패:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    renderMolecule();

    return () => {
      isMounted = false;
    };
  }, [smiles, width, height]);

  if (loading) {
    return (
      <div className="text-xs text-gray-400 animate-pulse">
        2D 화학 구조식 생성 중...
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="text-xs text-red-400">
        2D 구조식 그리기 실패 (유효하지 않은 SMILES)
      </div>
    );
  }

  return (
    <div
      className="flex justify-center items-center bg-white p-2 rounded-lg border border-gray-200 shadow-inner"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
