import { useCallback, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { FaRegFaceKissWinkHeart } from "react-icons/fa6";
import { useSelector } from 'react-redux';

// components
const modalSettings = (visible) => css`
  visibility: ${visible ? 'visible' : 'hidden'};
  z-index: 150;
  transition: visibility 0.15s ease-out;
`;

const modalSlideSettings = (visible) => css`
  visibility: ${visible ? 'visible' : 'hidden'};
  z-index: 150;
  transition: visibility 450ms cubic-bezier(0.4, 0.0, 0.2, 1) 0ms;
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

const Modal = ({ onClose, title, children, visible, widths, subtitle, onFinish }) => {

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

          <ModalSection className="fixed mt-8 top-[30%] left-[50%] -translate-x-1/2 overflow-y-hidden rounded-lg w-full max-w-[400px]"
            visible={visible}
            widths={widths}>
            <div className='relative w-full'>
              <div className='w-full'>
                <div className="flex flex-col items-start justify-between p-2 rounded-t">
                  <div className='w-full p-4  flex items-center justify-center'>
                    <FaRegFaceKissWinkHeart
                      className='w-14 h-14 text-pink-500'
                    />
                  </div>
                  <div className="relative rounded border w-full">
                    <div className='w-full items-center flex'>
                      <h2 className="text-black text-2xl p-3 font-bold tracking-normal leading-tight w-full text-center">
                        {title}</h2>
                    </div>
                    <h2 className="text-gray-500 text-md p-3 font-normal tracking-normal leading-tight w-full text-center">
                      12시간 이내에 <p>작성하신 프로필 내용을 담당자가 확인 후, <br/>승인이 완료됩니다.</p>
                    </h2>
                    <p className='text-blue-500 text-md px-3 font-normal tracking-normal leading-tight w-full text-center'>승인이 완료된 후, 이성 소개를 시작합니다.</p>
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
                    onClick={onFinish}
                    className='w-full inline-flex justify-center rounded-md border border-transparent shadow-md px-4 py-4 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'>
                    확인</button>
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
  onFinish: PropTypes.func,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default Modal;