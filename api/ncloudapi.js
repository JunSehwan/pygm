export async function chatCompletions(text) {
  try {
    const option = {
      method: "POST",
      body: JSON.stringify({
        prompt: "마크다운 파일을 읽고 질문을 만들어주세요. 질문은 다음과 같은 형식으로 출력해주세요. [\"첫 번째 질문\", \"두 번째 질문\", ...]",
        text: text,
      }),
    };

    const response = await fetch("/question-generator/v1/json", option);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (err) {
    console.error("Error during fetch:", err);
  }

  return null;
}

// front : const result = await chatCompletions(githubData);

// const [message, setMessage] = useState("");

// useEffect(() => {
//   // Cloud Function의 URL
//   const fetchMessage = async () => {
//     try {
//       const response = await fetch(
//         "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/helloWorld"
//       );
//       const text = await response.text();
//       setMessage(text);
//     } catch (error) {
//       console.error("Error fetching message:", error);
//     }
//   };

//   fetchMessage();
// }, []);