"use client";

import { useState, useEffect } from "react";
import {
  searchChemical,
  getSupportedModels,
  ChemicalSearchResult,
  AIModel,
} from "@/lib/api";
import Link from "next/link";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("lstm_multitask");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChemicalSearchResult | null>(null);

  useEffect(() => {
    getSupportedModels()
      .then((data) => setModels(data.models))
      .catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchChemical(query, selectedModel);
      setResult(data);
    } catch (err) {
      alert("백엔드 서버 연동 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-8xl mx-auto p-6 space-y-8 text-gray-900">
      {/* 상단 헤더 & 네비게이션 */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🧪 AI 화학물질 유해성 종합 분석 플랫폼
          </h1>
          <p className="text-sm text-gray-600">
            PostgreSQL DB 조회 및 Multi-Task 딥러닝 실시간 예측
          </p>
        </div>
        <Link
          href="/history"
          className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition border border-blue-200"
        >
          📜 예측 이력 보기
        </Link>
      </div>

      {/* 검색 및 AI 모델 선택 섹션 */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            검색할 화학식 (SMILES, CAS 번호, 물질명)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: CCOc1ccc2nc 또는 Clc1ccc(cc1)C(c2ccc(Cl)cc2)C(Cl)(Cl)Cl"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? "분석 중..." : "검색 / 분석"}
            </button>
          </div>
        </div>

        {/* AI 모델 선택 드롭다운 */}
        <div className="flex items-center gap-3 pt-2">
          <span className="text-xs font-semibold text-gray-600">
            예측 AI 모델 선택:
          </span>
          <div className="flex gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                disabled={m.status === "coming_soon"}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  selectedModel === m.id
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                    : m.status === "coming_soon"
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {m.name} {m.status === "coming_soon" && "(준비중)"}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* 결과 카드 표시 섹션 */}
      {result && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">분석 결과</h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                result.found
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {result.found
                ? "DB 검색 완료"
                : "AI 실시간 예측 완료 (DB 저장됨)"}
            </span>
          </div>

          {result.found && result.data ? (
            /* DB 조회 결과 UI */
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-1.5">
                <p>
                  <strong className="text-gray-700">SMILES:</strong>{" "}
                  <code className="text-xs font-mono bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded border border-gray-300">
                    {result.data.smiles}
                  </code>
                </p>
                <p>
                  <strong className="text-gray-700">물질명:</strong>{" "}
                  <span className="text-gray-900">
                    {result.data.SAMPLE_NAME || "정보 없음"}
                  </span>
                </p>
                <p>
                  <strong className="text-gray-700">CAS 번호:</strong>{" "}
                  <span className="text-gray-900">
                    {result.data.CAS || "정보 없음"}
                  </span>
                </p>
              </div>

              <h3 className="text-sm font-bold text-gray-800 pt-2">
                Tox21 12대 독성 종합 평가 (DB):
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.data)
                  .filter(([k]) => k.startsWith("NR-") || k.startsWith("SR-"))
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 border border-gray-200 rounded-lg text-xs flex justify-between items-center bg-gray-50"
                    >
                      <span className="font-semibold text-gray-700">{key}</span>
                      <span
                        className={`font-bold ${val === 1 ? "text-red-600" : val === 0 ? "text-green-600" : "text-gray-400"}`}
                      >
                        {val === 1
                          ? "⚠️ 양성(독성)"
                          : val === 0
                            ? "✅ 음성(무해)"
                            : "❓ 미측정"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : result.predictions ? (
            /* AI 실시간 예측 결과 UI */
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm flex justify-between items-center">
                <div>
                  <p>
                    <strong className="text-gray-700">입력 SMILES:</strong>{" "}
                    <code className="text-xs font-mono bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded border border-gray-300">
                      {result.smiles}
                    </code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    * DB에 존재하지 않아 AI 모델이 실시간 추론을 수행했습니다.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">종합 평가</span>
                  <span
                    className={`font-bold text-sm ${result.overall_status?.includes("위험") ? "text-red-600" : "text-green-600"}`}
                  >
                    {result.overall_status}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-800">
                Multi-Task AI 12대 독성 위험 확률 예측:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.predictions).map(([task, prob]) => {
                  const isHigh = prob >= 50;
                  return (
                    <div
                      key={task}
                      className={`p-2.5 border-l-4 rounded-r-lg border-y border-r border-gray-200 bg-gray-50 flex justify-between items-center ${isHigh ? "border-l-red-500" : "border-l-green-500"}`}
                    >
                      <span className="text-xs font-semibold text-gray-700">
                        {task}
                      </span>
                      <span
                        className={`text-xs font-bold ${isHigh ? "text-red-600" : "text-green-600"}`}
                      >
                        {prob}% {isHigh && "⚠️"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
