/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useState } from 'react';
import { BiImageAdd } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import ImageCreate from './ImageCreate';
import { FcStackOfPhotos } from 'react-icons/fc';
import { MdOutlineRefresh } from "react-icons/md";

const index = () => {

  const { user } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [imageModalOpened, setImageModalOpened] = useState(false);
  const openImageModal = useCallback(() => {
    setImageModalOpened(true);
  }, [])
  const closeImageModal = useCallback(() => {
    setImageModalOpened(false);
  }, [])


  return (
    <div>
      <div className='pb-4'>
        <div className='mx-auto px-2 text-left'>
          <p className='my-1 text-gray-700 text-[1.2rem] leading-8 font-bold'>
            👩‍❤️‍👨사진 등록
          </p>
          <div className='my-2 text-gray-800 leading-4'>
            매력적인 본인의 사진을 올려서 이성에게 어필해주세요!
            <div className='my-3  bg-yellow-50 rounded-lg p-2 w-full'>
              <p className='text-sm text-slate-600'>📌 최소 3장, 최대 5장까지 업로드 가능</p>
              <p className='text-sm text-slate-600'>📌 이미지 적정비율 1:1</p>
              <p className='text-sm text-slate-600'>📌 업로드 후, 저장버튼이 생성됩니다.</p>
            </div>
          </div>
          <div className='flex flex-col flex-col-1 mb-2'>
            {user?.thumbimage && user?.thumbimage?.length !== 0 ? (
              <div className='w-full my-4 grid grid-flow-row grid-cols-2 gap-2 justify-center relative'>
                {user?.thumbimage?.length === 1 ?
                  <img
                    className="rounded-xl h-[210px] w-full bg-black object-cover"
                    alt="thumbimg"
                    src={user?.thumbimage[0] || ""}
                  />
                  :
                  (user?.thumbimage?.length > 1 &&
                    // <div className='absolute bottom-0 left-0 right-0 w-full p-2 rounded-t-lg bg-white opacity-70 text-sm text-center'>총 {user?.thumbimage?.length}장</div>}
                    user?.thumbimage?.map((v, index) => (
                      <img
                        className="rounded-xl h-[210px] w-full bg-black object-cover my-1"
                        alt="thumbimg"
                        key={index}
                        src={user?.thumbimage[index] || ""}
                      />
                    ))
                  )}
              </div>
            ) : (
              <button onClick={openImageModal} className='bg-slate-100 rounded-xl h-[420px] w-full flex flex-col justify-center items-center'>
                <FcStackOfPhotos className='w-10 h-10' />
                <span className='font-bold text-md text-gray-400'>Empty</span>
              </button>
            )}
          </div>
        </div>

        <div className='flex w-full mx-auto px-3'>
          {user?.thumbimage && user?.thumbimage?.length >= 1 ?
            <button type="button" onClick={openImageModal}
              className="text-gray-900 bg-white hover:bg-gray-100 border-solid border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 w-full flex flex-col font-medium rounded-xl  px-4 py-2 text-center items-center dark:focus:ring-[#3b5998]/55 mb-2">
              <>
                <MdOutlineRefresh className='w-8 h-8' />
                <div className='mt-2 text-md'>
                  새로운 사진으로 변경<p className='text-blue-800 text-sm'>기존 사진은 전부 삭제됩니다.</p>
                </div>
              </>
            </button>
            :
            <button type="button" onClick={openImageModal}
              className="text-gray-900 bg-white hover:bg-gray-100 border-solid border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 w-full flex flex-col font-medium rounded-xl  px-4 py-2 text-center items-center dark:focus:ring-[#3b5998]/55 mb-2">
              <BiImageAdd className='w-8 h-8' />
              {/* <span className="px-2 py-4 text-md text-gray-100 border-l-2 border-gray-100 font-mono">
                  </span> */}
              <div className='mt-2 text-sm'>
                사진추가
              </div>
            </button>
          }
          <ImageCreate
            imageModalOpened={imageModalOpened}
            closeImageModal={closeImageModal}
          />

        </div>


      </div>
    </div>

  );
};



export default index;