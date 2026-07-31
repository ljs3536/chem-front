"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getComparisonHistory, HistoryComparisonItem } from "@/lib/api";
import Link from "next/link";

const TASKS = [
  "NR-AR",
  "NR-AR-LBD",
  "NR-AhR",
  "NR-Aromatase",
  "NR-ER",
  "NR-ER-LBD",
  "NR-PPAR-gamma",
  "SR-ARE",
  "SR-ATAD5",
  "SR-HSE",
  "SR-MMP",
  "SR-p53",
];

const COLOR_PALETTE = [
  {
    bg: "bg-blue-500",
    text: "text-blue-600",
    border: "border-blue-500",
    lightBg: "bg-blue-50",
  },
  {
    bg: "bg-purple-500",
    text: "text-purple-600",
    border: "border-purple-500",
    lightBg: "bg-purple-50",
  },
  {
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-500",
    lightBg: "bg-emerald-50",
  },
  {
    bg: "bg-amber-500",
    text: "text-amber-600",
    border: "border-amber-500",
    lightBg: "bg-amber-50",
  },
];

// 💡 1. useSearchParams를 사용하는 실제 내용부를 별도 컴포넌트로 분리
function CompareContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const [items, setItems] = useState<HistoryComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }
    const ids = idsParam
      .split(",")
      .map((x) => parseInt(x, 10))
      .filter(Boolean);

    getComparisonHistory(ids)
      .then((res) => setItems(res.comparison))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [idsParam]);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8 text-gray-900">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            📊 AI 예측 이력 정밀 비교 대시보드
          </h1>
          <p className="text-sm text-gray-400">
            선택된 분자 구조들의 12대 독성 지표 상대적 비교 분석
          </p>
        </div>
        <Link
          href="/history"
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition border border-gray-300"
        >
          ← 이력 목록으로 돌아가기
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          비교 데이터를 분석하는 중...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
          비교할 데이터를 찾지 못했습니다.
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. 상단 비교 대상 요약 카드 */}
          <div
            className={`grid gap-4 ${items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
          >
            {items.map((item, idx) => {
              const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
              return (
                <div
                  key={item.history_id}
                  className={`p-4 rounded-xl border-2 bg-white shadow-sm space-y-2 ${color.border}`}
                >
                  <div className="flex justify-between items-center border-b pb-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${color.lightBg} ${color.text}`}
                    >
                      비교 대상 #{idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID #{item.history_id}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold bg-gray-100 p-2 rounded break-all text-gray-800">
                    {item.smiles}
                  </p>
                  <p className="text-xs text-gray-500">
                    사용 모델: <strong>{item.model_name}</strong>
                  </p>
                </div>
              );
            })}
          </div>

          {/* 2. 12대 독성 지표 나란히 비교 시각화 차트 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-3">
              🧪 12대 독성 지표별 위험 확률 시각적 비교
            </h2>

            <div className="space-y-6">
              {TASKS.map((task) => (
                <div key={task} className="border-b pb-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>{task}</span>
                  </div>

                  {/* 항목별 확률 비교 프로그레스 바 영역 */}
                  <div className="space-y-1.5">
                    {items.map((item, idx) => {
                      const prob = item.predictions[task] ?? 0;
                      const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                      const isHigh = prob >= 50;

                      return (
                        <div
                          key={item.history_id}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="w-16 text-gray-500 font-mono text-[10px]">
                            #{item.history_id}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden relative">
                            <div
                              className={`h-full transition-all duration-500 ${isHigh ? "bg-red-500" : color.bg}`}
                              style={{ width: `${Math.max(prob, 2)}%` }}
                            />
                          </div>
                          <span
                            className={`w-12 text-right font-bold font-mono ${isHigh ? "text-red-600" : "text-gray-700"}`}
                          >
                            {prob}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 💡 2. 최상위 내보내기 페이지 컴포넌트에서는 Suspense로 감싸기만 수행
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 text-center text-gray-400">
          페이지를 로딩하는 중...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
