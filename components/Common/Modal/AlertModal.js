import React, { useEffect, createRef } from 'react';
import PropTypes from 'prop-types';
import { FcAdvertising } from 'react-icons/fc';
import { motion } from 'framer-motion';

const AlertModal = ({ title, contents, contents_second, closeOutsideClick, openModal, closeModal, cancelFunc, twobutton }) => {

  const modalEl = createRef();
  const handleClickOutside = (event) => {
    if (openModal === true && closeOutsideClick === true && !modalEl?.current?.contains(event.target))
      cancelFunc();
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  return (
    <>
      {openModal ?

        <div className="fixed top-0 left-0 z-[50] flex h-full w-full items-center justify-center bg-[#00000090]">
          <div className="w-[100%] justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="sticky w-[100%] mt-auto mb-auto mx-auto max-w-[32rem] min-w-[320px]">
              <div className="" ref={modalEl}>
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  <div className='p-8'>
                    <FcAdvertising className="h-[10%] w-[10%] m-auto text-sky-600" />
                    {title ?
                      (<p className="text-gray-800 mb-[12px] text-center dark:text-gray-100 font-bold text-[1.4rem] py-4">
                        {title}
                      </p>)
                      : null}
                    <p className="whitespace-normal leading-normal w-full overflow-hidden text-gray-600 dark:text-gray-100 text-left text-md py-1">
                      {contents}
                    </p>
                    <p className="text-left text-sky-600 dark:text-gray-100 text-sm py-1 mt-[2px]">
                      {contents_second}
                    </p>
                    <div className="flex items-center justify-center gap-4 w-full mt-8">
                      {twobutton ?
                        <>
                          <button type="button" onClick={cancelFunc} className="w-full py-2 px-4  bg-white hover:bg-slate-100 focus:ring-white focus:ring-offset-white text-gray-600 transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                            취소
                          </button>
                          <button type="button" onClick={closeModal} className="w-full py-2 px-4  bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 focus:ring-offset-sky-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                            확인
                          </button>
                        </>
                        :
                        <button type="button" onClick={closeModal} className="w-full mb-[12px] py-2 px-4  bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 focus:ring-offset-sky-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                          확인
                        </button>
                      }

                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        : null}
    </>
  );
};

AlertModal.propTypes = {
  title: PropTypes.string,
  contents: PropTypes.string,
  contents_second: PropTypes.string,
  closeOutsideClick: PropTypes.bool,
  openModal: PropTypes.bool,
  closeModal: PropTypes.func,
  twobutton: PropTypes.bool,
};

export default AlertModal;