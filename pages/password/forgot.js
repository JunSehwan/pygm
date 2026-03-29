import React from "react";
import Head from "next/head";
import PasswordResetPhonePage from "components/Auth/PasswordResetPhonePage";

export default function ForgotPassword() {
  return (
    <>
      <Head>
        <title>비밀번호 재설정 | 차밍수프</title>
      </Head>
      <PasswordResetPhonePage />
    </>
  );
}