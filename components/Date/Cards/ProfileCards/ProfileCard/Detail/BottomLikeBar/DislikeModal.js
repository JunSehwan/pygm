import { useCallback, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { MdPlaylistRemove } from "react-icons/md";

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
  
  ${(props) => modalSlideSettings(props.visible)}
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

const Modal = ({ onClose, title, children, visible, widths, subtitle, onDislike }) => {



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





  return (
    <>
      <>
        <>
          <Background className="inset-0 flex items-end sm:items-center justify-center min-h-full text-left sm:p-0"
            visible={visible} onClick={onClose}
            aria-labelledby="modal-title" role="dialog" aria-modal="true" />

          <ModalSection className="fixed mt-8 top-[30%] overflow-y-hidden rounded-lg w-full max-w-[420px]"
            visible={visible}
            widths={widths}>
            <div className='relative w-full'>
              <div className='w-full flex items-end p-3'>
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
              <div className='w-full'>
                <div className="flex flex-col items-start justify-between p-2 rounded-t">
                  <div className='w-full p-4  flex items-center justify-center'>
                    <MdPlaylistRemove 
                      className='w-14 h-14 text-slate-500'
                    />
                  </div>
                  <div className="relative rounded border w-full">
                    <div className='w-full items-center flex'>
                      <h2 className="text-black text-2xl p-3 font-bold tracking-normal leading-tight w-full text-center">
                        {title}</h2>
                    </div>
                    <h2 className="text-gray-500 text-md p-3 font-normal tracking-normal leading-tight w-full text-center">
                      패스를 하게되면,<br />
                      상대방의 프로필을 
                      <br />
                      더 이상 확인할 수 없습니다.</h2>
                  </div>

                </div>
              </div>

              {/* <Content className='relative min-h-0 overflow-y-auto pb-[80px] pr-0'>
                {children}
              </Content> */}

              <Footer className='p-4'>
                <div className='w-full flex justify-center items-center gap-2'>
                  <button
                    type="submit"
                    onClick={onDislike}
                    className='w-full inline-flex justify-center rounded-md border border-gray-300 shadow-md px-4 py-4 bg-white text-base font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  >패스하기
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className='w-full inline-flex justify-center rounded-md border border-transparent shadow-md px-4 py-4 bg-slate-600 text-base font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'>
                    취소</button>
                </div>
              </Footer>
            </div>
          </ModalSection>
        </>
      </>

    </>
  );

};

Modal.propTypes = {
  visible: PropTypes.bool,
  onDislike: PropTypes.func,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default Modal;