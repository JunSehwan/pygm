
import { motion } from 'framer-motion';
import { BsChevronRight } from 'react-icons/bs';
import { ABOUT_Wrapper, EmptySpace, ABOUT_SecondTitle, ABOUT_Title, ABOUT_Text, ABOUT_Sub } from '../styles';

const index = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.8 }}
    className="mt-28 md:mt-28 mb-4"
  >
    <div className="flex flex-col ml-3">
      <h2 className="text-2xl md:text-4xl text-blue-700">넥스트퍼스 이용약관</h2>
      <div className="border-b-2 w-full mb-3 border-blue-700 hr-about"/>
    </div>
    <div className="flex flex-col md:flex-row mt-5 ml-4 mr-5 gap-5 text-base text-skyColor md:ml-1 about-text">
      <div className="flex flex-col gap-1 md:mt-3 text-gray-600">
        <ABOUT_Text>넥스트퍼스 관련 제반 서비스의 이용과 관련하여 필요한 사항을 규정합니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 1조 목적</ABOUT_SecondTitle>
        <ABOUT_Text>이 약관은 넥스트퍼스가 운영하는 PYGMalion의 서비스를 이용함에 있어 이용조건 및 절차, PYGMalion 이용자간의 권리 및 의무에 관한 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 2조 약관의 효력 및 변경</ABOUT_SecondTitle>
        <ABOUT_Text>① 약관의 내용은 별도의 통지 없이 수시로 갱신될 수 있고, 회원은 언제든지 PYGMalion에서 약관의 최신 내용을 확인할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>② 이 약관은 PYGMalion에 그 내용을 공지함으로써 효력이 발생하며, 변경된 약관에 동의하지 아니하는 경우, 회원은 PYGMalion 회원에서 탈퇴할 수 있으며, 계속 사용의 경우는 변경된 약관에 동의하는 것으로 간주됩니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 3조 용어의 정의</ABOUT_SecondTitle>
        <ABOUT_Text>① 서비스란 PYGMalion에서 제공하는 제반정보를 말합니다.</ABOUT_Text>
        <ABOUT_Text>② 회원이란 PYGMalion에 기업정보를 등록한 기업회원,개인정보를 제공한 개인회원으로 회원가입을 한 자로서, PYGMalion이 제공하는 모든 서비스를 이용할 수 있는 주체를 말합니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 4조 회원가입</ABOUT_SecondTitle>
        <ABOUT_Text>① 이용자가 회원가입을 신청하는 경우 PYGMalion가 정한 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 효력을 발생합니다.</ABOUT_Text>
        <ABOUT_Text>② PYGMalion은 ①항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 인정합니다.</ABOUT_Text>
        <ABOUT_Sub>- 허위로 가입신청을 한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 중복으로 신청하여 이용하는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 공공질서 또는 미풍양속을 저해할 목적으로 신청하였을 경우</ABOUT_Sub>
        <ABOUT_Sub>- 이 약관을 위반하거나 PYGMalion의 운영에 현저히 지장이 있다고 판단되는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기타 PYGMalion 관리자가 필요하다고 인정하는 경우</ABOUT_Sub>

        <ABOUT_SecondTitle>제 5조 회원정보의 변경</ABOUT_SecondTitle>
        <ABOUT_Text>회원은 회원가입 시 기재한 개인정보가 변경되었을 경우 온라인으로 직접 수정할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>이때 변경하지 않은 정보로 인해 발생되는 문제에 대한 책임은 회원에게 있습니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 6조 회원 탈퇴 및 취소</ABOUT_SecondTitle>
        <ABOUT_Text>① 회원이 회원탈퇴를 하고자 하는 때에는 온라인으로 직접 탈퇴를 할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>② 회원에게 다음 각 항에 해당하는 사유가 발생하였을 경우 PYGMalion은 사전 통보 없이 회원가입을 취소할 수 있습니다.</ABOUT_Text>
        <ABOUT_Sub>- 타인 회원ID 및 비밀번호를 도용한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 타인에게 해를 입히거나 입힐 수 있는 행위를 하는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 사행행위 조장, 저속·음란물 게시 등 공공질서 또는 미풍양속을 저해하는 행위를 계획 또는 실행한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 부당한 방법으로 정보통신망에 의하여 처리, 보관, 전송되는 타인의 정보를 훼손하거나 타인의 개인정보를 수집, 저장, 침해, 도용 또는 누설하는 행위를 하는경우</ABOUT_Sub>
        <ABOUT_Sub>- 불필요하거나 승인되지 않은 광고, 판촉물 게재, 정크메일, 스팸메일을 발송하는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 수신자의 명시적인 수신거부 의사에 반하는 광고성 전자우편을 전송하는 행위를 하는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 관련 법률에서 금지하는 행위 또는 이 약관을 위반하는 행위를 하는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기타 PYGMalion 관리자가 필요하다고 인정하는 경우</ABOUT_Sub>

        <ABOUT_SecondTitle>제 7조 서비스 이용시간</ABOUT_SecondTitle>
        <ABOUT_Text>① 관리자의 직접적인 지원을 받지 않는 서비스의 이용시간은 업무상 또는 기술상 특별한 지장이 없는 한 연중(1일 24시간) 이용할 수 있습니다. 다만, 천재지변, 시스템점검 등의 사유로 서비스를 중단할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>② 관리자가 직접 제공하는 서비스는 넥스트퍼스 근무시간을 원칙으로 합니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 8조 서비스 제공의 제한 및 중지</ABOUT_SecondTitle>
        <ABOUT_Text>PYGMalion은 다음의 경우에는 서비스 제공을 일부 또는 전부를 제한하거나 중단할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>서비스 중단으로 발생되는 문제에 대하여 PYGMalion은 책임을 지지 않습니다.</ABOUT_Text>
        <ABOUT_Sub>- 천재지변, 국가 비상사태, 정부예산의 변경 등 기타 불가항력의 사유가 발생하거나 발생할 우려가 있는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 서비스용 설비의 보수, 공사 또는 장애로 인한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 서비스 이용의 폭주 등으로 이용에 지장이 있을 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기간통신사업자가 전기통신서비스를 중지했을 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기타 PYGMalion 관리자가 필요하다고 인정하는 경우</ABOUT_Sub>

        <ABOUT_SecondTitle>제 9조 서비스의 변경 및 회원 서비스</ABOUT_SecondTitle>
        <ABOUT_Text>① 회원에 대한 서비스의 내용은 PYGMalion의 정책에 의해 결정되며 변경 또는 중단될 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>② PYGMalion은 이 약관을 준수하는 회원 모두에게 모든 정보와 서비스를 무료로 제공하는 것을 원칙으로 하고 있습니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 10조 컨텐츠</ABOUT_SecondTitle>
        <ABOUT_Text>① 컨텐츠의 정확성, 안정성 또는 품질 등과 관련하여 의문사항이 있으시면 직접 컨텐츠를 만든 자에게 문의하시기 바랍니다.</ABOUT_Text>
        <ABOUT_Text>PYGMalion은 컨텐츠의 정확성, 안전성 등과 관련하여 책임을 지지 않습니다.</ABOUT_Text>
        <ABOUT_Text>② 회원이 게시한 컨텐츠의 내용에 대한 권리와 책임은 해당 회원에게 있습니다.</ABOUT_Text>
        <ABOUT_Text>③ PYGMalion은 회원이 게시한 컨텐츠를 사전 통지 없이 PYGMalion 내에서 편집, 이동할 수 있는 권리를 보유하며, 비상업적 목적으로 이용자의 컨텐츠를 활용할 수 있습니다.</ABOUT_Text>
        <ABOUT_Text>④ 다음의 경우 사전 통지 없이 컨텐츠를 삭제할 수 있습니다.</ABOUT_Text>

        <ABOUT_Sub>- 타인에게 해를 입히거나 입힐 수 있는 내용을 포함한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 불법, 음란, 저속하다고 판단되는 게시물을 게시한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 다른 회원 또는 제3자를 비방하거나 명예를 손상시키는 내용인 경우</ABOUT_Sub>
        <ABOUT_Sub>- 공공질서 및 미풍양속에 위반되는 내용인 경우</ABOUT_Sub>
        <ABOUT_Sub>- 범죄적 행위에 결부된다고 인정되는 내용인 경우</ABOUT_Sub>
        <ABOUT_Sub>- 제3자의 저작권 등 기타 권리를 침해하는 내용인 경우</ABOUT_Sub>
        <ABOUT_Sub>- 관련 법률에서 금지하는 행위 또는 본 서비스의 약관의 내용에 위배되는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기타 적절하지 못한 내용을 담고 있는 등 PYGMalion 관리자가 필요하다고 인정하는 경우</ABOUT_Sub>


        <ABOUT_SecondTitle>제 11조 "회원"의 의무</ABOUT_SecondTitle>
        <ABOUT_Text>① 회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항, 기타 PYGMalion이 통지하는 사항을 준수하여야 하며, PYGMalion의 업무에 방해되는 행위를 하여서는 안됩니다.</ABOUT_Text>
        <ABOUT_Text>② 회원은 서비스를 이용하여 얻은 정보를 PYGMalion의 사전 승낙 없이 복사, 복제, 변경, 번역, 출판, 방송 기타의 방법으로 사용하거나 이를 타인에게 제공할 수 없습니다.</ABOUT_Text>
        <ABOUT_Text>③ 회원은 본인의 책임 하에 ID와 비밀번호의 보안을 유지하셔야 하며, 자신의 ID와 비밀번호를 사용하여 발생하는 모든 결과에 대해 전적인 책임이 있습니다. 본인의 승인 없이 ID나 비밀번호가 사용되는 등 문제가 발생하시면 즉시 PYGMalion에 신고하셔야 합니다. 또한 부여받은 ID 및 비밀번호는 타인에게 전매 또는 양도할 수 없습니다.</ABOUT_Text>
        <ABOUT_Text>④ 회원은 서비스 이용을 위해 회원으로 가입할 경우 현재의 사실과 일치하는 완전한 정보를 제공하셔야 하며, 완료정보에 변경사항이 발생할 경우 즉시 갱신하셔야 합니다.</ABOUT_Text>
        <ABOUT_Text>⑤ 회원은 PYGMalion가 제공하는 정보와 서비스를 이용하여 영업활동을 할 수 없습니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 12조 "넥스트퍼스"의 의무</ABOUT_SecondTitle>
        <ABOUT_Text>① PYGMalion 회원이 안정적으로 서비스를 받을 수 있도록 항상 노력합니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 13조 개인정보의 보호</ABOUT_SecondTitle>
        <ABOUT_Text>① PYGMalion은 회원의 정보를 PYGMalion을 운영하거나 개선하는 목적으로만 사용합니다.</ABOUT_Text>
        <ABOUT_Text>② PYGMalion이 취득한 회원정보는 본인의 승낙 없이 제3자에게 공개하지 않습니다.</ABOUT_Text>
        <ABOUT_Text>③ PYGMalion은 회원의 개인정보를 매우 중요하게 다루고 있습니다.</ABOUT_Text>

        <ABOUT_SecondTitle>제 14조 개인정보의 공개</ABOUT_SecondTitle>
        <ABOUT_Text>PYGMalion은 다음과 같은 경우에 법에서 허용하는 범위 내에서 이용자의 성명, 전자우편주소 등 개인정보를 제3자에게 제공할 수 있습니다.</ABOUT_Text>
        <ABOUT_Sub>- 회원이 서비스를 이용함에 있어 관련 법률을 위반하여 수사기관이나 기타 정부기관으로부터 정보제공을 요청 받는 경우</ABOUT_Sub>
        <ABOUT_Sub>- 회원의 법률위반, 본 약관위반을 포함하여 부정행위 완료 등의 정보보호업무를 위해 필요한 경우</ABOUT_Sub>
        <ABOUT_Sub>- 기타 법률에 의해 요구되는 경우</ABOUT_Sub>

        <ABOUT_SecondTitle>제 15조 면책조항</ABOUT_SecondTitle>
        <ABOUT_Text>① 회원이 PYGMalion 서비스 제공으로부터 기대되는 이익을 얻지 못하였거나 서비스자료에 대한 취사선택 또는 이용으로 발생하는 손익에 대하여 PYGMalion은 책임을 지지 않습니다.</ABOUT_Text>
        <ABOUT_Text>② PYGMalion은 회원의 귀책사유로 인한 PYGMalion 이용의 장애에 대하여 책임을 지지 않습니다.</ABOUT_Text>
        <ABOUT_Text>③ PYGMalion은 회원이 PYGMalion에 게시하거나 또는 전송한 내용에 관하여는 책임을 지지 않습니다.</ABOUT_Text>
        <ABOUT_Text>④ 회원 상호간 또는 회원과 제3자 상호간에 PYGMalion 서비스를 매개로 한 물품거래,금전거래 등과 관련하여 발생한 문제에 대하여 어떠한 책임도 지지 않습니다.</ABOUT_Text>

      </div>
    </div>
  </motion.div>
);

export default index;