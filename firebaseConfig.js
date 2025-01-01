// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  updateDoc,
  getDoc,
  FieldValue,
  DocumentData,
  DocumentReference,
  deleteField,
  serverTimestamp, limit, arrayUnion, arrayRemove,
  query, where, getDocs, orderBy,
  deleteDoc, startAfter, increment, limitToLast
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updateEmail,
  AuthCredential,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInAnonymously,
} from "firebase/auth";
import dayjs from "dayjs";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);
export const currentUser = auth.currentUser;

export { app, auth, db };

var now = dayjs();
const nowForCopy = dayjs(now);
const time = nowForCopy.format('YYYY-MM-DD HH:mm:ss');


// 로그인/아웃에 따라서 user값이 변경됨(기본설정함수)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    const uid = user.uid;
    return user;
    // ...
  } else {
    // User is signed out
    return user;
    // ...
  }
});


export async function getUser(userId) {
  const result = await getDoc(api.userByIdRef(userId));

  // const user = await userRef.doc('currentUser.uid').get();
  // if (!user.exists) {
  //   return res.status(404).json({});
  // }

  if (result.exists()) {
    return { id: result.id, ...result.data() }
  } else {
    // doc.data() will be undefined in this case
    console.log("No such document!");
  }


  return res.status(404).json({ id: user.id, ...user.data() });
}

export async function getOtherUser(otherid) {
  try {
    const result = await getDoc(api.userByIdRef(otherid));
    if (result.exists()) {
      const user = {
        ...result.data(),
        likes: result.data().likes || [],
        liked: result.data().liked || [],
        advices: result.data().advices || [],
        adviced: result.data().adviced || [],
        coccocs: result.data().coccocs || [],
        coccoced: result.data().coccoced || [],
        joboffers: result.data().joboffers || [],
        joboffered: result.data().joboffered || [],
        userID: otherid
      };

      return user;
    }
  } catch (e) {
    console.error(e)
  }
}

export async function createAccount(
  email, password, username, nickname, form, tel
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )


    // Signed in
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: username,
      photoURL: "",
    });
    // Profile updated

    const now = new Date();
    const nowForCopy = dayjs(now);
    const time = nowForCopy?.format('YYYY-MM-DD HH:mm:ss');

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username,
      avatar: "",
      birthday: form,
      phonenumber: tel,
      likes: [],
      liked: [],
      joboffers: [],
      joboffered: [],
      coccocs: [],
      coccoced: [],
      advices: [],
      adviced: [],
      // tag: "0000", // Create function to generate unique tag for each username
      // about: "",
      // banner: "#7CC6FE",
      email: user.email,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    })
    //   // setIsLoading(false);
    // Database updated

    // await joinServer("ke6NqegIvJEOa9cLzUEp");
    // User joins global chat
    return (user);
  } catch (error) {
    if (error == "auth/email-already-in-use") {
      alert("동일한 이메일 주소가 존재합니다.")
    }
    //   // setIsLoading(false);
  }
}


// 명령 실행시 await 필수!
export async function emailDubCheck(email) {
  const userRef = collection(db, "users");
  const q = query(userRef, where("email", "==", email));
  //결과 검색
  const querySnapshot = await getDocs(q);
  const result = querySnapshot?.docs?.map((doc) => (
    {
      ...doc.data(),
      id: doc.id,
    }
  ))
  return result
}


export const signIn = async (email, password) => {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (!user) {
        throw new Error(
          "Email is not verified. We have sent the verification link again. Please check your inbox/spam."
        );
      }
      return user;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return errorCode
    });
}

export async function logOut() {
  try {
    await signOut(auth);
    // Sign-out successful.
  } catch (error) {
    console.error(error);
    // An error happened.
  }
}


// for now mail will automatically be configured to my email
export async function sendMailForSignUp(email, username) {
  const mailRef = collection(db, "mail");
  try {
    await addDoc(mailRef, {
      to: `${email}`,
      from: "피그말리온 관리자 - admin@pygmalion.co.kr",
      // or to: "someone@example.com
      message: {
        subject: `${username}님! 피그말리온(PYGMALION) 회원가입을 환영합니다!`,
        // text: '메시지를 확인해주세요',
        html: `
        <h1>WELCOME TO JOBCOC!</h1>
        <br/>
        프로필 입력 후에는, 소개팅 또는 일대일 반상회 등 다양한 서비스를 확인할 수 있습니다. 
        <br/><br/>피그말리온 바로가기: <a href="https://pygmalion.co.kr/">여기를</a> 클릭하세요.`
      },
      template: {
        name: 'welcome',
        data: {
          fname: 'Nextpus',
          msg: '자연스럽고 즐거운 만남! 피그말리온'
        }
      }
    })
  } catch (e) {
    console.log(e);
    throw new Error('Something went wrong with sending email. Error Message: ', e.message);
  }
}