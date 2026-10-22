import LegalPage, { LegalSection } from "components/About/LegalPage";
import { LEGAL_META } from "components/About/LegalMeta";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="개인정보처리방침"
      description="차밍수프 개인정보처리방침 안내"
    >
      <LegalSection title="1. 수집하는 개인정보 항목">
        <p>
          회사는 회원가입, 본인확인, 프로필 작성, 매칭 운영을 위해 이름,
          닉네임, 생년월일, 성별, 휴대폰번호, 이메일, 프로필 정보, 사진,
          결제 및 이용 기록 등을 수집할 수 있습니다.
        </p>

        <p className="mt-3">
          본인인증 시에는 본인확인기관 및 인증수단에 따라 이름, 생년월일,
          성별, 휴대전화번호, 내·외국인 정보, 본인확인 결과값 및
          <strong> CI(연계정보)</strong> 등 본인확인에 필요한 정보를 처리할 수
          있습니다.
        </p>

        <p className="mt-3">
          CI(연계정보)는 본인 식별, 동일인 확인, 중복가입 및 부정이용 방지를
          위해 필요한 범위에서 처리하며 일반 프로필이나 공개 화면에는
          노출하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 개인정보의 이용 목적">
        <p>
          수집한 개인정보는 회원 식별, 본인확인, 프로필 승인, 매칭 제공,
          유료 서비스 결제, 고객 문의 처리, 부정 이용 방지, 중복가입 확인,
          서비스 개선을 위해 이용됩니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 보유 및 이용기간">
        <p>
          개인정보는 회원 탈퇴 또는 수집·이용 목적 달성 시 지체 없이
          파기합니다. 다만 관계 법령에 따라 보존이 필요한 정보는 해당
          법령에서 정한 기간 동안 보관할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="4. 제3자 제공 및 개인정보 처리위탁">
        <p>
          회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다.
          다만 서비스 제공에 필요한 범위에서 본인인증, 결제, 문자 발송,
          데이터 보관 등의 업무를 외부 업체에 위탁할 수 있습니다.
        </p>

        <div className="mt-3">
          <p>
            <strong>본인인증 연동 수탁업체:</strong> 주식회사 코리아포트원,
            주식회사 케이지이니시스
          </p>
          <p className="mt-2">
            <strong>위탁업무:</strong> KG이니시스 통합인증 연동 및
            본인확인 결과 처리
          </p>
          <p className="mt-2">
            <strong>처리항목:</strong> 이름, 휴대전화번호, 생년월일, 성별,
            내·외국인 정보, 본인확인 결과값,
            <strong> CI(연계정보)</strong> 및 인증수단에 따라 제공되는
            본인확인 정보
          </p>
        </div>
      </LegalSection>

      <LegalSection title="5. 이용자의 권리">
        <p>
          회원은 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리 정지를
          요청할 수 있습니다. 요청은 고객센터 이메일 또는 서비스 내 문의
          기능을 통해 접수할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 개인정보의 안전성 확보조치">
        <p>
          회사는 개인정보 접근 권한 최소화, 중요 정보 보호, 접속기록 관리 등
          개인정보 보호를 위한 기술적·관리적 조치를 적용합니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 개인정보 보호책임자">
        <p>개인정보 관련 문의는 아래 고객센터로 접수할 수 있습니다.</p>
        <p>담당: {LEGAL_META.representativeName}</p>
        <p>전화: {LEGAL_META.phoneNumber}</p>
        <p>이메일: {LEGAL_META.email}</p>
      </LegalSection>

      <LegalSection title="8. 시행일">
        <p>본 개인정보처리방침의 시행일은 {LEGAL_META.effectiveDate}입니다.</p>
      </LegalSection>
    </LegalPage>
  );
}
