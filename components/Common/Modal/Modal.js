import React, { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import PropTypes from "prop-types";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(16px) scale(0.96); }
`;

const Background = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  z-index: 150;
  ${(props) =>
    props.visible
      ? css`animation: ${fadeIn} 0.35s ease-out forwards;`
      : css`animation: ${fadeOut} 0.25s ease-in forwards;`}
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 420px;
  width: 90%;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  z-index: 200;
  overflow: hidden;
  ${(props) =>
    props.visible
      ? css`animation: ${fadeIn} 0.4s ease-out;`
      : css`animation: ${fadeOut} 0.25s ease-in;`}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem 0.8rem 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  padding: 0.4rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  &:hover {
    background: rgba(0,0,0,0.05);
  }
  svg {
    width: 22px;
    height: 22px;
    stroke: #475569;
  }
`;

const Body = styled.div`
  padding: 1.4rem 1.5rem;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  max-height: 60vh;
  overflow-y: auto;

  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.15);
    border-radius: 10px;
  }
`;

const Footer = styled.div`
  display: flex;
  gap: 10px;
  padding: 1rem 1.5rem 1.3rem;
  justify-content: flex-end;
  background: transparent;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  ${(props) =>
    props.primary
      ? css`
          background: #2563eb;
          color: white;
          &:hover {
            background: #1d4ed8;
          }
        `
      : css`
          background: #f1f5f9;
          color: #334155;
          &:hover {
            background: #e2e8f0;
          }
        `}
`;

const Modal = ({ visible, onClose, title, children, cancelText, okText, onConfirm }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (visible) {
      setShow(true);
      document.body.style.overflow = "hidden";
    } else {
      timeoutId = setTimeout(() => setShow(false), 250);
      document.body.style.overflow = "unset";
    }
    return () => clearTimeout(timeoutId);
  }, [visible]);

  if (!show) return null;

  return (
    <>
      <Background visible={visible} onClick={onClose} />
      <ModalContainer visible={visible}>
        <Header>
          <Title>{title}</Title>
          <CloseBtn onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseBtn>
        </Header>
        <Body>{children}</Body>
        <Footer>
          {cancelText && <Button onClick={onClose}>{cancelText}</Button>}
          {okText && <Button primary onClick={onConfirm}>{okText}</Button>}
        </Footer>
      </ModalContainer>
    </>
  );
};

Modal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  cancelText: PropTypes.string,
  okText: PropTypes.string,
  onConfirm: PropTypes.func,
};

export default Modal;
