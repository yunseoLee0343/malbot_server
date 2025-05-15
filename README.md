
# Firebase 푸시 알림 서버

이 Node.js 서버는 Firebase Admin SDK와 `node-schedule`을 사용하여 Firestore에 저장된 사용자 활동 타임스탬프를 기준으로 푸시 알림을 전송합니다. 또한 Firebase Cloud Messaging(FCM)용 디바이스 토큰 등록 API도 제공합니다.

---

## 기능

- Firestore에 사용자별 디바이스 토큰 등록
- 사용자 활동(`lastQuestionTime`)을 기준으로 예약된 푸시 알림 전송
- 1분마다 테스트 푸시 알림 전송
- 기본 포트 3000에서 실행
- 도커(Docker)로 쉽게 배포 가능

---

## 설정

1. `serviceAccountKey.json` (Firebase Admin SDK, Service Account) 발급

2. 프로젝트 루트에 `serviceAccountKey.json` 배치

3. Firestore와 FCM(Firebase Cloud Messaging) 활성화 확인

4. 도커 컨테이너 실행 시 `GOOGLE_CLOUD_PROJECT` 환경변수를 Firebase 프로젝트 ID(doctor-malbot)으로 설정 


---

## API

### 디바이스 토큰 등록

**POST** `/register-token`

**요청 바디 JSON 예:**

```json
{
  "userId": "user123",
  "token": "device-fcm-token"
}
```

지정한 사용자에 대해 디바이스 토큰을 등록합니다.

---

## 예약된 푸시 알림

* **(현재) 1분마다:** 모든 사용자 중 첫 번째 등록된 토큰으로 제목이 "테스트"인 테스트 푸시 알림을 전송합니다.
* **(제안안) 매일 오전 9시:** 마지막 질문이 0, 1, 2일 전인 사용자에게 대화를 계속하라는 알림을 보냅니다.

---

## 도커로 실행하기

아래 명령어로 도커 컨테이너에서 서버를 직접 실행할 수 있습니다: (Windows용용)

```bash
docker run \
  -v ${PWD}:/app \
  -w /app \
  -p 3000:3000 \
  -e GOOGLE_CLOUD_PROJECT=doctor-malbot \
  node:20 \
  sh -c "npm install && npm start"
```

* `${PWD}`는 현재 디렉터리를 컨테이너에 마운트합니다.
* `-w /app`은 컨테이너 내 작업 디렉터리를 설정합니다.
* `-p 3000:3000`은 3000번 포트를 외부에 노출합니다.
* `GOOGLE_CLOUD_PROJECT` 환경 변수에 Firebase 프로젝트 ID를 설정하세요.

---

## 선택 사항: Dockerfile

아래 Dockerfile을 사용해 도커 이미지를 빌드할 수도 있습니다:

```Dockerfile
# Node.js 베이스 이미지
FROM node:20

# 앱 디렉터리 생성
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 소스 복사
COPY . .

# 앱 시작
CMD ["npm", "start"]
```

이미지 빌드 및 실행:

```bash
docker build -t firebase-push-server .
docker run -p 3000:3000 -e GOOGLE_CLOUD_PROJECT=doctor-malbot firebase-push-server
```

---

## 참고 사항

* Firestore `users` 문서에 `lastQuestionTime` 필드가 Firestore Timestamp 타입으로 포함되어 있어야 합니다.
* 디바이스 토큰은 `users/{userId}/deviceTokens/{token}` 경로에 저장됩니다.
* 서버는 발송된 알림과 오류를 로그로 기록합니다.
