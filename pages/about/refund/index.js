import LegalPage, { LegalSection } from "components/About/LegalPage";
import { LEGAL_META } from "components/About/LegalMeta";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="환불정책"
      description="차밍수프 결제 취소, 청약철회, 환불 기준 안내"
    >
      <LegalSection title="1. 기본 원칙">
        <p>차밍수프의 유료 서비스는 스푼 등 디지털 이용권 형태로 제공됩니다.</p>
        <p>환불 및 청약철회는 전자상거래 등 관련 법령과 본 환불정책에 따라 처리됩니다.</p>
      </LegalSection>

      <LegalSection title="2. 환불 가능 기준">
        <p>아래에 해당하는 경우 전액 환불 또는 동일 수량의 스푼 복구가 가능합니다.</p>
        <p>• 결제 오류 또는 중복 결제가 발생한 경우</p>
        <p>• 결제 완료 후 구매한 스푼이 정상 지급되지 않은 경우</p>
        <p>• 회사의 시스템 오류 또는 운영상 사유로 유료 기능을 정상 이용하지 못한 경우</p>
        <p>• 법령상 청약철회가 인정되는 경우</p>
      </LegalSection>

      <LegalSection title="3. 환불 제한 기준">
        <p>아래에 해당하는 경우 환불이 제한될 수 있습니다.</p>
        <p>• 이미 사용한 스푼 또는 제공이 개시된 디지털 이용권</p>
        <p>• 회원의 단순 변심으로 이미 사용한 유료 기능의 환불을 요청하는 경우</p>
        <p>• 약관 위반, 허위 정보, 부정 이용, 계정 제재 사유가 확인된 경우</p>
        <p>• 회원 간 호감 불일치, 상대방의 거절, 무응답 등 서비스 하자로 보기 어려운 사유</p>
      </LegalSection>

      <LegalSection title="4. 매칭 미성사 시 복구 기준">
        <p>차밍수프는 매칭이 성사되지 않은 경우 서비스 운영 기준에 따라 사용 스푼을 복구할 수 있습니다.</p>
        <p>다만 현금 환불 여부는 결제 상태, 사용 여부, 회사 귀책 여부, 관계 법령을 종합하여 판단합니다.</p>
      </LegalSection>

      <LegalSection title="5. 환불 신청 방법">
        <p>환불 신청은 결제 일시, 결제수단, 계정 정보, 요청 사유를 포함하여 고객센터로 접수해주세요.</p>
        <p>고객센터 전화: {LEGAL_META.phoneNumber}</p>
        <p>이메일: {LEGAL_META.email}</p>
      </LegalSection>

      <LegalSection title="6. 처리 기간">
        <p>환불 요청은 접수 후 영업일 기준 3~7일 이내 확인하여 안내합니다.</p>
        <p>카드사, 결제대행사, 금융기관의 처리 일정에 따라 실제 취소 또는 환급 완료 시점은 달라질 수 있습니다.</p>
      </LegalSection>
    </LegalPage>
  );
}
