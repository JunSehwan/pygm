import React from "react";
import { PiNoteDuotone, PiCheckCircleFill } from "react-icons/pi";

import AboutFrame from "./AboutFrame";
import LegalSectionCard from "./LegalSectionCard";
import { LEGAL_META } from "./LegalMeta";

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-slate-50 px-3 py-3">
      <div className="min-w-[82px] text-[12px] font-semibold text-slate-800">
        {label}
      </div>
      <div className="flex-1 break-all text-[13px] leading-5 text-slate-600">
        {value}
      </div>
    </div>
  );
}

export default function ServiceTermsPage() {
  return (
    <AboutFrame
      activeTab="service"
      title="이용약관"
      description={`${LEGAL_META.serviceName} 서비스 이용과 관련된 권리, 의무, 책임사항 및 결제·환불 기준을 안내합니다.`}
      hero={
        <section className="rounded-md border border-violet-100 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#eef2ff_100%)] px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/80 text-violet-600 ring-1 ring-violet-100">
              <PiNoteDuotone className="text-[24px]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold leading-6 text-slate-900">
                {LEGAL_META.serviceName} 이용약관
              </div>
              <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
                본 약관은 회원가입, 프로필 이용, 콘텐츠 작성, 차밍스푼 결제 및
                환불에 관한 기준을 규정합니다.
              </div>
            </div>
          </div>
        </section>
      }
    >
      <LegalSectionCard title="사업자 정보">
        <InfoLine label="서비스명" value={LEGAL_META.serviceName} />
        <InfoLine label="운영사" value={LEGAL_META.companyName} />
        <InfoLine label="대표자" value={LEGAL_META.representativeName} />
        {/* <InfoLine label="대표 연락처" value={LEGAL_META.phone} /> */}
        <InfoLine
          label="사업자등록번호"
          value={LEGAL_META.businessRegistrationNumber}
        />
        {/* <InfoLine
          label="통신판매업 신고"
          value={LEGAL_META.mailOrderBusinessNumber}
        /> */}
        <InfoLine label="주소" value={LEGAL_META.address} />
        {/* <InfoLine label="대표 연락처" value={LEGAL_META.phone} /> */}
        <InfoLine label="대표 이메일" value={LEGAL_META.email} />
        <InfoLine label="시행일" value={LEGAL_META.effectiveDate} />
      </LegalSectionCard>

      <LegalSectionCard title="제1조 목적">
        <p>
          본 약관은 {LEGAL_META.companyName}(이하 “회사”라 합니다)가 제공하는{" "}
          {LEGAL_META.serviceName} 및 관련 서비스의 이용과 관련하여 회사와
          회원의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제2조 정의">
        <p>
          1. “서비스”란 회사가 웹, 모바일 웹 또는 기타 온라인 수단을 통하여
          제공하는 프로필 조회, 매칭, 차밍카드, 알림, 유료 포인트 및 이에
          부수하는 제반 기능을 말합니다.
        </p>
        <p>
          2. “회원”이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입하여
          서비스를 이용하는 자를 말합니다.
        </p>
        <p>
          3. “프로필”이란 회원이 서비스 내에 등록한 사진, 자기소개, 성향,
          가치관, 생활정보, 직업, 학력, 취미 등 본인을 설명하는 정보를 말합니다.
        </p>
        <p>
          4. “차밍카드”란 회원이 작성하거나 답변하는 질문형 콘텐츠를 말합니다.
        </p>
        <p>
          5. “차밍스푼” 또는 “스푼”이란 서비스 내 유료 또는 무상으로 지급되는
          포인트형 이용재화를 말합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제3조 약관의 게시와 변경">
        <p>
          1. 회사는 본 약관의 내용을 회원이 쉽게 확인할 수 있도록 서비스
          화면에 게시합니다.
        </p>
        <p>
          2. 회사는 관계 법령을 위반하지 않는 범위에서 약관을 개정할 수
          있습니다.
        </p>
        <p>
          3. 회사가 약관을 개정하는 경우 시행일과 개정 사유를 명시하여 시행일
          전부터 공지합니다.
        </p>
        <p>
          4. 회원에게 불리한 내용으로 약관을 변경하는 경우 회사는 해당 내용을
          시행일 전 상당한 기간 동안 공지합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제4조 회원가입 및 계정 관리">
        <p>
          1. 회원은 회사가 정한 절차에 따라 정확한 정보를 입력하여 회원가입을
          신청하여야 합니다.
        </p>
        <p>
          2. 회사는 다음 각 호의 경우 가입 신청을 승낙하지 않거나 사후적으로
          이용계약을 해지할 수 있습니다.
        </p>
        <div className="space-y-2 pt-1">
          {[
            "타인의 정보 또는 허위 정보를 사용한 경우",
            "중복 가입, 비정상적 자동화 가입 또는 부정한 목적이 확인된 경우",
            "법령 또는 본 약관을 위반한 이력이 있는 경우",
            "서비스 운영을 현저히 방해하거나 다른 회원에게 중대한 피해를 줄 우려가 있는 경우",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-3"
            >
              <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px] text-violet-600" />
              <div className="text-[13px] leading-5 text-slate-700">{item}</div>
            </div>
          ))}
        </div>
        <p>
          3. 회원은 계정 정보의 정확성과 최신성을 유지해야 하며, 계정 관리
          소홀로 발생한 손해에 대한 책임은 회원에게 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제5조 서비스의 제공 및 변경">
        <p>
          1. 회사는 회원에게 프로필 등록, 프로필 열람, 차밍카드 작성 및 열람,
          호감 표현, 알림, 결제, 고객지원 등의 서비스를 제공합니다.
        </p>
        <p>
          2. 회사는 운영상, 기술상, 정책상 필요에 따라 서비스의 전부 또는 일부를
          변경할 수 있습니다.
        </p>
        <p>
          3. 회사는 시스템 점검, 장애 대응, 운영정책 변경, 법령 준수 등의
          사유가 있는 경우 서비스 제공을 일시 제한할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제6조 회원 콘텐츠 및 프로필 정보">
        <p>
          1. 회원이 등록한 프로필, 사진, 자기소개, 차밍카드 질문 및 답변,
          기타 게시물의 내용과 책임은 해당 회원에게 있습니다.
        </p>
        <p>
          2. 회사는 서비스 운영, 노출 최적화, 신고 처리, 법령 준수, 화면 구성
          개선을 위하여 회원 콘텐츠의 배열, 노출범위, 미리보기 형식을 조정할 수
          있습니다.
        </p>
        <p>
          3. 회사는 다음 각 호의 게시물을 사전 통지 없이 제한, 비공개 또는
          삭제할 수 있습니다.
        </p>
        <div className="space-y-2 pt-1">
          {[
            "허위사실, 사칭, 신원 도용, 타인 사생활 침해",
            "음란, 혐오, 차별, 폭력, 협박, 불법 행위 유도",
            "광고, 영업, 다단계, 투자권유, 외부 홍보 목적 게시물",
            "연락처, 계좌번호 등 과도한 개인정보를 무단 공개하는 행위",
            "관계 법령 또는 본 약관에 위반되는 내용",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-3"
            >
              <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px] text-violet-600" />
              <div className="text-[13px] leading-5 text-slate-700">{item}</div>
            </div>
          ))}
        </div>
      </LegalSectionCard>

      <LegalSectionCard title="제7조 차밍스푼의 이용">
        <p>
          1. 차밍스푼은 서비스 내 특정 기능을 이용하기 위한 포인트형 재화입니다.
        </p>
        <p>
          2. 차밍스푼의 사용 단위, 차감 시점, 복구 여부 및 무상 지급 여부는
          서비스 화면 또는 별도 정책 페이지에 표시된 기준을 따릅니다.
        </p>
        <p>
          3. 무상으로 지급된 스푼은 환급 대상이 아니며, 유효기간이 별도로
          표시된 경우 해당 기간이 경과하면 소멸될 수 있습니다.
        </p>
        <p>
          4. 회사는 부정 이용, 결제 취소 남용, 비정상적 거래가 확인된 경우
          관련 스푼을 회수하거나 사용을 제한할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제8조 결제, 청약철회 및 환급">
        <p>
          1. 회원은 서비스에서 제공하는 결제수단을 이용하여 차밍스푼 또는 기타
          유료 서비스를 구매할 수 있습니다.
        </p>
        <p>
          2. 유료로 구매한 차밍스푼이 전혀 사용되지 않은 경우, 회원은 결제일
          또는 충전일로부터 7일 이내에 청약철회를 요청할 수 있습니다.
        </p>
        <p>
          3. 차밍스푼의 전부 또는 일부가 사용된 경우에는 사용된 부분에
          해당하는 금액을 제외하고 환급이 이루어질 수 있습니다.
        </p>
        <p>
          4. 회원이 관련 법령 및 서비스 화면에 고지된 내용에 따라 사용 즉시
          효력이 발생하는 디지털 재화를 구매하고 그 사용이 개시된 경우,
          청약철회가 제한될 수 있습니다.
        </p>
        <p>
          5. 환급은 관계 법령 및 결제수단 운영정책에 따라 동일 결제수단 취소를
          원칙으로 하며, 동일 방식 취소가 불가능한 경우 회사가 정한 절차에 따라
          진행됩니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제9조 이용제한 및 서비스 종료">
        <p>
          1. 회사는 회원이 본 약관, 운영정책 또는 관계 법령을 위반하는 경우
          사안의 경중에 따라 경고, 콘텐츠 제한, 일부 기능 제한, 계정 정지,
          회원자격 박탈 등의 조치를 할 수 있습니다.
        </p>
        <p>
          2. 회사는 장기간 미이용 계정, 안전사고 우려 계정, 부정 이용이 의심되는
          계정에 대하여 본인 확인 또는 이용 제한 조치를 요청할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제10조 회사의 권리와 의무">
        <p>
          1. 회사는 관계 법령과 본 약관이 금지하는 행위를 하지 않으며, 안정적인
          서비스 제공을 위하여 지속적으로 노력합니다.
        </p>
        <p>
          2. 회사는 회원의 개인정보를 개인정보처리방침에 따라 처리합니다.
        </p>
        <p>
          3. 회사는 서비스의 공정성과 안전성을 해치는 행위에 대하여 필요한
          조치를 취할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제11조 회원의 의무">
        <p>
          1. 회원은 자신의 계정을 직접 관리하여야 하며, 계정을 타인에게
          대여·양도·공유하여서는 안 됩니다.
        </p>
        <p>
          2. 회원은 서비스를 이용하면서 타인의 권리를 침해하거나 범죄 또는
          불법행위에 해당하는 행위를 하여서는 안 됩니다.
        </p>
        <p>
          3. 회원은 회사의 사전 동의 없이 서비스를 영업, 광고, 홍보, 스팸 발송
          또는 외부 유입 수단으로 이용하여서는 안 됩니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제12조 지식재산권">
        <p>
          1. 서비스에 관한 저작권, 상표권, 디자인, 데이터베이스, 화면 구성,
          문구, 로고 등 일체의 권리는 회사 또는 정당한 권리자에게 귀속됩니다.
        </p>
        <p>
          2. 회원은 회사의 사전 승인 없이 서비스를 복제, 배포, 전송, 전시,
          수정, 2차적 저작물 작성 등의 방법으로 이용할 수 없습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제13조 면책">
        <p>
          1. 회사는 천재지변, 불가항력, 통신장애, 제3자 서비스 장애, 회원의
          귀책사유로 인한 손해에 대하여 책임을 지지 않습니다.
        </p>
        <p>
          2. 회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한
          분쟁, 거래, 약속 불이행 등에 개입하지 않으며, 특별한 사정이 없는 한
          이에 대한 책임을 지지 않습니다.
        </p>
        <p>
          3. 회사는 회원이 등록한 정보의 진실성, 정확성, 적법성을 보증하지
          않습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="제14조 분쟁 해결 및 관할">
        <p>
          1. 회사와 회원 간 분쟁이 발생한 경우 당사자는 신의성실의 원칙에 따라
          협의하여 해결하도록 노력합니다.
        </p>
        <p>
          2. 본 약관과 관련한 분쟁에는 대한민국 법령을 적용합니다.
        </p>
        <p>
          3. 회사와 회원 간 소송이 제기되는 경우 민사소송법상 관할법원을
          전속적 합의관할로 합니다.
        </p>
      </LegalSectionCard>
    </AboutFrame>
  );
}