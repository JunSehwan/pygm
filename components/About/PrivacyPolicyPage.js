import React from "react";
import { PiShieldCheckDuotone, PiCheckCircleFill } from "react-icons/pi";

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

function PolicyBullet({ text }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-3">
      <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px] text-violet-600" />
      <div className="text-[13px] leading-5 text-slate-700">{text}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <AboutFrame
      activeTab="privacy"
      title="개인정보처리방침"
      description={`${LEGAL_META.serviceName}는 회원의 개인정보를 관련 법령에 따라 처리하며, 수집 항목·이용 목적·보유기간·권리행사 방법을 공개합니다.`}
      hero={
        <section className="rounded-md border border-violet-100 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#eef2ff_100%)] px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/80 text-violet-600 ring-1 ring-violet-100">
              <PiShieldCheckDuotone className="text-[24px]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold leading-6 text-slate-900">
                개인정보처리방침
              </div>
              <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
                수집 항목, 이용 목적, 보유기간, 처리위탁, 권리행사 및 보호조치를
                안내합니다.
              </div>
            </div>
          </div>
        </section>
      }
    >
      <LegalSectionCard title="기본 정보">
        <InfoLine label="서비스명" value={LEGAL_META.serviceName} />
        <InfoLine label="운영사" value={LEGAL_META.companyName} />
        <InfoLine label="시행일" value={LEGAL_META.effectiveDate} />
        <InfoLine
          label="문의 이메일"
          value={LEGAL_META.privacyOfficerEmail}
        />
      </LegalSectionCard>

      <LegalSectionCard title="1. 개인정보의 처리 목적">
        <PolicyBullet text="회원 가입 및 본인 식별, 계정 관리" />
        <PolicyBullet text="프로필 등록, 매칭, 차밍카드 및 서비스 기능 제공" />
        <PolicyBullet text="유료 결제 처리, 주문 내역 관리, 환불 및 민원 처리" />
        <PolicyBullet text="부정 이용 방지, 서비스 보안 유지, 운영 정책 집행" />
        <PolicyBullet text="고객문의 응대, 공지사항 전달, 분쟁 해결" />
        <PolicyBullet text="서비스 품질 개선, 접속 통계 분석, 장애 대응" />
      </LegalSectionCard>

      <LegalSectionCard title="2. 수집하는 개인정보 항목">
        <p className="font-semibold text-slate-800">가. 회원가입 및 로그인</p>
        <p>
          이메일 주소, 비밀번호, 닉네임, 서비스 이용을 위한 식별자, 가입일시
        </p>

        <p className="pt-2 font-semibold text-slate-800">나. 프로필 작성</p>
        <p>
          프로필 사진, 성별, 생년월일, 거주지역, 활동지역, 근무지역, 직업,
          학력, 키, 취미, 관심사, MBTI, 연애성향, 가치관 설문 응답, 자기소개,
          차밍카드 작성 및 답변 내용
        </p>

        <p className="pt-2 font-semibold text-slate-800">다. 본인확인 및 인증</p>
        <p>
          휴대전화번호, 이름, 생년월일, 성별, 내/외국인 정보, 본인확인 결과값,
          DI(동일인 식별 및 중복가입 확인을 위한 식별값), 재직 또는 추가 인증을 위해
          회원이 제출한 정보 및 이미지
        </p>

        <p className="pt-2 font-semibold text-slate-800">라. 결제 및 환불</p>
        <p>
          주문번호, 결제수단 정보, 결제 내역, 구매 상품, 환불 처리 내역
        </p>

        <p className="pt-2 font-semibold text-slate-800">마. 고객문의</p>
        <p>문의 내용, 첨부파일, 회신 정보, 처리 결과</p>

        <p className="pt-2 font-semibold text-slate-800">바. 자동 수집 정보</p>
        <p>
          접속 IP, 기기 정보, 브라우저 정보, OS 정보, 접속 로그, 쿠키,
          서비스 이용 기록, 접속 일시, 오류 기록
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="3. 개인정보의 보유 및 이용기간">
        <p>
          1. 회원의 개인정보는 원칙적으로 회원 탈퇴 또는 처리 목적 달성 시
          지체 없이 파기합니다.
        </p>
        <p>
          2. 다만, 관계 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간
          동안 별도로 보관합니다.
        </p>

        <div className="space-y-2 pt-1">
          <PolicyBullet text="표시·광고에 관한 기록: 6개월" />
          <PolicyBullet text="계약 또는 청약철회 등에 관한 기록: 5년" />
          <PolicyBullet text="대금결제 및 재화 등의 공급에 관한 기록: 5년" />
          <PolicyBullet text="소비자의 불만 또는 분쟁처리에 관한 기록: 3년" />
        </div>

        <p className="pt-1">
          3. 부정 이용 방지 및 서비스 보안 목적으로 필요한 정보는 합리적인
          범위에서 별도 분리 보관할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="4. 개인정보의 제3자 제공">
        <p>
          회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다.
        </p>
        <p>
          다음의 경우에 한하여 관련 법령에 따라 개인정보를 제공할 수 있습니다.
        </p>

        <div className="space-y-2 pt-1">
          <PolicyBullet text="회원이 사전에 별도 동의한 경우" />
          <PolicyBullet text="법령에 특별한 규정이 있거나 수사기관 등의 적법한 요청이 있는 경우" />
          <PolicyBullet text="생명, 신체, 재산의 이익 보호를 위하여 긴급히 필요한 경우" />
        </div>
      </LegalSectionCard>

      <LegalSectionCard title="5. 개인정보 처리의 위탁">
        <p>
          회사는 원활한 서비스 제공 및 회원 본인확인, 서비스 운영을 위하여 필요한
          범위에서 개인정보 처리업무를 외부에 위탁할 수 있습니다.
        </p>

        <p className="pt-2 font-semibold text-slate-800">
          가. 본인인증 연동 위탁
        </p>

        <div className="space-y-2 pt-1">
          <InfoLine label="수탁업체" value="주식회사 코리아포트원" />
          <InfoLine
            label="위탁업무"
            value="휴대폰 본인인증 연동, 본인확인 결과 연계 및 처리"
          />
          <InfoLine
            label="위탁목적"
            value="회원가입 시 본인확인, 동일인 중복가입 방지, 계정 도용 방지, 부정이용 방지"
          />
          <InfoLine
            label="처리항목"
            value="이름, 휴대전화번호, 생년월일, 성별, 내/외국인 정보, 본인확인 결과값, DI(동일인 식별 및 중복가입 확인값)"
          />
          <InfoLine
            label="보유기간"
            value="본인확인 절차 완료 시까지 또는 관계 법령 및 회사 내부정책에 따른 보관기간까지"
          />
        </div>

        <p className="pt-3 font-semibold text-slate-800">
          나. 일반 운영 위탁
        </p>

        <div className="space-y-2 pt-1">
          <PolicyBullet text="클라우드 인프라, 데이터베이스, 인증, 파일 저장 등 서비스 운영 업무" />
          <PolicyBullet text="문자 또는 알림 발송 업무" />
        </div>

        <p className="pt-3 text-[13px] leading-6 text-slate-600">
          회사는 위탁계약 체결 시 관련 법령에 따라 위탁업무 수행 목적 외 개인정보
          처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독
          및 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를
          안전하게 처리하는지를 감독합니다.
        </p>

        <p className="pt-3 text-[13px] leading-6 text-slate-600">
          회사는 현재 기관 간 연계 식별을 위한 CI는 요청하지 않으며, 동일인 식별 및
          중복가입 확인을 위한 DI만 처리합니다. 향후 위탁업체 또는 위탁업무 내용이
          변경되는 경우 본 개인정보처리방침을 통하여 지체 없이 반영 및 고지합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="6. 개인정보의 파기 절차 및 방법">
        <p>
          1. 개인정보는 보유기간 경과, 처리 목적 달성, 회원 탈퇴 등 파기 사유가
          발생하면 지체 없이 파기합니다.
        </p>
        <p>
          2. 전자적 파일 형태의 정보는 복구 또는 재생되지 않도록 기술적 방법을
          사용하여 삭제합니다.
        </p>
        <p>
          3. 종이 문서에 기록된 개인정보는 분쇄 또는 소각 등의 방법으로
          파기합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="7. 정보주체의 권리와 행사 방법">
        <p>
          회원은 자신의 개인정보에 대하여 열람, 정정, 삭제, 처리정지, 동의철회
          및 회원탈퇴를 요청할 수 있습니다.
        </p>
        <p>
          회원은 서비스 내 프로필 수정 기능 또는 고객문의 채널을 통해 권리를
          행사할 수 있습니다.
        </p>
        <p>
          회사는 법령에서 정한 사유가 없는 한 지체 없이 필요한 조치를
          합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="8. 쿠키 및 자동 수집 장치의 이용">
        <p>
          회사는 로그인 상태 유지, 서비스 이용 편의 제공, 보안 및 접속 통계
          분석을 위하여 쿠키 또는 이에 준하는 기술을 사용할 수 있습니다.
        </p>
        <p>
          이용자는 브라우저 설정을 통하여 쿠키 저장을 거부하거나 삭제할 수
          있습니다. 다만 이 경우 일부 기능 이용이 제한될 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="9. 개인정보의 안전성 확보 조치">
        <div className="space-y-2">
          <PolicyBullet text="개인정보 접근 권한 최소화 및 권한 관리" />
          <PolicyBullet text="비밀번호 및 중요 정보의 암호화 또는 이에 준하는 보호조치" />
          <PolicyBullet text="접속기록 관리, 비정상 접근 감지, 보안 점검" />
          <PolicyBullet text="개인정보 처리 시스템에 대한 기술적·관리적 보호조치" />
          <PolicyBullet text="개인정보 취급자 교육 및 내부 관리계획 운영" />
        </div>
      </LegalSectionCard>

      <LegalSectionCard title="10. 국외 이전에 관한 사항">
        <p>
          회사가 국외 사업자의 클라우드 또는 솔루션을 사용하는 경우, 관련 법령
          및 운영 현황에 따라 이전 항목, 이전 국가, 이전 일시 및 방법, 이전받는
          자와 보유기간을 본 방침에 반영합니다.
        </p>
        {/* <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] leading-5 text-amber-800">
          Firebase 또는 해외 SaaS를 실제 사용 중이면 이 조항에 국가명,
          이전받는 자, 연락처, 이전 항목, 보유기간을 구체적으로 넣어야 합니다.
        </div> */}
      </LegalSectionCard>

      <LegalSectionCard title="11. 아동의 개인정보 처리">
        <p>
          회사는 관련 법령 및 서비스 운영정책에 따라 필요한 경우 아동 또는
          미성년자에 대한 가입 제한 또는 별도 동의 절차를 적용할 수 있습니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard title="12. 개인정보 보호책임자 및 문의처">
        <InfoLine
          label="책임자"
          value={LEGAL_META.privacyOfficerName}
        />
        <InfoLine
          label="이메일"
          value={LEGAL_META.privacyOfficerEmail}
        />
        {/* <InfoLine
          label="대표 연락처"
          value={LEGAL_META.phone}
        /> */}
        <InfoLine
          label="사업장 주소"
          value={LEGAL_META.address}
        />
      </LegalSectionCard>

      <LegalSectionCard title="13. 권익침해 구제 방법">
        <p>
          회원은 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에
          문의할 수 있습니다.
        </p>
        <div className="space-y-2 pt-1">
          <PolicyBullet text="개인정보침해신고센터" />
          <PolicyBullet text="개인정보분쟁조정위원회" />
          <PolicyBullet text="대검찰청" />
          <PolicyBullet text="경찰청 사이버범죄 신고시스템" />
        </div>
      </LegalSectionCard>

      <LegalSectionCard title="14. 방침의 변경">
        <p>
          본 방침은 법령, 서비스 내용 또는 내부 운영정책이 변경되는 경우 개정될
          수 있습니다.
        </p>
        <p>
          중요한 변경이 있는 경우 회사는 시행일 전 서비스 화면을 통해 공지합니다.
        </p>
      </LegalSectionCard>
    </AboutFrame>
  );
}