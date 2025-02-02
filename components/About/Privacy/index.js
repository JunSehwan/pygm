
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
    <div className="flex flex-col w-full mx-2">
      <h2 className="text-2xl md:text-3xl text-blue-600">개인정보처리방침</h2>
      {/* <div className="border-b-2 w-full mb-3 border-blue-600" /> */}
    </div>
    <div className="flex flex-col mt-2 mx-2 gap-4 text-base text-skyColor about-text">
      <div className="flex flex-col gap-1 md:mt-3 text-gray-600 leading-8">
        <ABOUT_SecondTitle>넥스트퍼스는 회원 정보의 보안을 철저히 유지하기 위해 노력하고 있습니다.</ABOUT_SecondTitle>
        <ABOUT_Text>PYGMalion은 사용자가 원하는 이성 또는 이웃과 만남의 꿈을 실현시키기 위해 설립되었습니다.
          그리고 PYGMalion에서 수집하는 회원 데이터, 이러한 정보의 사용과 공유 대상을 투명히 하기 위해 노력합니다.</ABOUT_Text>
        <ABOUT_SecondTitle>가. 개인정보의 처리목적, 개인정보의 처리 및 보유기간, 처리하는 개인정보의 항목</ABOUT_SecondTitle>
        <ABOUT_Text>개인정보 처리목적</ABOUT_Text>
        <ABOUT_Sub>개인정보입력을 통해 원하는 이성 또는 이웃과의 연락처 교환</ABOUT_Sub>
        <ABOUT_Sub>스펙 또는 외모 상대적 선호도 작성을 통해 사용자들에게 본인의 성향 및 가치관, 스펙등의 선호도 정보공유</ABOUT_Sub>
        <ABOUT_Text>1. 일반회원 기본정보</ABOUT_Text>
        <ABOUT_Sub>필수입력: 이름, 닉네임, 사는 곳(거주지), 근무지, 이메일주소, 비밀번호</ABOUT_Sub>
        <ABOUT_Text>2. 일반회원 학력, 경력정보</ABOUT_Text>
        <ABOUT_Sub>기본정보(선택): 개인사진, 성별, 이직을 원하는지 여부, 거주지주소, 생년월일, 연락처</ABOUT_Sub>
        <ABOUT_Sub>경력정보(선택): 기업명, 부서, 고용형태, 직급, 관련직업(직무)</ABOUT_Sub>
        <ABOUT_Sub>학력정보(선택): 학교명, 전공, 복수/부전공</ABOUT_Sub>
        <ABOUT_Sub>기타정보(선택): 보유스킬, 생활/연애 등 여러 분야에서의 가치관, 능력 등</ABOUT_Sub>
        <ABOUT_Text>3. 매칭관련정보</ABOUT_Text>
        <ABOUT_Sub>매칭 상대방과 본인의 이미지(프로필사진), 스펙, 가치관/성향</ABOUT_Sub>

        <ABOUT_SecondTitle>나. 개인정보의 제3자 제공</ABOUT_SecondTitle>
        <ABOUT_Text>넥스트퍼스는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 다음의 경우를 제외하고는 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나  제3자에게 제공하지 않습니다.</ABOUT_Text>
        <ABOUT_Sub>1. 정보주체로부터 별도의 동의를 받는 경우
        </ABOUT_Sub><ABOUT_Sub>2. 법률에 특별한 규정이 있는 경우
        </ABOUT_Sub><ABOUT_Sub>3. 정보주체 또는 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우
        </ABOUT_Sub><ABOUT_Sub>4. 통계작성 및 학술연구 등의 목적을 위하여 필요한 경우로서 특정 개인을 알아 볼 수 없는 형태로 개인정보를 제공하는 경우
        </ABOUT_Sub><ABOUT_Sub>5. 개인정보를 목적 외의 용도로 이용하거나 이를 제3자에게 제공하지 아니하면 다른 법률에서 정하는 소관 업무를 수행할 수 없는 경우로서 보호위원회의 심의·의결을 거친 경우
        </ABOUT_Sub><ABOUT_Sub>6. 조약, 그 밖의 국제협정의 이행을 위하여 외국정보 또는 국제기구에 제공하기 위하여 필요한 경우
        </ABOUT_Sub><ABOUT_Sub>7. 범죄의 수사와 공소의 제기 및 유지를 위하여 필요한 경우
        </ABOUT_Sub><ABOUT_Sub>8. 법원의 재판업무 수행을 위하여 필요한 경우
        </ABOUT_Sub><ABOUT_Sub>9. 형 및 감호, 보호처분의 집행을 위하여 필요한 경우</ABOUT_Sub>

        <ABOUT_SecondTitle>다. 정보주체의 권리·의무 및 그 행사 방법</ABOUT_SecondTitle>
        <ABOUT_Text>개인이 작성한 모든 기본/학력/경력/기타 정보는 작성, 조회, 삭제, 수정할 수 있습니다.</ABOUT_Text>

        <ABOUT_SecondTitle>라. 개인정보의 안전성 확보 조치</ABOUT_SecondTitle>
        <ABOUT_Text>정보의 파기</ABOUT_Text>
        <ABOUT_Sub>보유기간이 만료되었거나 개인정보의 처리목적달성, 해당 업무의 폐지 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 파기합니다.</ABOUT_Sub>
        <ABOUT_Text>개인정보의 암호화</ABOUT_Text>
        <ABOUT_Sub>개인정보는 암호화 등을 통해 안전하게 저장 및 관리되고 있습니다. 또한 중요한 데이터는 저장 및 전송 시 암호화하여 사용하는 등의 별도 보안기능을 사용하고 있습니다.</ABOUT_Sub>
      </div>
    </div>
  </motion.div>
);

export default index;