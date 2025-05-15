import express from 'express';
import admin from 'firebase-admin';
import schedule from 'node-schedule';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});
console.log(`project id is ${serviceAccount.project_id}.`)
const db = admin.firestore();
const app = express();
app.use(express.json());

// 토큰 등록 엔드포인트
app.post('/register-token', async (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token)
    return res.status(400).json({ message: 'userId, token 필요' });

  await db
    .collection('users')
    .doc(userId)
    .collection('deviceTokens')
    .doc(token)
    .set({ token, createdAt: admin.firestore.Timestamp.now() }, { merge: true });

  res.json({ message: '토큰 등록 완료' });
});

// 1분 간격 푸시 스케줄링
schedule.scheduleJob('*/1 * * * *', async () => {
  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const tokensSnap = await db
      .collection('users')
      .doc(userId)
      .collection('deviceTokens')
      .get();
    const tokens = tokensSnap.docs.map(d => d.id);
    if (!tokens.length) continue;

    const message = {
      notification: { title: '테스트', body: '단일 푸시입니다.' },
      token: tokens[0],
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.error(`Error sending to token (${tokens[0]}):`, error.message);

      if (error.code === 'messaging/registration-token-not-registered') {
        console.log(`삭제 중: ${tokens[0]}`);
        await db
          .collection('users')
          .doc(userId)
          .collection('deviceTokens')
          .doc(tokens[0])
          .delete();
      }
    }
  }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));