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

async function updateUserDatabase(property, newValue) {
  if (!auth.currentUser) return;

  const user = auth.currentUser;
  await updateDoc(
    doc(db, "users", user.uid),
    {
      [property]: newValue,
    }
  );
}

export async function updateUserBasicInfo(
  username, nickname, newForm, religion, tel, gender,
  address_sido, address_sigugun) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateProfile(user, {
      displayName: username,
    });
    await updateUserDatabase("religion", religion);
    await updateUserDatabase("username", user.displayName);
    await updateUserDatabase("nickname", nickname);
    await updateUserDatabase("gender", gender);
    await updateUserDatabase("birthday", newForm);
    // await updateUserDatabase("url_one", url_one);
    // await updateUserDatabase("url_two", url_two);
    // await updateUserDatabase("url_three", url_three);
    await updateUserDatabase("address_sido", address_sido);
    await updateUserDatabase("address_sigugun", address_sigugun);
    await updateUserDatabase("phonenumber", tel);
    // await updateUserDatabase("category", checkedCategory);
    return ({
      username: username, nickname: nickname,
      newForm: newForm, religion: religion, tel: tel,
      gender: gender, address_sido: address_sido,
      address_sigugun: address_sigugun,
    })
  } catch (error) {
    console.error(error);
    alert("profile update에 문제가 있습니다.");
  }
}

export async function updateThinkMbtiInfo(
  mbti_ei, mbti_sn, mbti_tf, mbti_jp) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("mbti_ei", mbti_ei);
    await updateUserDatabase("mbti_sn", mbti_sn);
    await updateUserDatabase("mbti_tf", mbti_tf);
    await updateUserDatabase("mbti_jp", mbti_jp);
    return ({
      mbti_ei: mbti_ei, mbti_sn: mbti_sn,
      mbti_tf: mbti_tf, mbti_jp: mbti_jp,
    })
  } catch (error) {
    console.error(error);
    alert("MBTI update에 문제가 있습니다.");
  }
}



export async function updateMycompanyInfo
  (education,
    school,
    school_open,
    job,
    company,
    company_open,
    salary,
    duty,
    company_location_sido,
    company_location_sigugun,
  ) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("education", education);
    await updateUserDatabase("school", school);
    await updateUserDatabase("school_open", school_open);
    await updateUserDatabase("job", job);
    await updateUserDatabase("company", company);
    await updateUserDatabase("company_open", company_open);
    await updateUserDatabase("duty", duty);
    await updateUserDatabase("salary", salary);
    await updateUserDatabase("company_location_sido", company_location_sido);
    await updateUserDatabase("company_location_sigugun", company_location_sigugun);
    // await updateUserDatabase("jobdocument", user.jobdocument);

    return ({
      education: education,
      school: school,
      school_open: school_open,
      job: job,
      company: company,
      company_open: company_open,
      duty: duty,
      salary: salary,
      company_location_sido: company_location_sido,
      company_location_sigugun: company_location_sigugun,
    })
  } catch (error) {
    console.error(error);
    alert("profile update에 문제가 있습니다.");
  }
}

export async function updateHobby(
  hobby, drink, health, hotplace, tour, tourlike, tourpurpose,
  hobbyshare, interest) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("hobby", hobby);
    await updateUserDatabase("drink", drink);
    await updateUserDatabase("health", health);
    await updateUserDatabase("hotplace", hotplace);
    await updateUserDatabase("tour", tour);
    await updateUserDatabase("tourlike", tourlike);
    await updateUserDatabase("tourpurpose", tourpurpose);
    await updateUserDatabase("hobbyshare", hobbyshare);
    await updateUserDatabase("interest", interest);
    return ({
      hobby: hobby, drink: drink, health: health,
      hotplace: hotplace, tour: tour, tourlike: tourlike,
      tourpurpose: tourpurpose, hobbyshare: hobbyshare, interest: interest,
    })
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}

export async function updateRomance(
  opfriend, friendmeeting, longdistance, datecycle, dateromance, contact,
  contactcycle, passwordshare, wedding, wedding_dating, prefer_age_min,
  prefer_age_max) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("opfriend", opfriend);
    await updateUserDatabase("friendmeeting", friendmeeting);
    await updateUserDatabase("longdistance", longdistance);
    await updateUserDatabase("datecycle", datecycle);
    await updateUserDatabase("dateromance", dateromance);
    await updateUserDatabase("contact", contact);
    await updateUserDatabase("contactcycle", contactcycle);
    await updateUserDatabase("passwordshare", passwordshare);
    await updateUserDatabase("wedding", wedding);
    await updateUserDatabase("wedding_dating", wedding_dating);
    await updateUserDatabase("prefer_age_min", prefer_age_min);
    await updateUserDatabase("prefer_age_max", prefer_age_max);

    return ({
      opfriend: opfriend,
      friendmeeting: friendmeeting,
      longdistance: longdistance,
      datecycle: datecycle,
      dateromance: dateromance,
      contact: contact,
      contactcycle: contactcycle,
      passwordshare: passwordshare,
      wedding: wedding,
      wedding_dating: wedding_dating,
      prefer_age_min: prefer_age_min,
      prefer_age_max: prefer_age_max,
    })
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}