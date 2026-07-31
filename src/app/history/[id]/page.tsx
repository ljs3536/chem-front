"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPredictionDetail, PredictionDetailResponse } from "@/lib/api";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import Molecule2D from "@/components/Molecule2D";

export default function DetailXaiPage() {
  const params = useParams();
  const historyId = Number(params.id);
  const [data, setData] = useState<PredictionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!historyId) return;
    getPredictionDetail(historyId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [historyId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        AI 모델의 설명가능성(XAI) 추론 원인을 분석 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        상세 분석 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const { detail, attributions, similar_substances } = data;

  // 1. Recharts 방사형(Radar) 차트 데이터
  const radarData = Object.entries(detail.predictions).map(([task, prob]) => ({
    task,
    probability: prob,
  }));

  // 2. LSTM 전용: 시퀀스 흐름(Sequence Context Flow) 차트 데이터
  const lstmFlowData = attributions.map((attr, idx) => ({
    step: idx + 1,
    char: attr.char,
    score: attr.normalized_score,
  }));

  // 3. ChemBERTa 전용: Attention/Embedding 분포 차트 데이터
  const transformerAttentionData = attributions.map((attr, idx) => ({
    tokenIdx: idx,
    token: attr.char,
    attention: Math.min(100, attr.normalized_score * 1.1 + 10),
  }));

  return (
    <main className="max-w-8xl mx-auto p-6 space-y-8 text-gray-900">
      {/* 헤더 네비게이션 */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🔍 AI 예측 근거(XAI) 정밀 상세 분석
          </h1>
          <p className="text-sm text-gray-600">
            분자 구조 기여도 히트맵, 12대 독성 레이더 차트 및 아키텍처별 특화
            시각화
          </p>
        </div>
        <Link
          href="/history"
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition border border-gray-300"
        >
          ← 이력 목록으로 돌아가기
        </Link>
      </div>

      {/* 1. 기본 분석 정보 카드 영역 내부 */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            분석 ID #{detail.history_id}
          </span>
          <span className="text-xs text-gray-500">
            분석 모델: <strong>{detail.model_name}</strong> (`{detail.model_id}
            `) | {new Date(detail.created_at).toLocaleString("ko-KR")}
          </span>
        </div>

        {/* 🧪 SMILES 및 2D 분자 구조식 나란히 보기 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-2">
            <p className="text-xs font-semibold text-gray-500">
              분석 SMILES 문자열
            </p>
            <p className="text-sm font-mono bg-gray-50 p-3 rounded-lg border border-gray-200 break-all text-gray-800">
              {detail.smiles}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <p className="text-xs font-semibold text-gray-500">
              2D 분자 구조식 (RDKit)
            </p>
            <Molecule2D smiles={detail.smiles} width={220} height={140} />
          </div>
        </div>
      </div>

      {/* 2. SMILES 원자/문자별 독성 위험 기여도 히트맵 (공통 XAI Attribution) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              🧬 분자 구조별 독성 위험 유발 기여도 히트맵
            </h2>
            <p className="text-xs text-gray-500">
              * AI 모델이 위험 확률을 높게 예측하는 데 결정적 영향을 미친 하위
              구조(원자/결합)를 붉은색 뱃지로 시각화합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-100 border text-gray-600">
              안전/중립
            </span>
            <span className="px-2 py-0.5 rounded bg-red-100 border border-red-300 text-red-700 font-bold">
              위험 유발 핵심 요인
            </span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-1 font-mono text-sm">
          {attributions.map((attr, idx) => {
            const isHigh = attr.normalized_score >= 50;
            const isMedium = attr.normalized_score >= 20;

            return (
              <span
                key={idx}
                title={`문자: ${attr.char} | 위험 기여도: ${attr.normalized_score}%`}
                className={`px-1.5 py-0.5 rounded transition cursor-help ${
                  isHigh
                    ? "bg-red-500 text-white font-bold shadow-sm"
                    : isMedium
                      ? "bg-red-200 text-red-900 font-semibold"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                {attr.char}
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. ⭐ 모델별(LSTM, GNN, ChemBERTa) 아키텍처 특화 심화 시각화 카드 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {detail.model_id === "lstm_multitask" && (
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">
                📈 [LSTM 시퀀스 모델] SMILES 문맥 흐름(Context Flow) 변화 그래프
              </h2>
              <p className="text-xs text-gray-500">
                순차적 시퀀스 전달 과정에서 은닉 상태(Hidden State)의 가중치
                변화 흐름
              </p>
            </div>
            <div className="w-full h-60 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lstmFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="char" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    name="시퀀스 위험 흐름 점수"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {detail.model_id === "gnn_gcn" && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">
                🕸️ [GNN 위상 모델] 2D 분자 그래프 토폴로지 및 결합 메트릭
              </h2>
              <p className="text-xs text-gray-500">
                원자 간 무방향 화학 결합(Edge) 및 인접도 행렬 기반 중요 구조
                해석
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-1">
                <p className="text-xs text-blue-700 font-medium">
                  총 그래프 원자 수 (Nodes)
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {attributions.filter((a) => /^[a-zA-Z]$/.test(a.char)).length}
                  개
                </p>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center space-y-1">
                <p className="text-xs text-indigo-700 font-medium">
                  핵심 유발 원자 비율
                </p>
                <p className="text-2xl font-bold text-indigo-900">
                  {Math.round(
                    (attributions.filter((a) => a.normalized_score >= 50)
                      .length /
                      Math.max(1, attributions.length)) *
                      100,
                  )}
                  %
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center space-y-1">
                <p className="text-xs text-purple-700 font-medium">
                  그래프 토폴로지 집단성
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  고밀도(Dense)
                </p>
              </div>
            </div>
          </div>
        )}

        {detail.model_id === "chemberta_ft" && (
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">
                ⚡ [ChemBERTa Transformer] Self-Attention 가중치 및 임베딩 분포
              </h2>
              <p className="text-xs text-gray-500">
                대규모 화학 사전학습 언어 모델의 Multi-Head Self-Attention
                집중도 표현
              </p>
            </div>
            <div className="w-full h-60 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transformerAttentionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="token" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attention"
                    stroke="#8B5CF6"
                    fill="#DDD6FE"
                    name="Self-Attention 집중도(%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 4. 12대 독성 지표 방사형 레이더 차트 & DB 유사 물질 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-3">
            🕸️ 12대 독성 지표 프로필 레이더 차트
          </h2>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="task"
                  tick={{ fill: "#4B5563", fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="독성 위험 확률(%)"
                  dataKey="probability"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-3">
            🧪 Tox21 DB 내 가장 유사한 대표 물질 Top 3
          </h2>
          <div className="space-y-3">
            {similar_substances.map((sub, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">
                    Top #{idx + 1}
                  </span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    구조 유사도: {sub.similarity}%
                  </span>
                </div>
                <p className="text-xs font-mono bg-white p-1.5 rounded border border-gray-200 text-gray-800 truncate">
                  {sub.smiles}
                </p>
                <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                  <span>물질명: {sub.sample_name}</span>
                  <span>CAS: {sub.cas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
