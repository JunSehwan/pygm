import React, { useEffect, createRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';

const AlertModal = ({
  title,
  contents,
  contents_second,
  closeOutsideClick,
  openModal,
  closeModal,
  cancelFunc,
  twobutton,
}) => {
  const modalEl = createRef();

  const handleClickOutside = (event) => {
    if (openModal && closeOutsideClick && !modalEl?.current?.contains(event.target)) {
      cancelFunc();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <AnimatePresence>
      {openModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalEl}
            className="relative bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-gray-800/30 rounded-2xl max-w-md w-[90%] mx-auto p-8"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            {/* 상단 아이콘 */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-3">
                <FiAlertCircle className="text-blue-600 w-7 h-7" />
              </div>
              {title && (
                <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl text-center leading-snug">
                  {title}
                </h2>
              )}
            </div>

            {/* 본문 */}
            <div className="text-center space-y-2">
              <p className="text-gray-600 dark:text-gray-300 text-[0.95rem] leading-relaxed">
                {contents}
              </p>
              {contents_second && (
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  {contents_second}
                </p>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className={`flex ${twobutton ? 'gap-3 mt-8' : 'mt-8'}`}>
              {twobutton ? (
                <>
                  <button
                    onClick={cancelFunc}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 font-semibold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    확인
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  확인
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

AlertModal.propTypes = {
  title: PropTypes.string,
  contents: PropTypes.string,
  contents_second: PropTypes.string,
  closeOutsideClick: PropTypes.bool,
  openModal: PropTypes.bool,
  closeModal: PropTypes.func,
  cancelFunc: PropTypes.func,
  twobutton: PropTypes.bool,
};

export default AlertModal;
