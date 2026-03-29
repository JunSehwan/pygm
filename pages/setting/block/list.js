import React from "react";
import Head from "next/head";
import RequireAuth from "components/Common/RequireAuth";
import BlockListPage from "components/Setting/Block/BlockListPage";

export default function SettingBlockListPage() {
  return (
    <>
      <Head>
        <title>차단 리스트 | 차밍수프</title>
        <meta
          name="description"
          content="등록된 지인 차단 및 회사명 차단 항목을 확인하고 해제합니다."
        />
      </Head>

      <RequireAuth
        redirect="/setting/block/list"
        fallback={<div className="min-h-screen bg-zinc-50" />}
      >
        <BlockListPage />
      </RequireAuth>
    </>
  );
}