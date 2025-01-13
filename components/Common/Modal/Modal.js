import { useCallback, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

// components
const modalSettings = (visible) => css`
  visibility: ${visible ? 'visible' : 'hidden'};
  z-index: 150;
  animation: ${visible ? fadeIn : fadeOut} 0.35s ease-out;
  transition: visibility 0.15s ease-out;
`;

const modalSlideSettings = (visible) => css`
  visibility: ${visible ? 'visible' : 'hidden'};
  z-index: 150;
  animation: ${visible ? fadeIn : fadeOut} 450ms cubic-bezier(0.4, 0.0, 0.2, 1) 0ms;
  animation: ${visible ? slideIn : slideOut} 450ms cubic-bezier(0.4, 0.0, 0.2, 1) 0ms;
  transition: visibility 450ms cubic-bezier(0.4, 0.0, 0.2, 1) 0ms;
  /* transition: visibility 0.15s ease-out; */
`;

const Background = styled.div`
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  position: fixed;
  background-color: rgba(0, 0, 0, 0.7);
  ${(props) => modalSettings(props.visible)}
`;

const ModalSection = styled.div`
  position: fixed;
  margin: 0 auto;
  margin-top: 12px;
  z-index: 999;
  
  /* background-color: rgba(255, 255, 255, 1); */
  background: rgb(255,255,255);
  
  /* background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 90%, rgba(255,255,255,0.6886729691876751) 100%); */
  
  max-width: 460px;
  ${(props) => modalSlideSettings(props.visible)}
`;

const Title = styled.div`

`;

const Footer = styled.div`
`

const Content = styled.div`
  max-height: -webkit-fill-available;
  padding-right: 12px;


  ::-webkit-scrollbar {
      width: 12px;
    }
  ::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.16);
    border-radius: 10px;
    background-clip: padding-box;
    border: 2px solid transparent;
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 10px;
    box-shadow: inset 0px 0px 5px white;
  }
`;

const fadeIn = keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
`

const fadeOut = keyframes`
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
`

const slideIn = keyframes`
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(0%);
    }
`

const slideOut = keyframes`
    0% {
      transform: translateY(0%);
    }
    100% {
      transform: translateY(100%);
    }
`

const Modal = ({ onClose, title, children, visible, widths }) => {



  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    let timeoutId;
    if (visible) {
      setIsOpen(true);
      document.body.style.overflow = "hidden"
    } else {
      timeoutId = setTimeout(() => setIsOpen(false), 150);
      document.body.style.overflow = "unset";
    }
    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [visible]);

  if (!isOpen) { return null; }



  // // 리로드할 시점(form 수정중이라던라 등등... 없어도 무관)

  // const router = useRouter();
  // const confirmMsg = `사이트에서 나가시겠습니까?\n변경사항이 저장되지 않을 수 있습니다.`;

  // // 리로드 전에 메세지 띄워주기
  // const handleBeforeUnload = useCallback((e) => {
  //   (e || window.event).returnValue = confirmMsg;
  //   return confirmMsg; // Gecko + Webkit, Safari, Chrome
  // }, [confirmMsg])

  // //라우터 바뀌기 전 이벤트(취소했을경우 넘어가지않음)
  // const handleBeforeChangeRoute = useCallback((url) => {
  //   if (router.pathname !== url && !confirm(confirmMsg)) {
  //     router.events.emit("routeChangeError");
  //     throw `사이트 변경 취소`;
  //   }
  // }, [confirmMsg, router.events, router.pathname]
  // )

  // useEffect(() => {
  //   // 중요! 페이지 뒤로가기 시 url 은 변경되는 문제가 있는데 그걸 해결해줌
  //   if (router.asPath !== window.location.pathname) {
  //     window.history.pushState("", "", router.asPath);
  //   }
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   router.events.on("routeChangeStart", handleBeforeChangeRoute);

  //   // window.removeEventListener("beforeunload", handleBeforeUnload);
  //   // router.events.off("routeChangeStart", handleBeforeChangeRoute);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeoreUnload);
  //     router.events.off("routeChangeStart", handleBeforeChangeRoute);
  //   };
  // }, [handleBeforeChangeRoute, handleBeforeUnload, router.asPath, router.events, router.pathname]);

  // useEffect(() => {
  //   // 새로고침 막기(조건 부여 가능)
  //   window.onbeforeunload = function () {
  //     return true;
  //   };
  //   return () => {
  //     window.onbeforeunload = null;
  //   };
  // }, [])



  return (
    <>
      <>
        <>
          <Background className="inset-0 flex items-end sm:items-center justify-center min-h-full text-left sm:p-0"
            visible={visible} onClick={onClose}
            aria-labelledby="modal-title" role="dialog" aria-modal="true" />

          <ModalSection className="fixed mt-8 inset-0 overflow-y-hidden rounded-lg w-full max-w-[460px] h-full"
            visible={visible}
            widths={widths}>
            <div className='relative w-full h-full'>
              <Title className='w-full'>
                <div className="flex items-start justify-between p-2 rounded-t">
                  <div className="relative rounded border w-full">
                    <h2 className="text-black text-xl p-3 font-bold tracking-normal leading-tight w-full text-left">{title}</h2>
                  </div>
                  <button
                    className="p-3 rounded-xl hover:bg-slate-200 ml-auto bg-transparent border-0 text-gray-500 hover:text-gray-700 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="bg-transparent opacity-100 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                </div>
              </Title>

              <Content className='relative min-h-0 overflow-y-auto pb-[80px] pr-0'>
                {children}
              </Content>

              {/* <Footer className='px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
              <>
                {onCancel ? <button
                  type="button"
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-md px-4 py-4 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-md'
                >취소</button> : null}
                {onSubmit ? <button
                  type="submit"
                  onClick={onSubmit}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-md px-4 py-4 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-md'>
                  확인</button> : null}
              </>
            </Footer> */}
            </div>
          </ModalSection>
        </>
      </>

    </>
  );

};

Modal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default Modal;