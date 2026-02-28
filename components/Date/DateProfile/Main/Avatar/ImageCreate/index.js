import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Modal from "components/Common/Modal/Modal";
import { useDispatch, useSelector } from "react-redux";
import { doc, updateDoc } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  getStorage,
} from "firebase/storage";
import { motion } from "framer-motion";
import { db } from "firebaseConfig";
import { patchThumbimage, patchThumbimageDoneFalse } from "slices/user";
import Image from "next/image";
import dayjs from "dayjs";

const ImageUploadModal = ({ imageModalOpened, closeImageModal }) => {
  const dispatch = useDispatch();
  const { user, patchThumbimageDone } = useSelector((state) => state.user);

  // 하나의 리스트만 관리: { id, file, url }
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [URLs, setURLs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finish, setFinish] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const time = useMemo(() => dayjs().format("YYYY-MM-DD_HH-mm-ss"), []);

  /** 파일 추가 */
  const changePicture = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // 현재 + 추가가 최대 5장 초과 시, 잘라서 넣기
    const remain = Math.max(0, 5 - items.length);
    const sliced = files.slice(0, remain);

    const prepared = sliced.map((file) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setItems((prev) => [...prev, ...prepared]);

    // 초과한 경우 안내
    if (files.length > remain) {
      setErrorMsg("⚠️ 이미지는 최대 5장까지만 업로드할 수 있습니다.");
    } else {
      setErrorMsg("");
    }

    // 같은 파일 input에서 다시 선택할 수 있도록 value 리셋
    e.target.value = "";
  }, [items.length]);

  /** 항목 삭제 */
  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
    setErrorMsg("");
  }, []);

  /** Firebase 업로드 */
  const onFirebaseImage = useCallback(
    async (list) => {
      if (list.length < 3) {
        setErrorMsg("⚠️ 이미지는 최소 3장 이상 업로드해주세요.");
        return;
      }
      if (list.length > 5) {
        setErrorMsg("⚠️ 이미지는 최대 5장까지만 업로드할 수 있습니다.");
        return;
      }

      const storage = getStorage();
      setLoading(true);
      setFinish(false);
      setURLs([]);
      setProgress(0);
      setErrorMsg("");

      try {
        // 평균 진행률(파일 단위)
        const total = list.length;
        const urlResults = await Promise.all(
          list.map((it, idx) => {
            const storageRef = ref(
              storage,
              `user/date/thumbimage/${user?.userID}/${time}_${idx}_${it.file.name}`
            );
            const uploadTask = uploadBytesResumable(storageRef, it.file);

            return new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const filePct = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                  );
                  // 파일별 진행률을 평균으로 환산
                  setProgress((prev) => {
                    // 단순히 해당 파일 진행률에 맞춰 평균 근사값 생성
                    // 더 정확히 하려면 파일별 상태를 따로 두어 평균 계산 가능
                    const base = (idx / total) * 100;
                    const slice = filePct / total;
                    const approx = Math.min(base + slice, 100);
                    return Math.max(prev, approx);
                  });
                },
                (err) => reject(err),
                async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
                }
              );
            });
          })
        );

        setURLs(urlResults);
        setProgress(100);
        setFinish(true);

        await updateDoc(doc(db, "users", user?.userID), { thumbimage: urlResults });
        dispatch(patchThumbimage(urlResults));
      } catch (e) {
        console.error("🔥 업로드 실패:", e);
        setErrorMsg("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, time, user?.userID]
  );

  const uploadImageDB = useCallback(
    async (e) => {
      e.preventDefault();
      await onFirebaseImage(items);
    },
    [items, onFirebaseImage]
  );

  /** 업로드 완료 후 초기화 및 모달 닫기 */
  useEffect(() => {
    if (patchThumbimageDone) {
      setLoading(false);
      // 메모리 해제
      items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
      setItems([]);
      setProgress(0);
      setURLs([]);
      setFinish(false);
      dispatch(patchThumbimageDoneFalse());
      closeImageModal();
    }
  }, [patchThumbimageDone, items, dispatch, closeImageModal]);

  /** 언마운트 시 URL 메모리 해제 */
  useEffect(() => {
    return () => {
      items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    };
  }, [items]);

  const canUpload = items.length >= 3 && items.length <= 5 && !loading;

  return (
    <Modal
      onClose={closeImageModal}
      title="프로필사진 등록"
      visible={imageModalOpened}
      widths="520px"
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full flex flex-col items-center justify-center px-4 py-5 rounded-2xl bg-white/70 backdrop-blur-xl shadow-xl"
      >
        {/* 안내/오류 메시지 */}
        <div className="mb-3 text-center min-h-[20px]">
          {errorMsg ? (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          ) : finish && !loading ? (
            <p className="text-green-600 text-sm font-medium">
              ✅ 업로드 완료! 잠시 후 닫힙니다.
            </p>
          ) : null}
        </div>

        {/* 상단 바: 파일 선택 + 업로드 */}
        <div className="flex w-full items-center justify-between border-b border-gray-200 pb-3 mb-4">
          <label
            htmlFor="upload"
            className="flex items-center gap-2 px-5 py-3 bg-white/80 hover:bg-white 
              border border-gray-200 rounded-2xl shadow-sm text-gray-700 cursor-pointer 
              transition-all backdrop-blur-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold">사진 추가</span>
            <input
              id="upload"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={changePicture}
              className="hidden"
            />
          </label>

          <button
            onClick={uploadImageDB}
            disabled={!canUpload}
            className={`px-6 md:px-8 py-3 text-base md:text-lg rounded-2xl font-semibold shadow-sm transition-all
              ${canUpload
                ? "bg-black text-white hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            업로드
          </button>
        </div>

        {/* 진행바 */}
        {loading && (
          <div className="w-full flex flex-col items-center mb-4">
            <div className="w-11/12 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-3 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-600"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeInOut", duration: 0.25 }}
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">
              업로드 중… {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* 미리보기 그리드 */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 w-full max-h-[440px] overflow-y-auto px-1">
            {items.map((it) => (
              <div
                key={it.id}
                className="relative rounded-2xl bg-white/80 shadow-sm overflow-hidden border border-gray-100"
              >
                {/* 삭제 버튼 (우측 상단 고정) */}
                <button
                  onClick={() => removeItem(it.id)}
                  className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-gray-100 
                    p-2 rounded-full shadow-sm active:scale-95 transition"
                  aria-label="remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 이미지(비율 고정) */}
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={it.url}
                    alt="preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 */}
        {!loading && items.length === 0 && (
          <div className="text-center text-gray-500 mt-2">
            <p>📸 최소 3장 이상, 최대 5장까지 업로드해주세요.</p>
            <p className="mt-1 text-sm text-gray-400">(PNG, JPEG, WEBP 지원)</p>
          </div>
        )}
      </motion.div>
    </Modal>
  );
};

ImageUploadModal.propTypes = {
  imageModalOpened: PropTypes.bool,
  closeImageModal: PropTypes.func,
};

export default ImageUploadModal;


// import React, { useCallback, useState, useEffect, useRef } from 'react';
// import PropTypes from 'prop-types';
// import Modal from 'components/Common/Modal/Modal';
// import Spin from 'components/Common/Spin';
// import { useDispatch, useSelector } from 'react-redux';
// import { doc, updateDoc, } from "firebase/firestore";
// import { getDownloadURL, ref, uploadBytesResumable, getStorage, deleteObject } from "firebase/storage";
// import { motion } from "framer-motion";
// import { db } from 'firebaseConfig';
// import { BsFillCloudUploadFill } from 'react-icons/bs';
// import { patchThumbimage, patchThumbimageDoneFalse } from 'slices/user';
// import Image from 'next/image';
// import dayjs from "dayjs";

// const index = ({ imageModalOpened, closeImageModal }) => {

//   const dispatch = useDispatch();
//   const { user, patchThumbimageDone } = useSelector(state => state.user);

//   const [selectedImages, setSelectedImages] = useState([]);
//   const [images, setImages] = useState([])
//   const [progress, setProgress] = useState(0);
//   const [URLs, setURLs] = useState([])
//   const [loading, setLoading] = useState(false);
//   const [finish, setFinish] = useState(false);

//   const now = new Date();
//   const nowForCopy = dayjs(now);
//   const time = nowForCopy?.format('YYYY-MM-DD HH:mm:ss');


//   const onSelectFile = (event) => {
//     const selectedFiles = event.target.files;
//     const selectedFilesArray = Array.from(selectedFiles);
//     const imagesArray = selectedFilesArray?.map((file) => {
//       // setFiles(prevState => [...prevState, file])
//       return ({ id: file?.id, name: file?.name, url: URL.createObjectURL(file) })
//     });
//     // onSelectFileUpload(selectedFiles)
//     setSelectedImages((previousImages) => previousImages?.concat(imagesArray));

//   };
//   const changePicture = useCallback((e) => {
//     onSelectFile(e)
//     for (let i = 0; i < e.target.files.length; i++) {
//       const files = e.target.files[i];
//       files["id"] = Math.random();
//       setImages((prevState) => [...prevState, files])
//     }
//   }, [])


//   const removeImg = useCallback((image) => {
//     setSelectedImages(prevArr => prevArr?.filter(v => v?.url !== image?.url));
//     setImages(prevArr => prevArr?.filter(v => v?.name !== image?.name));
//   }, [])

//   const resetImg = useCallback(() => {
//     // Delete the file
//     // Create a reference to the file to delete
//     const desertRef = ref(storage, 'images/desert.jpg');

//     deleteObject(desertRef).then(() => {
//       // File deleted successfully
//     }).catch((error) => {
//       // Uh-oh, an error occurred!
//     });
//   }, [])

//   const onFirebaseImage = useCallback(async (images) => {
//     const storage = getStorage();
//     if (images?.length <= 1 || selectedImages?.length <= 1) {
//       setLoading(false);
//       return alert("이미지를 3장 이상 업로드해주세요!");
//     }

//     try {
//       await images?.map((file) => {
//         const storageRef = ref(storage, `user/date/thumbimage/${user?.userID}/${time}${file?.name}`);
//         const uploadTask = uploadBytesResumable(storageRef, file);
//         uploadTask.on(
//           "state change",
//           (snapshot) => {
//             const prog = Math.round(
//               (snapshot.bytesTransferred / snapshot.totalBytes) * 100
//             );
//             setProgress(prog);
//           },
//           (error) => console.error(error),
//           async () => {
//             await getDownloadURL(uploadTask.snapshot.ref).then((downloadURLs) => {
//               setURLs((prevState) => [...prevState, downloadURLs])

//               setLoading(false);

//             })
//           })
//       });
//     } catch (e) {
//       console.error(e);
//     }
//   }, [time, user?.userID, selectedImages?.length])

//   const uploadImageDB = useCallback(async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const results = await onFirebaseImage(images);
//   }, [images, onFirebaseImage])

//   const onSubmit = useCallback(async () => {
//     setLoading(true);
//     await updateDoc(doc(db, "users", user?.userID), {
//       thumbimage: URLs,
//     });
//     dispatch(patchThumbimage(URLs));
//   }, [URLs, dispatch, user?.userID])

//   useEffect(() => {
//     async function fetchData() {
//       if (selectedImages?.length === URLs?.length && URLs?.length !== 0) {
//         await onSubmit();
//       }
//     }
//     fetchData();
//   }, [onSubmit, URLs?.length, selectedImages?.length])


//   useEffect(() => {
//     async function fetchData() {
//       // You can await here
//       if (selectedImages?.length === URLs?.length && URLs?.length !== 0) {
//         setFinish(true);
//       }
//       // ...
//     }
//     fetchData();
//   }, [URLs?.length, selectedImages?.length]); // Or [] if effect doesn't need props or state

//   useEffect(() => {
//     if (patchThumbimageDone) {
//       setLoading(false);
//       setSelectedImages([])
//       setImages([])
//       setProgress(0)
//       setURLs([])
//       setFinish(false);
//       dispatch(patchThumbimageDoneFalse());
//       closeImageModal();
//     }
//   }, [closeImageModal, dispatch, patchThumbimageDone])

//   return (
//     <Modal
//       onClose={closeImageModal}
//       title="프로필사진 등록"
//       visible={imageModalOpened}
//       widths="460px"
//     >
//       <div className="flex w-full h-full top-[24px] my-2 pt-2 justify-center">
//         <motion.div
//           initial={{ opacity: 0 }}
//           whileInView={{ opacity: 1 }}
//           viewport={{ once: true }}
//           className="rounded-lg h-full flex w-full flex-col justify-center items-center gap-2 p-2 pt-3"
//         >
//           <div className='w-full'>
//             <div className="flex items-center text-blue-600 justify-between py-2 px-2 border-t">

//               <div className="flex items-center">
//                 <div className="flex text-2xl">
//                   <label className="flex flex-col items-center justify-center p-3 hover:bg-blue-100 bg-blue-50 rounded-lg cursor-pointer" htmlFor="upload">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                     <span className='text-sm text-center'>사진추가</span>
//                   </label>
//                   <input onChange={changePicture}
//                     type="file"
//                     className='hidden'
//                     multiple={true}
//                     accept="image/png , image/jpeg, image/webp"
//                     id="upload"
//                   // style="display:none"
//                   />
//                 </div>
//                 <span className="ml-2">{progress}%</span>
//               </div>
//               <div>
//                 {/* {loading ? (
//                   <div className="flex w-full">
//                     <button
//                       type="button"
//                       className="text-white text-center animate-pulse cursor-not-allowed 
//                   bg-gradient-to-r p-4 px-8 text-md from-purple-500 to-pink-500 
//                   hover:bg-gradient-to-l focus:ring-4 focus:outline-none 
//                   focus:ring-purple-200 dark:focus:ring-purple-800 font-medium 
//                   rounded-lg text-xl py-2 flex justify-center"
//                     >
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         strokeWidth={1.5}
//                         stroke="currentColor"
//                         className="w-10 h-10 animate-spin"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
//                         />
//                       </svg>
//                     </button>
//                   </div>
//                 ) : ( */}
//                 <div className="flex">

//                   {!finish && selectedImages?.length !== 0 && selectedImages?.length <= 5 &&
//                     <div className='flex flex-col justify-end'>
//                       <button
//                         type="button" onClick={uploadImageDB}
//                         className="text-white font-bold bg-slate-600
//                    hover:bg-slate-700 focus:ring-4 focus:outline-none
//                     focus:ring-blue-200 text-lg rounded-md 
//                     px-8 py-2 text-center cursor-pointer flex justify-center items-center">
//                         <span className=''>업로드</span>
//                       </button>
//                     </div>}
//                 </div>
//                 {/* )} */}
//               </div>
//             </div>

//             <div className="w-full">
//               {loading && (
//                 <div>
//                   <div className='mx-auto w-full md:w-[360px] h-[420px] flex flex-col justify-center items-center'>
//                     <div className='-ml-[48px] mb-[48px]'>
//                       <Spin />
//                     </div>
//                     <p className="text-xl font-semibold text-pink-500 text-xenter mt-4 animate-pulse">
//                       uploading...
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {!loading && (!selectedImages || selectedImages?.length === 0) &&
//                 (<label className="cursor-pointer">
//                   <div
//                     className='border-dashed mx-auto rounded-xl w-ful h-[420px] border-2 border-gray-200 flex flex-col justify-center items-center outline-none'>
//                     <div className="flex flex-col items-center justify-center h-full py-[1rem]">
//                       <div className="flex flex-col justify-center items-center">
//                         <p className="font-bold text-xl">
//                           {/* <FaCloudUploadAlt className='text-gray-300 text-6xl' /> */}
//                         </p>
//                         <p className="text-xl font-semibold">
//                           내 사진 업로드
//                         </p>
//                       </div>

//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         strokeWidth={1.5}
//                         stroke="currentColor"
//                         className="w-6 h-6 mt-5"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
//                         />
//                       </svg>

//                       <p className="w-full text-gray-400 mt-4 text-sm leading-4 text-left">
//                         ✔️ 파일유형 : png, jpeg, webp<br />
//                         ✔️ 당신의 멋지고 아름다운 외모가 나오게 찍어주세요.<br />
//                         ✔️ 이미지는 2장 이상, 5장 이하로 업로드 해주세요.<br />
//                         {/* ✔️ 추천 이미지배율: 360x600 <br /> */}
//                       </p>
//                       <p className="text-white bg-gradient-to-br from-blue-500 mt-8 to-purple-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 w-52">
//                         파일 선택
//                       </p>
//                     </div>
//                     <input
//                       type="file"
//                       className='hidden'
//                       multiple={true}
//                       accept="image/png, image/jpeg, image/webp"
//                       id="upload"
//                       onChange={changePicture}
//                     />
//                   </div>
//                 </label>
//                 )}

//               {!loading && (selectedImages && selectedImages?.length !== 0) &&
//                 <div
//                   className='border-dashed mx-auto rounded-xl w-full h-full border-2 
//                       border-gray-200 flex flex-col items-center outline-none justify-center'>

//                   <div className="rounded-3xl w-full p-4 flex flex-col gap-2 items-center justify-evenly ">
//                     {selectedImages?.length > 5 ?
//                       <p className="error mb-4 text-red-500 w-full text-left">
//                         5개를 초과한 이미지를 업로드할 수 없습니다. <br />
//                         <span>
//                           <b> {selectedImages?.length - 5} </b> 장의 사진을 삭제해주세요!
//                         </span>
//                       </p>
//                       : null}
//                     <div className="gap-2 flex flex-col w-full">
//                       {selectedImages &&
//                         selectedImages?.map((image, index) => {
//                           return (
//                             <div key={index} className="image rounded-lg bg-slate-200 shadow-inner">
//                               <div className='flex justify-between items-center p-1'>
//                                 <p className='p-2 text-gray-600'>{index + 1}</p>
//                                 <button
//                                   type="button"
//                                   className='p-2 hover:bg-slate-300 rounded-full flex justify-center items-center'
//                                   onClick={() => removeImg(image)}
//                                 >
//                                   <svg xmlns="http://www.w3.org/2000/svg"
//                                     className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//                                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                                   </svg>
//                                 </button>

//                               </div>
//                               <div className="relative h-64 w-[100%]">
//                                 <Image
//                                   className='shadow rounded-lg autoImage object-cover p-2'
//                                   src={image?.url}
//                                   fill
//                                   alt="upload"
//                                   unoptimized
//                                 />
//                               </div>
//                             </div>
//                           );
//                         })}
//                     </div>

//                   </div>
//                 </div>
//               }

//               {/* </div> */}
//               {/* )} */}
//             </div>
//           </div>

//         </motion.div>
//       </div>
//     </Modal>

//   );
// };

// index.propTypes = {
//   imageModalOpened: PropTypes.bool,
//   closeImageModal: PropTypes.func,
// };

// export default index;