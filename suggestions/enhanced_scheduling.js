
import admin from 'firebase-admin';
import schedule from 'node-schedule';

// 매일 오전 9시에 실행 (서버 시간 기준)
schedule.scheduleJob('0 9 * * *', async () => {
    const now = admin.firestore.Timestamp.now();
    const threeDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const lastTime = userData.lastQuestionTime;

        if (!lastTime) continue;

        const daysSince = Math.floor(
            (now.toDate().getTime() - lastTime.toDate().getTime()) / (1000 * 60 * 60 * 24)
        );

        // 0, 1, 2일 경과한 경우만 푸시
        if (daysSince >= 0 && daysSince < 3) {
            const tokensSnap = await db
                .collection('users')
                .doc(userId)
                .collection('deviceTokens')
                .get();
            const tokens = tokensSnap.docs.map(d => d.id);

            if (!tokens.length) continue;

            const message = {
                notification: {
                    title: '계속 대화를 이어가보세요!',
                    body: `마지막 질문 후 ${daysSince}일이 지났습니다.`,
                },
                token: tokens[0],
            };

            try {
                await admin.messaging().send(message);
                console.log(`알림 전송: ${userId}`);
            } catch (err) {
                console.error(`푸시 실패: ${userId}`, err);
            }
        }
    }
});
