import LegalPage, { LegalSection } from "components/About/LegalPage";
import { LEGAL_META } from "components/About/LegalMeta";

function BulletList({ items }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function DeductionRule({ number, title, children }) {
  return (
    <li className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3">
      <h3 className="font-bold text-slate-900">
        {number}) {title}
      </h3>
      <p className="mt-1.5">{children}</p>
    </li>
  );
}

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="환불정책"
      description="차밍수프 디지털 이용권과 투윅스 예치금의 취소, 차감 및 환급 기준 안내"
      serviceLabel="차밍수프 · 투윅스"
      businessInfoTitle="14. 사업자 정보"
      wide
    >
      <div className="rounded-md border border-violet-200 bg-violet-50 px-4 py-4 text-[13px] leading-6 text-slate-700 shadow-sm">
        본 환불정책은 넥스트퍼스가 운영하는 차밍수프 및 투윅스 서비스의 유료 결제,
        디지털 이용권, 예치금, 취소 및 환급 기준에 대해 정합니다.
      </div>

      <LegalSection title="1. 기본 원칙">
        <p>회사는 전자상거래 등 관련 법령과 본 환불정책에 따라 환불 및 청약철회를 처리합니다.</p>
        <p>
          차밍수프의 유료 서비스는 스푼 등 디지털 이용권 형태로 제공될 수 있으며,
          투윅스는 실제 오프라인 만남을 전제로 하는 매칭 운영 서비스로 제공됩니다.
        </p>
        <p>
          투윅스에서 결제되는 예치금은 서비스 이용료가 아니라, 실제 만남 약속의
          책임감 있는 진행과 노쇼 방지를 위한 보증 성격의 금액입니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 차밍수프 디지털 이용권 환불 기준">
        <p>아래에 해당하는 경우 전액 환불 또는 동일 수량의 스푼 복구가 가능합니다.</p>
        <BulletList
          items={[
            "결제 오류 또는 중복 결제가 발생한 경우",
            "결제 완료 후 구매한 스푼이 정상 지급되지 않은 경우",
            "회사의 시스템 오류 또는 운영상 사유로 유료 기능을 정상 이용하지 못한 경우",
            "법령상 청약철회가 인정되는 경우",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. 차밍수프 디지털 이용권 환불 제한 기준">
        <p>아래에 해당하는 경우 환불이 제한될 수 있습니다.</p>
        <BulletList
          items={[
            "이미 사용한 스푼 또는 제공이 개시된 디지털 이용권",
            "회원의 단순 변심으로 이미 사용한 유료 기능의 환불을 요청하는 경우",
            "약관 위반, 허위 정보, 부정 이용, 계정 제재 사유가 확인된 경우",
            "회원 간 호감 불일치, 상대방의 거절, 무응답 등 서비스 하자로 보기 어려운 사유",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. 차밍수프 매칭 미성사 시 복구 기준">
        <p>
          차밍수프에서 매칭이 성사되지 않은 경우, 회사는 서비스 운영 기준에 따라
          사용 스푼을 복구할 수 있습니다.
        </p>
        <p>
          다만 현금 환불 여부는 결제 상태, 사용 여부, 회사 귀책 여부, 관계 법령을
          종합하여 판단합니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 투윅스 예치금 기본 정책">
        <p>투윅스는 실제 오프라인 만남을 전제로 운영되는 서비스입니다.</p>
        <p>
          투윅스 참여 시 노쇼 방지와 일정 책임을 위해 예치금이 요구될 수 있습니다.
          예치금 금액은 신청 화면 또는 결제 화면에서 별도 안내합니다.
        </p>
        <p>
          현재 투윅스의 기본 예치금은 <strong className="font-bold text-slate-900">30,000원</strong>입니다.
          외부 플랫폼이나 별도 상품을 통해 참여한 경우에는 신청 단계에서 안내된 회원별
          기준 예치금이 적용될 수 있습니다.
        </p>
        <p>예치금은 아래 기준에 따라 환급, 차감 또는 다음 회차 크레딧으로 전환될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="6. 투윅스 예치금 전액 환급 기준">
        <p>아래에 해당하는 경우 예치금은 전액 환급됩니다.</p>
        <BulletList
          items={[
            "신청 후 회사 검토 결과 매칭 진행이 어려운 경우",
            "회사의 운영상 사유로 매칭이 진행되지 못한 경우",
            "매칭 후보가 제안되지 않은 상태에서 회원이 참여 취소를 요청한 경우",
            "매칭 제안 단계에서 회원이 ‘이번 회차 패스’ 또는 거절 의사를 표시한 경우",
            "상대방의 취소, 무응답, 노쇼 등으로 인해 본인의 귀책 없이 만남이 진행되지 못한 경우",
            "정상적으로 만남에 참여한 후 환급을 요청한 경우",
          ]}
        />
        <p>
          정상 참여자의 예치금은 회원 요청에 따라 환급하거나, 다음 회차 참여 크레딧으로
          전환할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 투윅스 예치금 차감 기준">
        <p>
          투윅스는 양쪽 회원의 시간 약속을 보호하기 위해 아래 기준에 따라 예치금을
          차감할 수 있습니다.
        </p>
        <ol className="space-y-2.5">
          <DeductionRule number="1" title="매칭 제안 단계에서 거절하는 경우">
            매칭 파트너 제안 단계에서 만남 의사를 표시하기 전 거절하거나 패스하는 경우,
            예치금 차감은 없습니다.
          </DeductionRule>
          <DeductionRule number="2" title="양쪽 만남 의사 확인 후, 일정 확정 전 취소하는 경우">
            두 회원 모두 만남 의사를 표시한 이후, 일정 또는 장소가 최종 확정되기 전에
            단순 변심으로 취소하거나 일정 선택에 협조하지 않는 경우 회원별 기준 예치금의
            <strong className="font-bold text-slate-900"> 30%</strong>가 차감될 수 있습니다.
          </DeductionRule>
          <DeductionRule number="3" title="일정 확정 후, 만남 전날까지 취소하는 경우">
            일정과 장소가 확정된 이후 만남 전날까지 단순 변심 또는 개인 사정으로 취소하는 경우
            회원별 기준 예치금의 <strong className="font-bold text-slate-900"> 50%</strong>가 차감될 수 있습니다.
          </DeductionRule>
          <DeductionRule number="4" title="당일 취소, 무단 불참, 노쇼의 경우">
            만남 당일 취소, 사전 연락 없는 불참, 약속 시간 이후 일정 시간 이상 연락 없이
            미도착하는 경우 회원별 기준 예치금 <strong className="font-bold text-slate-900">전액</strong>이
            환급되지 않을 수 있습니다.
          </DeductionRule>
        </ol>
        <p>
          기본 예치금이 30,000원인 경우 차감액은 9,000원·15,000원·30,000원이며,
          기준 예치금이 20,000원인 경우 6,000원·10,000원·20,000원입니다.
        </p>
        <p>노쇼 또는 무단 불참이 확인된 회원은 이후 투윅스 이용이 제한될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="8. 투윅스 매칭 제안 및 패스 기준">
        <p>투윅스는 회차별로 어울릴 가능성이 있는 매칭 파트너를 제안합니다.</p>
        <p>
          회원은 매칭 제안 단계에서 언제든지 패스할 수 있습니다. 다만 반복적인 패스,
          무응답, 일정 선택 지연이 계속될 경우 실제 만남 의사가 낮은 회원으로 판단되어
          추후 매칭 우선순위가 낮아지거나 매칭이 제한될 수 있습니다.
        </p>
        <p>
          안전상 이유, 허위정보 의심, 핵심 조건 불일치 등 정당한 사유가 있는 패스는
          운영자 검토 후 불이익 없이 처리될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="9. 투윅스 연락처 공개 및 만남 후 환불 기준">
        <p>투윅스는 첫 만남 전까지 개인 연락처를 원칙적으로 공개하지 않습니다.</p>
        <p>
          연락처는 만남 후 두 회원 모두 추가 연락 의사와 연락처 공개에 동의한 경우에만
          공개됩니다.
        </p>
        <p>아래 사유는 환불 또는 예치금 환급의 사유가 되지 않을 수 있습니다.</p>
        <BulletList
          items={[
            "만남 후 호감이 생기지 않은 경우",
            "한쪽만 추가 연락을 희망한 경우",
            "상대방이 연락처 공개에 동의하지 않은 경우",
            "성향, 대화 스타일, 분위기 등이 기대와 달랐던 경우",
            "회사의 귀책으로 보기 어려운 회원 간 호감 불일치",
          ]}
        />
        <p>
          다만 상대방의 부적절한 언행, 허위정보, 안전 문제, 노쇼 등 운영상 문제가
          확인되는 경우 회사는 예치금 환급, 우선 재매칭, 이용 제한 등 필요한 조치를
          취할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="10. 외부 플랫폼 결제 및 베타 참여권">
        <p>
          프립, 문토, 소모임 등 외부 플랫폼을 통해 결제한 상품은 해당 플랫폼의
          환불정책과 결제 취소 절차가 우선 적용될 수 있습니다.
        </p>
        <p>
          외부 플랫폼에서 판매되는 베타 참여권, 신청권, 모임 참여권 등은 투윅스 자체
          예치금과 별도로 운영될 수 있습니다.
        </p>
        <p>
          외부 플랫폼 결제 상품의 환불 가능 여부, 수수료, 취소 가능 기한은 각 상품
          상세페이지 및 해당 플랫폼의 정책에 따릅니다.
        </p>
      </LegalSection>

      <LegalSection title="11. 환불 제한 및 이용 제한 사유">
        <p>아래에 해당하는 경우 환불 또는 예치금 환급이 제한될 수 있습니다.</p>
        <BulletList
          items={[
            "허위 정보 입력",
            "타인의 사진, 신분, 직업, 인증자료 도용",
            "기혼, 사실혼, 교제 중인 상대가 있음에도 이를 숨긴 경우",
            "부적절한 언행, 성희롱, 위협, 욕설, 스토킹 등 다른 회원에게 피해를 주는 행위",
            "무단 불참, 반복적인 당일 취소, 반복 무응답",
            "회사의 운영을 방해하거나 부정한 방법으로 서비스를 이용한 경우",
            "약관 또는 운영정책을 위반한 경우",
          ]}
        />
        <p>
          이 경우 회사는 환불 제한과 별도로 이용 제한, 매칭 제한, 계정 정지 등의 조치를
          취할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="12. 환불 신청 방법">
        <p>환불을 요청하는 회원은 아래 정보를 포함하여 고객센터로 접수해주시기 바랍니다.</p>
        <BulletList
          items={[
            "이름 또는 계정 정보",
            "연락처",
            "결제 일시",
            "결제수단",
            "환불 요청 금액",
            "환불 요청 사유",
            "투윅스의 경우 해당 매칭 또는 회차 정보",
          ]}
        />
        <div className="rounded-md bg-slate-50 px-3.5 py-3">
          <p>
            고객센터 전화:{" "}
            <a
              href={`tel:${LEGAL_META.phoneNumber.replace(/-/g, "")}`}
              className="font-bold text-slate-900 underline underline-offset-4"
            >
              {LEGAL_META.phoneNumber}
            </a>
          </p>
          <p>
            이메일:{" "}
            <a
              href={`mailto:${LEGAL_META.email}`}
              className="font-bold text-slate-900 underline underline-offset-4"
            >
              {LEGAL_META.email}
            </a>
          </p>
        </div>
      </LegalSection>

      <LegalSection title="13. 처리 기간">
        <p>환불 요청은 접수 후 영업일 기준 3~7일 이내 확인하여 안내합니다.</p>
        <p>
          카드사, 결제대행사, 금융기관의 처리 일정에 따라 실제 결제 취소 또는 환급 완료
          시점은 달라질 수 있습니다.
        </p>
        <p>
          예치금 환급은 회사 확인 후 영업일 기준 3일 이내 처리를 원칙으로 하되,
          금융기관 또는 결제수단의 사정에 따라 실제 입금 시점은 달라질 수 있습니다.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
