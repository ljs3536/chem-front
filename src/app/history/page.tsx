"use client";

import { useEffect, useState } from "react";
import { getPredictionHistory, PredictionHistory } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getPredictionHistory()
      .then((data) => setHistory(data.history))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert("최대 4개 항목까지만 동시에 비교할 수 있습니다.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert("비교를 위해 최소 2개 이상의 항목을 선택해 주세요.");
      return;
    }
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  };

  return (
    <main className="max-w-8xl mx-auto p-6 space-y-6 text-gray-900">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            📜 AI 예측 분석 이력 대시보드
          </h1>
          <p className="text-sm text-gray-600">
            PostgreSQL에 저장된 AI 예측 결과 조회 및 다중 비교
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCompare}
            disabled={selectedIds.length < 2}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
          >
            📊 선택 항목 비교하기 ({selectedIds.length})
          </button>
          <Link
            href="/"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition border border-gray-300"
          >
            ← 검색으로 돌아가기
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          이력 데이터를 불러오는 중...
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
          저장된 예측 이력이 없습니다. 메인 페이지에서 AI 분석을 먼저 실행해
          보세요!
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
              <tr>
                <th className="p-4 w-12 text-center">선택</th>
                <th className="p-4">ID</th>
                <th className="p-4">SMILES</th>
                <th className="p-4">예측 결과 요약</th>
                <th className="p-4">분석 일시</th>
                <th className="p-4">상세보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((item) => {
                const isSelected = selectedIds.includes(item.history_id);
                return (
                  <tr
                    key={item.history_id}
                    className={`hover:bg-gray-50 transition ${isSelected ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.history_id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      #{item.history_id}
                    </td>
                    <td className="p-4">
                      <code className="text-xs font-mono bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200 break-all">
                        {item.smiles}
                      </code>
                    </td>
                    <td className="p-4">
                      {item.toxic_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          ⚠️ 12개 중 {item.toxic_count}개 독성 위험 감지
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          ✅ 전반적 저위험
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/history/${item.history_id}`}
                        className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border px-2.5 py-1 rounded font-medium transition"
                      >
                        원인 분석
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
