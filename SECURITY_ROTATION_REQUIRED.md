# 배포 전 Secret 조치 필요

이번 보안 패치는 코드/Rules에서 자격증명 노출 경로를 줄이고, 공유 ZIP에 민감 파일이 다시 포함되지 않도록 ignore 규칙을 추가합니다.

다만 이미 외부로 공유된 적이 있는 자격증명은 코드 수정만으로 폐기할 수 없습니다. 배포 전 운영 계정에서 다음 항목을 직접 재발급/폐기하세요.

1. NCP SMS Access/Secret Key (실사용 키라면 재발급 후 기존 키 폐기)
2. OpenAI API Key (실사용 키라면 재발급 후 기존 키 폐기)
3. Google/Firebase service account JSON key (Cloud Functions 런타임에는 로컬 JSON 파일이 필요하지 않으므로 기존 key를 폐기하고 파일 삭제)
4. SMTP 비밀번호 및 별도 signing secret이 실제 운영값이고 외부 공유 이력이 있다면 함께 교체

운영 코드/공유 ZIP에는 `functions/.env`, `serviceAccountKey.json`을 포함하지 마세요.
