const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1";

export interface ChemicalSearchResult {
  found: boolean;
  source: "DATABASE" | "AI_MODEL";
  model_id?: string;
  history_id?: number;
  smiles?: string;
  data?: Record<string, any>;
  predictions?: Record<string, number>;
  overall_status?: string;
  message?: string;
}

export interface AIModel {
  id: string;
  name: string;
  type: string;
  status: "active" | "coming_soon";
  description: string;
}

export interface PredictionHistory {
  history_id: number;
  smiles: string;
  created_at: string;
  total_tasks: number;
  toxic_count: number;
}

// 1. 화학물질 검색/예측 API 호출
export async function searchChemical(
  query: string,
  modelId: string = "lstm_multitask",
): Promise<ChemicalSearchResult> {
  const res = await fetch(
    `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&model_id=${modelId}`,
  );
  if (!res.ok) throw new Error("API 요청 실패");
  return res.json();
}

// 2. 지원 가능한 AI 모델 목록 조회 API 호출
export async function getSupportedModels(): Promise<{ models: AIModel[] }> {
  const res = await fetch(`${API_BASE_URL}/models`);
  if (!res.ok) throw new Error("모델 목록 조회 실패");
  return res.json();
}

// 3. AI 예측 히스토리 목록 조회 API 호출
export async function getPredictionHistory(): Promise<{
  history: PredictionHistory[];
}> {
  const res = await fetch(`${API_BASE_URL}/history`);
  if (!res.ok) throw new Error("히스토리 조회 실패");
  return res.json();
}

export interface HistoryComparisonItem {
  history_id: number;
  smiles: string;
  created_at: string;
  model_name: string;
  predictions: Record<string, number>;
}

// 비교 데이터 조회 API
export async function getComparisonHistory(
  ids: number[],
): Promise<{ comparison: HistoryComparisonItem[] }> {
  const res = await fetch(
    `${API_BASE_URL}/history/compare?ids=${ids.join(",")}`,
  );
  if (!res.ok) throw new Error("비교 데이터 조회 실패");
  return res.json();
}

export interface AttributionChar {
  char: string;
  score: number;
  normalized_score: number;
}

export interface SimilarSubstance {
  smiles: string;
  sample_name: string;
  cas: string;
  similarity: number;
}

export interface PredictionDetailResponse {
  detail: {
    history_id: number;
    smiles: string;
    created_at: string;
    model_id: string;
    model_name: string;
    predictions: Record<string, number>;
  };
  attributions: AttributionChar[];
  similar_substances: SimilarSubstance[];
}

// 특정 예측 이력 XAI 상세 분석 데이터 조회
export async function getPredictionDetail(
  historyId: number,
): Promise<PredictionDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/history/${historyId}/detail`);
  if (!res.ok) throw new Error("상세 예측 분석 데이터 조회 실패");
  return res.json();
}
