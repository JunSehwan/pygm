import LegalPage, { LegalSection } from "components/About/LegalPage";
import { LEGAL_META } from "components/About/LegalMeta";

export default function ServiceTermsPage() {
  return (
    <LegalPage
      title="이용약관"
      description="차밍수프 서비스 이용약관 안내"
    >
      <LegalSection title="제1조 목적">
        <p>본 약관은 {LEGAL_META.companyName}이 운영하는 {LEGAL_META.serviceName} 서비스의 이용 조건, 절차, 회원과 회사의 권리·의무 및 책임사항을 정함을 목적으로 합니다.</p>
      </LegalSection>

      <LegalSection title="제2조 서비스 내용">
        <p>{LEGAL_META.serviceName}은 회원 프로필, 차밍카드, 호감 표시, 매칭 및 연락처 공개 등 이성 소개 관련 기능을 제공합니다.</p>
        <p>회사는 서비스 운영, 안전 관리, 부정 이용 방지, 회원 보호를 위해 프로필 승인·제한·노출 보류 등의 조치를 할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제3조 회원가입 및 본인확인">
        <p>회원은 본인의 정확한 정보를 입력해야 하며, 타인의 정보 또는 허위 정보를 사용할 수 없습니다.</p>
        <p>회사는 안전한 서비스 운영을 위해 휴대폰 본인인증, 프로필 사진, 인증 자료 등의 제출을 요청할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제4조 유료 서비스 및 결제">
        <p>회원은 스푼 등 서비스 내 유료 이용권을 구매하여 일부 유료 기능을 이용할 수 있습니다.</p>
        <p>유료 서비스의 가격, 사용 기준, 차감 기준은 결제 화면 또는 서비스 화면에 표시된 내용을 따릅니다.</p>
      </LegalSection>

      <LegalSection title="제5조 청약철회 및 환불">
        <p>청약철회 및 환불은 전자상거래 등 관련 법령과 회사의 환불정책에 따릅니다.</p>
        <p>이미 사용되었거나 회원의 요청에 따라 서비스 제공이 개시된 디지털 이용권은 법령상 허용되는 범위 내에서 환불이 제한될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제6조 금지행위">
        <p>회원은 허위 정보 등록, 타인 사칭, 영리 목적 홍보, 불쾌감을 주는 대화, 개인정보 무단 공유, 서비스 운영 방해 행위를 해서는 안 됩니다.</p>
        <p>약관 위반 또는 부정 이용이 확인될 경우 회사는 이용 제한, 매칭 제한, 계정 정지 등의 조치를 할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제7조 책임의 제한">
        <p>회사는 회원 간 만남의 성사, 교제, 결혼 등 특정 결과를 보장하지 않습니다.</p>
        <p>회원 간 오프라인 만남과 이후 관계에서 발생하는 분쟁은 원칙적으로 당사자 간 해결해야 하며, 회사는 관련 법령상 책임 범위 내에서 필요한 조치를 지원합니다.</p>
      </LegalSection>

      <LegalSection title="제8조 문의">
        <p>서비스 이용, 결제, 환불, 개인정보 관련 문의는 고객센터 전화 또는 이메일로 접수할 수 있습니다.</p>
        <p>고객센터: {LEGAL_META.phoneNumber} / {LEGAL_META.email}</p>
      </LegalSection>
    </LegalPage>
  );
}
