import { verifyIdToken } from 'utils/firebaseAdmin';

export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.cookies.token || null;

  if (!token) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  const decoded = await verifyIdToken(token);

  // ✅ 관리자 UID가 아니면 접근 불가
  if (!decoded || decoded.uid !== "9OqbfNZW6lgq5NLB0lAigkYQxME2") {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return { props: {} };
}