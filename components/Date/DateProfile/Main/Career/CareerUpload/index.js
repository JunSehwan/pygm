import React, { useCallback, useState, useEffect, useRef } from 'react';
import { BiImageAdd } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { FcStackOfPhotos } from 'react-icons/fc';
import { MdOutlineRefresh } from "react-icons/md";
import Image from 'next/image';
import dayjs from "dayjs";
import { doc, updateDoc, } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, getStorage, deleteObject } from "firebase/storage";
import { motion } from "framer-motion";
import { db, storage } from 'firebaseConfig';
import { BsFillCloudUploadFill } from 'react-icons/bs';
import { uploadJobDocument, uploadJobDocumentDoneFalse } from 'slices/user';
import styled, { css, keyframes } from 'styled-components';
import toast, { Toaster } from 'react-hot-toast';

// const progresssituation = (propgress) => css`
//   width : ${progress ? progress : null};
// `;

const ProgressBar = styled.div`
  width: ${(props) => props.width || "0%"};
`;

const index = ({
}) => {

  const dispatch = useDispatch();
  const { user, uploadJobDocumentDone } = useSelector(state => state.user);

  const [selectedImages, setSelectedImages] = useState([]);
  const [images, setImages] = useState([])
  const [progress, setProgress] = useState(0);
  const [URLs, setURLs] = useState([])
  const [loading, setLoading] = useState(false);
  const [finish, setFinish] = useState(false);

  const now = new Date();
  const nowForCopy = dayjs(now);
  const time = nowForCopy?.format('YYYY-MM-DD HH:mm:ss');

  const onSelectFile = (event) => {
    const selectedFile = event.target.files;
    const selectedFilesArray = Array.from(selectedFile);
    const imagesArray = selectedFilesArray?.map((file) => {
      // setFiles(prevState => [...prevState, file])
      return ({ id: file?.id, name: file?.name, url: URL.createObjectURL(file) })
    });
    // onSelectFileUpload(selectedFiles)
    setSelectedImages((previousImages) => previousImages?.concat(imagesArray));
  };

  const changePicture = useCallback((e) => {
    onSelectFile(e)
    for (let i = 0; i < e.target.files.length; i++) {
      const files = e.target.files[i];
      files["id"] = Math.random();
      setImages((prevState) => [...prevState, files])
    }
  }, [])

  const removeImg = useCallback((image) => {
    setSelectedImages(prevArr => prevArr?.filter(v => v?.url !== image?.url));
    setImages(prevArr => prevArr?.filter(v => v?.name !== image?.name));
  }, [])

  const onFirebaseImage = useCallback(async (images) => {
    const storage = getStorage();
    if (images?.length === 0) {
      setLoading(false);
      return alert("문서파일을 업로드해주세요!");
    }

    try {
      await images?.map((file) => {
        const storageRef = ref(storage, `user/date/career/${user?.userID}/${time}${file?.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state change",
          (snapshot) => {
            const prog = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(prog);
          },
          (error) => console.error(error),
          async () => {
            await getDownloadURL(uploadTask.snapshot.ref).then((downloadURLs) => {
              setURLs((prevState) => [...prevState, downloadURLs])
              setLoading(false);
            })
          })
      });
    } catch (e) {
      console.error(e);
    }
  }, [time, user?.userID])

  const uploadImageDB = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    const results = await onFirebaseImage(images);
    // await onSubmit();
  }, [images, onFirebaseImage])



  const onSubmit = useCallback(async () => {
    setLoading(true);
    await updateDoc(doc(db, "users", user?.userID), {
      jobdocument: URLs,
    });
    dispatch(uploadJobDocument(URLs));
  }, [URLs, dispatch, user?.userID])

  const writeThumbImage = user?.thumbimage?.length >= 2;
  const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.birthday?.month && user?.birthday?.day && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
  const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun
  const writeCarrerDocu = user?.jobdocument?.length !== 0;
  const writeMBTI = user?.mbti_ei;
  const writeRomance = user?.opfriend && user?.friendmeeting && user?.longdistance;
  const writeCareerLiving = user?.career_goal && user?.living_weekend && user?.living_consume;
  const writeEtc = user?.religion_important && user?.religion_visit && user?.religion_accept && user?.food_diet;
  const writeHobby = user?.hobby && user?.drink && user?.health && user?.interest;

  const [trueCount, setTrueCount] = useState(0);
  useEffect(() => {
    async function fetchAndSetUser() {
      setTrueCount(0);
      writeThumbImage && setTrueCount(prev => prev + 1)
      writeBasicInfo && setTrueCount(prev => prev + 1)
      writeCareerInfo && setTrueCount(prev => prev + 1)
      writeCarrerDocu && setTrueCount(prev => prev + 1)
      writeMBTI && setTrueCount(prev => prev + 1)
      writeRomance && setTrueCount(prev => prev + 1)
      writeCareerLiving && setTrueCount(prev => prev + 1)
      writeEtc && setTrueCount(prev => prev + 1)
      writeHobby && setTrueCount(prev => prev + 1)
    }
    fetchAndSetUser();
  }, [writeThumbImage,
    writeBasicInfo,
    writeCareerInfo,
    writeCarrerDocu,
    writeMBTI,
    writeRomance,
    writeCareerLiving,
    writeEtc,
    writeHobby])

  const updatenotify = () => toast(`문서 업데이트 완료! ${trueCount}/9개 섹션 입력완료!`);

  useEffect(() => {
    async function fetchData() {
      // You can await here
      if (selectedImages?.length === URLs?.length && URLs?.length !== 0) {
        setFinish(true);
      }
      // ...
    }
    fetchData();
  }, [URLs?.length, selectedImages?.length]); // Or [] if effect doesn't need props or state

  useEffect(() => {
    if (uploadJobDocumentDone) {
      setLoading(false);
      setSelectedImages([])
      setImages([])
      setProgress(0)
      setURLs([])
      setFinish(false);
      updatenotify();
      dispatch(uploadJobDocumentDoneFalse());
    }
  }, [dispatch, uploadJobDocumentDone])


  return (
    <div className="py-4">
      <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="jobdocument">
        직장 증명서류 제출
      </label>
      <div className='w-full rounded-md p-2 border-s-amber-500 text-sm text-gray-500 bg-slate-100'>
        <p>직장인: 재직증명서 또는 명함</p>
        <p>프리랜서: 사업소득원천징수영수증 또는 소득금액증명 등 증빙서류</p>
        <p>대학원생: 대학원 재학증명서 등</p>
      </div>

      <div className='flex flex-col flex-col-1'>
        <div className='w-full my-4 flex flex-col justify-center relative'>
          <>
            {user?.jobdocument?.length >= 1 &&
              <Image
                className="rounded-xl h-[566px] w-full bg-black object-contain"
                alt="thumbimg"
                unoptimized
                width="0"
                height="0"
                sizes="100vw"
                src={user?.jobdocument[0] || ""}
              />
            }
          </>
        </div>
      </div>
      {!finish || loading === true ?
        <div className="max-w-lg mx-auto">
          {/* <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="jobdocument">
          Upload file</label> */}
          <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            aria-describedby="jobdocument_help"
            onChange={changePicture}
            multiple={false}
            accept="image/png , image/jpeg, image/webp"
            id="jobdocument" type="file" />
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="jobdocument_help">
            이미지 파일 업로드(파일형식 : png, jpeg, webp)</div>
        </div> : null}
      {/* {!selectedImages && selectedImages?.length !== 0 ? */}

      <div className='flex flex-col justify-end py-2'>
        {loading === false && finish === false && selectedImages?.length !== 0 &&
          <button
            type="button" onClick={uploadImageDB}
            className="text-white font-bold py-3 px-8 text-md bg-slate-600
                   hover:bg-slate-700 focus:ring-4 focus:outline-none
                    focus:ring-slate-200 dark:focus:ring-slate-800 text-md rounded-md 
                    text-center cursor-pointer flex justify-center
                     items-center"
          >
            <span className='ml-1'>문서 업로드</span>
          </button>
        }
      </div>
      {loading == true &&
        <div className='w-full'>
          <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
            <ProgressBar
              width={`${progress}%`}
              className="bg-gray-600 text-xs font-medium text-gray-100 text-center p-0.5 leading-none rounded-full"
            > {progress}%</ProgressBar>
          </div>
        </div>
      }

      {progress === 100 && progress !== 0 && selectedImages?.length !== 0 ? <div>업로드가 완료되었습니다.</div> : null}
      {finish && loading === false ?
        <div className='flex flex-col justify-end my-2'>
          <button
            type="button" onClick={onSubmit}
            className="text-white font-bold p-4 px-8 text-md bg-gray-600/90
                   hover:bg-gray-600 focus:ring-4 focus:outline-none
                    focus:ring-gray-200 dark:focus:ring-gray-800 text-lg rounded-sm 
                    py-2 text-center cursor-pointer flex justify-center
                     items-center"
          >
            <span className=''>문서 저장</span>
          </button>
        </div> : null}
    </div>
  );
};

export default index;