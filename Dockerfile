# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 및 Next.js 빌드
COPY . .
# 백엔드 API URL 환경변수 (필요시 수정)
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
RUN npm run build

# 2. Runner Stage (최종 실행 이미지)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과물 및 실행 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["npm", "start"]