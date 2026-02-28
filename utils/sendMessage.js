// utils/sendMessage.js
export const sendMessage = async (phone, message) => {
  try {
    const res = await fetch('/api/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('문자 전송 실패:', error);
  }
};