import React from "react";
import Head from "next/head";
import AdminDashboardPage from "components/Admin/AdminDashboardPage";

export default function AdminIndexPage() {
  return (
    <>
      <Head>
        <title>관리자 페이지 | 차밍수프</title>
        <meta
          name="description"
          content="회원관리, 카드관리, 신고검토, 결제확인, 매칭현황을 관리하는 관리자 페이지"
        />
      </Head>

      <AdminDashboardPage />
    </>
  );
}
