# Node.js 베이스 이미지
FROM node:20

# 앱 디렉토리 생성
WORKDIR /app

# package.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# 나머지 파일 복사
COPY . .

# 앱 실행
CMD ["npm", "start"]
