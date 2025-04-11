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
  query, where, getDocs, orderBy, or,
  deleteDoc, startAfter, increment, limitToLast, onSnapshot
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
import { httpsCallable, getFunctions } from 'firebase/functions';

// const cors = require("cors");

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// app.use(cors());
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

export const api = {
  // usersRef: collection(db, "users"),
  usersRef: query(
    collection(db, "users"),
    // where("purpose", "!=", 1),
    // orderBy("purpose"),
    // orderBy("timestamp", "desc")
  ),

  userByIdRef: (userId) =>
    doc(db, "users", `${userId}`),
  datecardByIdRef: (userId) =>
    doc(db, "datecards", `${userId}`),

  // adminUsersRef: query(
  //   collection(db, "users"),
  //   where("role", "==", "admin")
  // ),

  couplesRef: collection(db, "couples"),
  couplesByIdRef: (userId) =>
    doc(db, "couples", `${userId}`),

  // viewsRef: collection(db, "ViewsData"),
  // educationsRef: collection(db, "educations"),
  // singosRef: collection(db, "singos"),
  // jobofferRef: collection(db, "joboffers"),
  // subscribeRef: collection(db, "subscribes"),
  // coccocRef: collection(db, "coccocs"),
  // careersRef: collection(db, "careers"),
  // mystyleRef: collection(db, "mystyle"),
  // blogsRef: collection(db, "blogs"),
  // boardsRef: collection(db, "boards"),
  // skillsRef: collection(db, "skills"),
  // sectionsRef: collection(db, "sections"),
  // postsRef: collection(db, "posts"),
  // conversationRef: collection(db, "conversations"),
  // boardByIdRef: (boardId) =>
  //   doc(db, "boards", `${boardId}`),
  // sectionByIdRef: (sectionId) =>
  //   doc(db, "sections", `${sectionId}`),
  // postByIdRef: (postId) =>
  //   doc(db, "posts", `${postId}`),
  // commentByIdRef: (commentId) =>
  //   doc(db, "comments", `${commentId}`),
  // blogDescriptionByBloggerIdRef: (bloggerId) =>
  //   query(
  //     collection(db, "blogsDescription"),
  //     where("bloggerId", "==", `${bloggerId}`)
  //   ),

  // blogsMetaRef: collection(db, "blogsMeta"),

  // blogsMetaByIdCollRef: (blogId) =>
  //   collection(db, "blogsMeta", `${blogId}`),

  // commentsRef: collection(db, "comments"),

  // commentsByCommentId: (commentId) =>
  //   doc(db, `comments`, `${commentId}`),

  // commentsByPostIdRef: (postId) =>
  //   query(
  //     collection(db, "comments"),
  //     where("postId", "==", `${postId}`)
  //   ),

  // notificationRef: collection(db, "notifications"),

  // notificationByIdRef: (notificationId) =>
  //   doc(db, "notifications", `${notificationId}`),

  // notificationByReceiverIdRef: (receiverId) =>
  //   query(
  //     collection(db, "notifications"),
  //     where("receiverId", "==", `${receiverId}`)
  //   ),

  // sotrageRef: (file) => ref(storage, "images/" + file?.name),
};


export async function getUser(userId) {
  const result = await getDoc(api.userByIdRef(userId));

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
    const currentUser = auth.currentUser;
    const result = await getDoc(api.userByIdRef(currentUser?.uid));
    // if (!result.exists()) {
    //   return;
    // }
    const user = {
      ...result.data(),
      likes: result.data().likes || [],
      liked: result.data().liked || [],
      dislikes: result.data().dislikes || [],
      disliked: result.data().disliked || [],
      userID: currentUser?.uid
    };
    const newArr = [];
    user?.datecard?.map(async (v) => (
      await v?.userID == otherid ? newArr?.push(v) : null
    ))

    const result2 = await getDoc(api.userByIdRef(otherid));
    const friend = {
      ...result2.data(),
      likes: result2.data().likes || [],
      liked: result2.data().liked || [],
      dislikes: result2.data().dislikes || [],
      disliked: result2.data().disliked || [],
      userID: otherid,
      expired: newArr[0]?.expired,
      card_timestamp: newArr[0]?.card_timestamp,
    }
    return friend
  } catch (e) {
    console.error(e)
  }
}

export async function createAccount(
  email, password, gender, username, nickname, form, tel
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
      gender: gender,
      nickname: nickname,
      thumbimage: "",
      birthday: form,
      phonenumber: tel,
      likes: [],
      liked: [],
      dislikes: [],
      disliked: [],
      wink: 0,
      date_sleep: false,
      date_profile_finished: false,
      withdraw: false,
      datecard: [],
      date_lastIntroduce: "",
      // joboffers: [],
      // joboffered: [],
      // coccocs: [],
      // coccoced: [],
      // advices: [],
      // adviced: [],
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

// 명령 실행시 await 필수!
export async function usernameDubCheck(username) {
  const userRef = collection(db, "users");
  const q = query(userRef, where("username", "==", username));
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
  username, nickname, newForm, religion, tel,
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
    // await updateUserDatabase("gender", gender);
    await updateUserDatabase("birthday", newForm);
    await updateUserDatabase("address_sido", address_sido);
    await updateUserDatabase("address_sigugun", address_sigugun);
    await updateUserDatabase("phonenumber", tel);
    return ({
      username: username, nickname: nickname,
      newForm: newForm, religion: religion, tel: tel,
      address_sido: address_sido,
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


export async function updateCareerLiving(
  career_goal, living_weekend, living_consume, living_pet,
  living_tatoo, living_smoke, living_charming) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("career_goal", career_goal);
    await updateUserDatabase("living_weekend", living_weekend);
    await updateUserDatabase("living_consume", living_consume);
    await updateUserDatabase("living_pet", living_pet);
    await updateUserDatabase("living_tatoo", living_tatoo);
    await updateUserDatabase("living_smoke", living_smoke);
    await updateUserDatabase("living_charming", living_charming);

    return ({
      career_goal: career_goal,
      living_weekend: living_weekend,
      living_consume: living_consume,
      living_pet: living_pet,
      living_tatoo: living_tatoo,
      living_smoke: living_smoke,
      living_charming: living_charming,
    })
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}

export async function updateEtc(
  religion_important, religion_visit, religion_accept, food_taste,
  food_like, food_dislike, food_vegetarian, food_spicy, food_diet) {

  const user = auth.currentUser;

  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("religion_important", religion_important);
    await updateUserDatabase("religion_visit", religion_visit);
    await updateUserDatabase("religion_accept", religion_accept);
    await updateUserDatabase("food_taste", food_taste);
    await updateUserDatabase("food_like", food_like);
    await updateUserDatabase("food_dislike", food_dislike);
    await updateUserDatabase("food_vegetarian", food_vegetarian);
    await updateUserDatabase("food_spicy", food_spicy);
    await updateUserDatabase("food_diet", food_diet);

    return ({
      religion_important: religion_important,
      religion_visit: religion_visit,
      religion_accept: religion_accept,
      food_taste: food_taste,
      food_like: food_like,
      food_dislike: food_dislike,
      food_vegetarian: food_vegetarian,
      food_spicy: food_spicy,
      food_diet: food_diet,
    })
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}


export async function getFriends() {
  const q = query(api.usersRef,
    // where("purpose", ">", 1),
    // where("purpose", "<", 4),
    // orderBy("purpose", "asc"),
    orderBy("timestamp", "desc"),

    // where("purpose", "!=", 4),
    // orderBy("purpose", "desc"),
    // where("avatar", "!=", ""),
    // orderBy("avatar", "desc")
  );
  const querySnapshot = await getDocs(q);

  const people = await Promise.all(querySnapshot?.docs?.map(async (doc) => {
    // var skills = await getSkillsByUser(doc.data().id)
    // var careers = await getCareersByUser(doc.data().id)
    // var educations = await getEducationsByUser(doc.data().id)
    // var joboffered = await getJobofferedByUserId(doc.data().id)
    // var joboffers = await getJoboffersByUserId(doc.data().id)
    // var coccoced = await getCoccocedByUserId(doc.data().id)
    // var coccocs = await getCoccocsByUserId(doc.data().id)
    const man = {
      userID: doc.data().id,
      username: doc.data().username,
      nickname: doc.data().nickname,
      email: doc.data().email,
      birthday: doc.data().birthday,
      gender: doc.data().gender,
      thumbimage: doc.data().thumbimage,
      phonenumber: doc.data().phonenumber,
      religion: doc.data().religion,
      address_sido: doc.data().address_sido,
      address_sigugun: doc.data().address_sigugun,

      education: doc.data().education,
      school: doc.data().school,
      school_open: doc.data().school_open,
      job: doc.data().job,
      company: doc.data().company,
      company_open: doc.data().company_open,
      jobdocument: doc.data().jobdocument,
      duty: doc.data().duty,
      salary: doc.data().salary,
      company_location_sido: doc.data().company_location_sido,
      company_location_sigugun: doc.data().company_location_sigugun,

      mbti_ei: doc.data().mbti_ei,
      mbti_sn: doc.data().mbti_sn,
      mbti_tf: doc.data().mbti_tf,
      mbti_jp: doc.data().mbti_jp,

      hobby: doc.data().hobby,
      drink: doc.data().drink,
      health: doc.data().health,
      hotplace: doc.data().hotplace,
      tour: doc.data().tour,
      tourlike: doc.data().tourlike,
      tourpurpose: doc.data().tourpurpose,
      hobbyshare: doc.data().hobbyshare,
      interest: doc.data().interest,

      opfriend: doc.data().opfriend,
      friendmeeting: doc.data().friendmeeting,
      longdistance: doc.data().longdistance,
      datecycle: doc.data().datecycle,
      dateromance: doc.data().dateromance,
      contact: doc.data().contact,
      contactcycle: doc.data().contactcycle,
      passwordshare: doc.data().passwordshare,
      wedding: doc.data().wedding,
      wedding_dating: doc.data().wedding_dating,
      prefer_age_min: doc.data().prefer_age_min,
      prefer_age_max: doc.data().prefer_age_max,

      career_goal: doc.data().career_goal,
      living_weekend: doc.data().living_weekend,
      living_consume: doc.data().living_consume,
      living_pet: doc.data().living_pet,
      living_tatoo: doc.data().living_tatoo,
      living_smoke: doc.data().living_smoke,
      living_charming: doc.data().living_charming,

      religion_important: doc.data().religion_important,
      religion_visit: doc.data().religion_visit,
      religion_accept: doc.data().religion_accept,
      food_taste: doc.data().food_taste,
      food_like: doc.data().food_like,
      food_dislike: doc.data().food_dislike,
      food_vegetarian: doc.data().food_vegetarian,
      food_spicy: doc.data().food_spicy,
      food_diet: doc.data().food_diet,
      wink: doc.data().wink,
      date_sleep: doc.data().date_sleep,
      withdraw: doc.data().withdraw,
      datecard: doc.data().datecard || [],
      date_lastIntroduce: doc.data().date_lastIntroduce,
      timestamp: doc.data().timestamp,

      likes: doc.data().likes || [],
      liked: doc.data().liked || [],
      dislikes: doc.data().dislikes || [],
      disliked: doc.data().disliked || [],
      // advices: doc.data().advices || [],
      // adviced: doc.data().adviced || [],
      // cliptype: doc.data().cliptype,
      // coccocs: doc.data().coccocs || [],
      // coccoced: doc.data().coccoced || [],
      // joboffers: doc.data().joboffers || [],
      // joboffered: doc.data().joboffered || [],
      // skills: skills,
      // careers: careers,
      // educations: educations,
      // joboffered: joboffered,
      // joboffers: joboffers,
      // coccoced: coccoced,
      // coccocs: coccocs,
    }
    return man;
  }))
  // const result = [];
  // people?.map(v => (
  //   v?.careers?.length !== 0 && result?.push(v)
  // ))
  return people;
}

export async function updateUserInfos(fakes) {

  try {
    const userRef = collection(db, "users");
    const res = await fakes?.map(async (v) => (
      await setDoc(doc(db, "users", v.id), {
        ...v,
        // id: v?.uid,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      )))
    return res;
  } catch (e) {
    console.error(e)
  }
}

export async function updateServiceInfoSeen(input) {
  const user = auth.currentUser;
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("infoseen", input);
    return input;
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}


// LIKE USER
export async function likeUser(
  userId, username,
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    await updateDoc(api.userByIdRef(user.uid), {
      likes: arrayUnion({
        userId: userId,
        username: username,
        startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        refund: false
      }),
    });
    await updateDoc(api.userByIdRef(userId), {
      liked: arrayUnion({
        userId: user.uid,
        username: user.displayName,
        startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        refund: false
      }),
    });
    await updateDoc(api.userByIdRef(user.uid), {
      wink: increment(-1)
    })
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = {
        ...docSnap.data(),
      }
      return result;
    }
  } catch (e) {
    console.error(e);
  }
}


// 7일지나면 하트 페이백
export async function onPaybackHeart(
  finalArr
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const length = finalArr?.length;
    // 검색
    const result = await getDoc(api.userByIdRef(user.uid));
    // if (result.exists()) {
    const me = {
      ...result.data(),
      likes: result.data().likes || [],
      liked: result.data().liked || [],
      dislikes: result.data().dislikes || [],
      disliked: result.data().disliked || [],
      userID: user.uid
    };

    const removeArr = [];
    me?.likes?.map(async (v) => (
      finalArr?.map(async (m) => (
        v?.userId == m?.userId ? removeArr?.push(v) : null))
    ))

    removeArr?.map(async (v) => (
      await updateDoc(api.userByIdRef(user.uid), {
        likes: arrayRemove(v),
      })
    ))

    const fixArr = [];
    removeArr?.map(async (v) => (
      fixArr?.push({
        ...v, refund: true
      })
    ))

    fixArr?.map(async (v) => (
      await updateDoc(api.userByIdRef(user.uid), {
        likes: arrayUnion(v),
      }, { merge: true })
    ))

    await updateDoc(api.userByIdRef(user.uid), {
      wink: increment(length)
    })
    // const docRef = doc(db, "users", userId);
    // const docSnap = await getDoc(docRef);
    // if (docSnap.exists()) {
    //   const result = {
    //     ...docSnap.data(),
    //   }
    //   return result;
    // }
    return { removeArr, fixArr }
  } catch (e) {
    console.error(e);
  }
}

// LIKE USER
export async function dislikeUser(
  userId, username,
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    await updateDoc(api.userByIdRef(user.uid), {
      dislikes: arrayUnion({ userId: userId, username: username, startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), }),
    });
    await updateDoc(api.userByIdRef(userId), {
      disliked: arrayUnion({ userId: user.uid, username: user.displayName, startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), }),
    });
    await updateDoc(api.userByIdRef(userId), {
      wink: increment(1)
    })
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = {
        ...docSnap.data(),
      }
      return result;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function passUser(
  userId, username,
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    await updateDoc(api.userByIdRef(user.uid), {
      dislikes: arrayUnion({ userId: userId, username: username, startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), }),
    });
    await updateDoc(api.userByIdRef(userId), {
      disliked: arrayUnion({ userId: user.uid, username: user.displayName, startAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), }),
    });
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = {
        ...docSnap.data(),
      }
      return result;
    }
  } catch (e) {
    console.error(e);
  }
}
// // UNLIKE USER
// export async function unlikeUser(
//   userId, username,
// ) {
//   const user = auth.currentUser;
//   if (!user) {
//     return alert("로그인 후 가능합니다.")
//   }

//   try {
//     await updateDoc(api.userByIdRef(userId), {
//       liked: arrayRemove({ userId: user?.uid, username: user?.displayName }),
//     });
//     return await updateDoc(api.userByIdRef(user?.uid), {
//       likes: arrayRemove({ userId: userId, username: username }),
//     });
//   } catch (e) {
//     console.error(e);
//   }
// }

// update number of views
export async function countNumberOfViews(userId, number) {

  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  return await updateDoc(api.userByIdRef(userId), {
    numViews: increment(number),
  });
}

export async function getLikesFriendsByUserId(likes, liked) {
  const user = auth.currentUser;
  try {

    const q = query(api.usersRef,
      // where("purpose", "!=", 4),
      orderBy("timestamp", "desc"),
      // orderBy("purpose", "desc"),
      // where("avatar", "!=", ""),
      // orderBy("avatar", "desc")
    );
    const querySnapshot = await getDocs(q);
    const arr = [];

    let today = dayjs();


    const result = Promise.all(querySnapshot?.docs?.map(async (doc) => {
      await likes?.map(async (m) => (
        m?.userId == doc.data().id &&
        Math.ceil(dayjs(m?.startAt).add(7, 'day')?.diff(today, "day", true)) >= 0 &&
        arr?.push(
          {
            userID: doc.data().id,
            username: doc.data().username,
            nickname: doc.data().nickname,
            email: doc.data().email,
            birthday: doc.data().birthday,
            gender: doc.data().gender,
            thumbimage: doc.data().thumbimage,
            phonenumber: doc.data().phonenumber,
            religion: doc.data().religion,
            address_sido: doc.data().address_sido,
            address_sigugun: doc.data().address_sigugun,
            education: doc.data().education,
            school: doc.data().school,
            school_open: doc.data().school_open,
            job: doc.data().job,
            company: doc.data().company,
            company_open: doc.data().company_open,
            jobdocument: doc.data().jobdocument,
            duty: doc.data().duty,
            salary: doc.data().salary,
            company_location_sido: doc.data().company_location_sido,
            company_location_sigugun: doc.data().company_location_sigugun,
            mbti_ei: doc.data().mbti_ei,
            mbti_sn: doc.data().mbti_sn,
            mbti_tf: doc.data().mbti_tf,
            mbti_jp: doc.data().mbti_jp,
            hobby: doc.data().hobby,
            drink: doc.data().drink,
            health: doc.data().health,
            hotplace: doc.data().hotplace,
            tour: doc.data().tour,
            tourlike: doc.data().tourlike,
            tourpurpose: doc.data().tourpurpose,
            hobbyshare: doc.data().hobbyshare,
            interest: doc.data().interest,
            opfriend: doc.data().opfriend,
            friendmeeting: doc.data().friendmeeting,
            longdistance: doc.data().longdistance,
            datecycle: doc.data().datecycle,
            dateromance: doc.data().dateromance,
            contact: doc.data().contact,
            contactcycle: doc.data().contactcycle,
            passwordshare: doc.data().passwordshare,
            wedding: doc.data().wedding,
            wedding_dating: doc.data().wedding_dating,
            prefer_age_min: doc.data().prefer_age_min,
            prefer_age_max: doc.data().prefer_age_max,
            career_goal: doc.data().career_goal,
            living_weekend: doc.data().living_weekend,
            living_consume: doc.data().living_consume,
            living_pet: doc.data().living_pet,
            living_tatoo: doc.data().living_tatoo,
            living_smoke: doc.data().living_smoke,
            living_charming: doc.data().living_charming,
            religion_important: doc.data().religion_important,
            religion_visit: doc.data().religion_visit,
            religion_accept: doc.data().religion_accept,
            food_taste: doc.data().food_taste,
            food_like: doc.data().food_like,
            food_dislike: doc.data().food_dislike,
            food_vegetarian: doc.data().food_vegetarian,
            food_spicy: doc.data().food_spicy,
            food_diet: doc.data().food_diet,
            infoseen: doc.data().infoseen,
            wink: doc.data().wink,
            date_sleep: doc.data().date_sleep,
            withdraw: doc.data().withdraw,
            datecard: doc.data().datecard || [],
            date_lastIntroduce: doc.data().date_lastIntroduce,
            timestamp: doc.data().timestamp,

            likes: doc.data().likes || [],
            liked: doc.data().liked || [],
            dislikes: doc.data().dislikes || [],
            disliked: doc.data().disliked || [],
            startAt: m?.startAt || "",
          })))
    }))

    // 빼야할 배열(교차하는 것)
    const final = [];
    await liked?.map(async (m) => (
      arr?.map((v) => (
        m?.userId == v?.userID &&
        final?.push(v)
      ))
    ))

    // 차집합 공식
    let difference = arr.filter(x => !final.includes(x));
    return difference;

  } catch (e) {
    console.error(e);
  }
}

export async function getLikedFriendsByUserId(liked, likes) {
  const user = auth.currentUser;
  try {

    const q = query(api.usersRef,
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    const arr = [];
    let today = dayjs();
    const result = Promise.all(querySnapshot?.docs?.map(async (doc) => {
      await liked?.map(async (m) => (
        m?.userId == doc.data().id &&
        Math.ceil(dayjs(m?.startAt).add(7, 'day')?.diff(today, "day", true)) >= 0 &&
        arr?.push(
          {
            userID: doc.data().id,
            username: doc.data().username,
            nickname: doc.data().nickname,
            email: doc.data().email,
            birthday: doc.data().birthday,
            gender: doc.data().gender,
            thumbimage: doc.data().thumbimage,
            phonenumber: doc.data().phonenumber,
            religion: doc.data().religion,
            address_sido: doc.data().address_sido,
            address_sigugun: doc.data().address_sigugun,
            education: doc.data().education,
            school: doc.data().school,
            school_open: doc.data().school_open,
            job: doc.data().job,
            company: doc.data().company,
            company_open: doc.data().company_open,
            jobdocument: doc.data().jobdocument,
            duty: doc.data().duty,
            salary: doc.data().salary,
            company_location_sido: doc.data().company_location_sido,
            company_location_sigugun: doc.data().company_location_sigugun,
            mbti_ei: doc.data().mbti_ei,
            mbti_sn: doc.data().mbti_sn,
            mbti_tf: doc.data().mbti_tf,
            mbti_jp: doc.data().mbti_jp,
            hobby: doc.data().hobby,
            drink: doc.data().drink,
            health: doc.data().health,
            hotplace: doc.data().hotplace,
            tour: doc.data().tour,
            tourlike: doc.data().tourlike,
            tourpurpose: doc.data().tourpurpose,
            hobbyshare: doc.data().hobbyshare,
            interest: doc.data().interest,
            opfriend: doc.data().opfriend,
            friendmeeting: doc.data().friendmeeting,
            longdistance: doc.data().longdistance,
            datecycle: doc.data().datecycle,
            dateromance: doc.data().dateromance,
            contact: doc.data().contact,
            contactcycle: doc.data().contactcycle,
            passwordshare: doc.data().passwordshare,
            wedding: doc.data().wedding,
            wedding_dating: doc.data().wedding_dating,
            prefer_age_min: doc.data().prefer_age_min,
            prefer_age_max: doc.data().prefer_age_max,
            career_goal: doc.data().career_goal,
            living_weekend: doc.data().living_weekend,
            living_consume: doc.data().living_consume,
            living_pet: doc.data().living_pet,
            living_tatoo: doc.data().living_tatoo,
            living_smoke: doc.data().living_smoke,
            living_charming: doc.data().living_charming,
            religion_important: doc.data().religion_important,
            religion_visit: doc.data().religion_visit,
            religion_accept: doc.data().religion_accept,
            food_taste: doc.data().food_taste,
            food_like: doc.data().food_like,
            food_dislike: doc.data().food_dislike,
            food_vegetarian: doc.data().food_vegetarian,
            food_spicy: doc.data().food_spicy,
            food_diet: doc.data().food_diet,
            infoseen: doc.data().infoseen,
            wink: doc.data().wink,
            date_sleep: doc.data().date_sleep,
            withdraw: doc.data().withdraw,
            datecard: doc.data().datecard || [],
            date_lastIntroduce: doc.data().date_lastIntroduce,
            timestamp: doc.data().timestamp,

            likes: doc.data().likes || [],
            liked: doc.data().liked || [],
            dislikes: doc.data().dislikes || [],
            disliked: doc.data().disliked || [],
            startAt: m?.startAt || "",
          })))
    }))

    // 빼야할 배열(교차하는 것)
    const final = [];
    await likes?.map(async (m) => (
      arr?.map((v) => (
        m?.userId == v?.userID &&
        final?.push(v)
      ))
    ))

    // 차집합 공식
    let difference = arr.filter(x => !final.includes(x));
    return difference;
  } catch (e) {
    console.error(e);
  }
}


export async function getDateMatching(
  friendID, friendUsername,
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const coupleObject = await setDoc(doc(db, "couples", user.uid + " and " + friendID),
      {
        // id: user.uid,
        senderID: user.uid,
        senderName: user.displayName,
        receiverID: friendID,
        receiverName: friendUsername,
        connected: true,
        closed: false,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
    );

    const docRef = doc(db, "couples", user.uid + " and " + friendID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = {
        ...docSnap.data(),
      }
      return result;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function getMyCouples() {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const coupleRef = collection(db, "couples");
    const q = query(coupleRef,
      or(where("receiverID", "==", user.uid),
        where("senderID", "==", user.uid)),
      orderBy("timestamp", "desc"));

    //결과 검색
    const querySnapshot = await getDocs(q);
    const result = querySnapshot?.docs?.map((doc) => (
      {
        ...doc.data(),
        id: doc.id,
      }
    ))

    const userQ = query(api.usersRef,
      orderBy("timestamp", "desc"),
    );
    const userQuerySnapshot = await getDocs(userQ);
    const arr = [];

    Promise.all(userQuerySnapshot?.docs?.map(async (doc) => (
      result?.map(async (m) => (
        m?.receiverID == doc.data().id &&
        doc.data().id !== user?.uid &&
        arr?.push(
          {
            id: m?.id,
            myposition: "sender",
            senderID: m?.senderID,
            receiverID: m?.receiverID,
            connected: m?.connected,
            senderName: m?.senderName,
            receiverName: m?.receiverName,
            closed: m?.closed,
            timestamp: m?.timestamp,

            userID: doc.data().id,
            username: doc.data().username,
            nickname: doc.data().nickname,
            // email: doc.data().email,
            birthday: doc.data().birthday,
            // gender: doc.data().gender,
            thumbimage: doc.data().thumbimage,
            phonenumber: doc.data().phonenumber,
            // religion: doc.data().religion,
            address_sido: doc.data().address_sido,
            address_sigugun: doc.data().address_sigugun,
            education: doc.data().education,
            school: doc.data().school,
            school_open: doc.data().school_open,
            job: doc.data().job,
            company: doc.data().company,
            company_open: doc.data().company_open,
            mbti_ei: doc.data().mbti_ei,
            mbti_sn: doc.data().mbti_sn,
            mbti_tf: doc.data().mbti_tf,
            mbti_jp: doc.data().mbti_jp,
            date_sleep: doc.data().date_sleep,
            withdraw: doc.data().withdraw,
            // datecard: doc.data().datecard || [],
            date_lastIntroduce: doc.data().date_lastIntroduce,
            timestamp: doc.data().timestamp,
          })
      ))))
    )
    Promise.all(userQuerySnapshot?.docs?.map(async (doc) => (
      result?.map(async (m) => (
        m?.senderID == doc.data().id &&
        doc.data().id !== user?.uid &&
        arr?.push(
          {
            id: m?.id,
            myposition: "receiver",
            senderID: m?.senderID,
            receiverID: m?.receiverID,
            connected: m?.connected,
            senderName: m?.senderName,
            receiverName: m?.receiverName,
            closed: m?.closed,
            timestamp: m?.timestamp,

            userID: doc.data().id,
            username: doc.data().username,
            nickname: doc.data().nickname,
            // email: doc.data().email,
            birthday: doc.data().birthday,
            // gender: doc.data().gender,
            thumbimage: doc.data().thumbimage,
            phonenumber: doc.data().phonenumber,
            // religion: doc.data().religion,
            address_sido: doc.data().address_sido,
            address_sigugun: doc.data().address_sigugun,
            education: doc.data().education,
            school: doc.data().school,
            school_open: doc.data().school_open,
            job: doc.data().job,
            company: doc.data().company,
            company_open: doc.data().company_open,
            mbti_ei: doc.data().mbti_ei,
            mbti_sn: doc.data().mbti_sn,
            mbti_tf: doc.data().mbti_tf,
            mbti_jp: doc.data().mbti_jp,
            date_sleep: doc.data().date_sleep,
            withdraw: doc.data().withdraw,
            // datecard: doc.data().datecard || [],
            date_lastIntroduce: doc.data().date_lastIntroduce,
            timestamp: doc.data().timestamp,
          })
      )))))


    return arr;
    // return result
  } catch (e) {
    console.error(e);
  }
}

export async function setDateSleep(input) {
  const user = auth.currentUser;
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    if (input == true) {
      await updateUserDatabase("date_sleep", false);
      return ({ date_sleep: false })
    } else {
      await updateUserDatabase("date_sleep", true);
      return ({ date_sleep: true })
    }
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}

export async function reauthenticateUser(password) {
  if (!auth.currentUser || !auth.currentUser.email) return;

  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    password
  );

  await reauthenticateWithCredential(auth.currentUser, credential).then(() => {
    // User re-authenticated.
  }).catch((error) => {
    // An error ocurred
    // ...
    console.error(error);
  });
}

// 회원탈퇴
export async function getWithdraw() {
  const user = auth.currentUser;
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("withdraw", true);
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}


export async function addDateRating(
  friendID, friendUsername, currentRating
) {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const coupleObject = await setDoc(doc(db, "preference_rate", user.uid + " and " + friendID),
      {
        // id: user.uid,
        senderID: user.uid,
        senderName: user.displayName,
        receiverID: friendID,
        receiverName: friendUsername,
        rate: currentRating,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
    );

    const docRef = doc(db, "preference_rate", user.uid + " and " + friendID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = {
        ...docSnap.data(),
      }
      return result;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function getRatingsToMe() {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const preference_rateRef = collection(db, "preference_rate");
    const q = query(preference_rateRef,
      where("receiverID", "==", user.uid),
      // orderBy("timestamp", "desc")
    );

    //결과 검색
    const querySnapshot = await getDocs(q);
    const result = querySnapshot?.docs?.map((doc) => (
      {
        ...doc.data(),
        id: doc.id,
      }
    ))
    return result;
    // return result
  } catch (e) {
    console.error(e);
  }
}

export async function getMyRatings() {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const preference_rateRef = collection(db, "preference_rate");
    const q = query(preference_rateRef,
      where("senderID", "==", user.uid),
      // orderBy("timestamp", "desc")
    );

    //결과 검색
    const querySnapshot = await getDocs(q);
    const result = querySnapshot?.docs?.map((doc) => (
      {
        ...doc.data(),
        id: doc.id,
      }
    ))

    return result;
    // return result
  } catch (e) {
    console.error(e);
  }
}

export async function getAllRatings() {
  const user = auth.currentUser;
  if (!user) {
    return alert("로그인 후 가능합니다.")
  }
  try {
    const preference_rateRef = collection(db, "preference_rate");
    const q = query(preference_rateRef,
      // orderBy("timestamp", "desc")
    );

    //결과 검색
    const querySnapshot = await getDocs(q);
    const result = querySnapshot?.docs?.map((doc) => (
      {
        ...doc.data(),
        id: doc.id,
      }
    ))

    return result;
    // return result
  } catch (e) {
    console.error(e);
  }
}



export async function getNewFriends() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return alert("로그인 후 가능합니다.")
    }


    const result = await getDoc(api.userByIdRef(user.uid));
    // if (result.exists()) {
    const me = {
      ...result.data(),
      likes: result.data().likes || [],
      liked: result.data().liked || [],
      dislikes: result.data().dislikes || [],
      disliked: result.data().disliked || [],
      userID: user.uid
    };

    // 1. 성 반대인 사람, 처음 가입했던 사람부터
    const q = query(api.usersRef,
      where("gender", "!=", me?.gender),
      orderBy("timestamp", "asc"),
    );

    const querySnapshot = await getDocs(q);
    const people = await Promise.all(querySnapshot?.docs?.map(async (doc) => {

      const man = {
        userID: doc.data().id || "",
        username: doc.data().username || "",
        nickname: doc.data().nickname || "",
        email: doc.data().email || "",
        birthday: doc.data().birthday || "",
        gender: doc.data().gender || "",
        thumbimage: doc.data().thumbimage || "",
        phonenumber: doc.data().phonenumber || "",
        religion: doc.data().religion || "",
        address_sido: doc.data().address_sido || "",
        address_sigugun: doc.data().address_sigugun || "",

        education: doc.data().education || "",
        school: doc.data().school || "",
        school_open: doc.data().school_open || "",
        job: doc.data().job || "",
        company: doc.data().company || "",
        company_open: doc.data().company_open || "",
        jobdocument: doc.data().jobdocument || "",
        duty: doc.data().duty || "",
        salary: doc.data().salary || "",
        company_location_sido: doc.data().company_location_sido || "",
        company_location_sigugun: doc.data().company_location_sigugun || "",

        mbti_ei: doc.data().mbti_ei || "",
        mbti_sn: doc.data().mbti_sn || "",
        mbti_tf: doc.data().mbti_tf || "",
        mbti_jp: doc.data().mbti_jp || "",

        hobby: doc.data().hobby || "",
        drink: doc.data().drink || "",
        health: doc.data().health || "",
        hotplace: doc.data().hotplace || "",
        tour: doc.data().tour || "",
        tourlike: doc.data().tourlike || "",
        tourpurpose: doc.data().tourpurpose || "",
        hobbyshare: doc.data().hobbyshare || "",
        interest: doc.data().interest || "",

        opfriend: doc.data().opfriend || "",
        friendmeeting: doc.data().friendmeeting || "",
        longdistance: doc.data().longdistance || "",
        datecycle: doc.data().datecycle || "",
        dateromance: doc.data().dateromance || "",
        contact: doc.data().contact || "",
        contactcycle: doc.data().contactcycle || "",
        passwordshare: doc.data().passwordshare || "",
        wedding: doc.data().wedding || "",
        wedding_dating: doc.data().wedding_dating || "",
        prefer_age_min: doc.data().prefer_age_min || "",
        prefer_age_max: doc.data().prefer_age_max || "",

        career_goal: doc.data().career_goal || "",
        living_weekend: doc.data().living_weekend || "",
        living_consume: doc.data().living_consume || "",
        living_pet: doc.data().living_pet || "",
        living_tatoo: doc.data().living_tatoo || "",
        living_smoke: doc.data().living_smoke || "",
        living_charming: doc.data().living_charming || "",

        religion_important: doc.data().religion_important || "",
        religion_visit: doc.data().religion_visit || "",
        religion_accept: doc.data().religion_accept || "",
        food_taste: doc.data().food_taste || "",
        food_like: doc.data().food_like || "",
        food_dislike: doc.data().food_dislike || "",
        food_vegetarian: doc.data().food_vegetarian || "",
        food_spicy: doc.data().food_spicy || "",
        food_diet: doc.data().food_diet || "",
        wink: doc.data().wink || "",
        date_sleep: doc.data().date_sleep || false,
        withdraw: doc.data().withdraw || false,
        date_lastIntroduce: doc.data().date_lastIntroduce || "",
        timestamp: doc.data().timestamp || "",

        likes: doc.data().likes || [],
        liked: doc.data().liked || [],
        dislikes: doc.data().dislikes || [],
        disliked: doc.data().disliked || [],

        date_profile_finished: doc.data().date_profile_finished || [],
        date_pending: doc.data().date_pending || [],

        location_distance: Math.abs(parseInt(doc.data().address_sido) - parseInt(me?.address_sido)) || "",
        age_gap: Math.abs(parseInt(doc.data().birthday.year) - parseInt(me?.birthday.year)) || "",
        age_prefer: Math.abs((parseInt(me?.prefer_age_min) + parseInt(me?.prefer_age_max)) / 2 - ((parseInt(nowForCopy.format('YYYY')) - parseInt(doc.data()?.birthday?.year)))) || ""
      }
      return man;
    }))
    // 2. 집 가까운사람
    const arrayresult = people?.sort(function (a, b) { return a?.location_distance - b?.location_distance });
    // 1. date_sleep : false
    // 2. withdraw : false
    // 3. 기존에 감겼던애들 : false
    // 4. location_Distance 낮은 순
    // age_prefer : 0보다 커아햐며 높을수록 좋음
    const newArr = [];
    arrayresult?.map((v) => (
      (!v?.date_sleep || v?.date_sleep == false) &&
        (!v?.withdraw || v?.withdraw == false) &&
        v?.date_pending == false &&
        v?.date_profile_finished == true
        ? newArr?.push(v) : null
    ))
    // like 했던애들 빼기
    const likesMinusArr = [];
    if (me?.likes?.length !== 0) {
      newArr?.map(async (v) => (
        await me?.likes?.map(async (m) => (
          v?.userID !== m?.userId && likesMinusArr?.push(v)
        ))
      ))
    } else {
      newArr?.map(async (v) => (
        likesMinusArr?.push(v)
      ))
    }
    // 중복제거
    const uniqueLikesMinusArrs = [...new Set(likesMinusArr)];
    // like 받은애들 빼기
    const likedMinusArr = [];
    if (me?.liked?.length !== 0) {
      uniqueLikesMinusArrs?.map(async (v) => (
        await me?.liked?.map(async (m) => (
          v?.userID !== m?.userId && likedMinusArr?.push(v)
        ))
      ))
    } else {
      uniqueLikesMinusArrs?.map(async (v) => (
        likedMinusArr?.push(v)
      ))
    }
    // 중복제거
    const uniqueLikedMinusArrs = [...new Set(likedMinusArr)];

    // 지역/나이 가까운곳으로
    const result1 = uniqueLikedMinusArrs?.sort(function async(a, b) { return a?.age_prefer - b?.age_prefer });
    const result2 = result1?.sort(function async(a, b) { return a?.location_distance - b?.location_distance });
    const brandArr = [];
    if (me?.datecard?.length > 0) {
      result2?.map(async (v) => (
        await me?.datecard?.map(async (m) => (
          m?.userID !== v?.userID ?
            brandArr?.push({
              ...v,
              userID: v?.userID,
              targetID: user.uid,
              targetName: user.displayName,
              expired: dayjs(time).add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
              card_timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            })
            : null
        )))
      )
    }
    else {
      result2?.map(async (v) => (
        brandArr?.push({
          ...v,
          userID: v?.userID,
          targetID: user.uid,
          targetName: user.displayName,
          expired: dayjs(time).add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
          card_timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        })
      ))
    }

    // 중복제거
    const uniqueArrs = Array.from(new Set(brandArr?.map(a => a?.userID)))
      ?.map(userID => {
        return brandArr?.find(a => a?.userID === userID)
      })
    const uniqueFromMyDataArrs = [];
    await me?.datecard?.map(async (v) => (
      uniqueArrs?.map(async (m) => (
        v?.userID !== m?.userID && uniqueFromMyDataArrs?.push(m)
      ))
    ))
    uniqueFromMyDataArrs.filter(v => !me?.datecard.includes(v))


    const countArr = []
    await me?.datecard?.map(async (v) => (
      dayjs(v?.expired)?.isAfter(nowForCopy) && countArr?.push(v)
    ))

    me?.datecard?.map(async (v, i) => (
      // uniqueArrs?.filter(async q => await v?.userID !== q?.userID),
      uniqueArrs?.forEach(async (item, index) => {
        if (item?.userID === v?.userID) {
          uniqueArrs?.splice(index, 1)
        }
      })
    )
    )

    // 내 datecard에 넣기
    const uniqueArr = uniqueArrs?.slice(0, (3 - (countArr?.length <= 0 ? 0 : countArr?.length)));
    const reuniqueArr = uniqueArr?.sort(function async(a, b) { return a?.location_distance - b?.location_distance });
    if (me?.datecard?.length === 0 || !me?.datecard) {
      await updateDoc(api.userByIdRef(user.uid), {
        datecard: arrayUnion(...reuniqueArr),
      })
    } else {
      await updateDoc(api.userByIdRef(user.uid), {
        datecard: arrayUnion(...reuniqueArr),
      });
    }

    const finalArr = [];

    const resultMy = await getDoc(api.userByIdRef(user.uid));
    const my = {
      ...resultMy.data(),
      likes: resultMy.data().likes,
      liked: resultMy.data().liked,
      dislikes: resultMy.data().dislikes,
      disliked: resultMy.data().disliked,
      datecard: resultMy.data().datecard,
      userID: user.uid
    };

    await my?.datecard?.map(async (v) => (
      dayjs(v?.expired)?.isAfter(nowForCopy) ?
        finalArr?.push(v)
        : null
    ))

    return finalArr;

  } catch (e) {
    console.error(e);
  }
}

export async function getOldFriends() {
  const user = auth.currentUser;
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {

  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}

// 회원탈퇴
export async function updateDate_lastIntroduce() {
  const user = auth.currentUser;
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );
  try {
    await updateUserDatabase("date_lastIntroduce", time);
    return { date_lastIntroduce: time }
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}


export async function getFriendSleep(friendId) {
  const user = auth.currentUser;
  try {
    const result = await getDoc(api.userByIdRef(friendId));
    if (result.exists()) {
      return { date_sleep: result.data().date_sleep || "" }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function getFriendWithdraw(friendId) {
  const user = auth.currentUser;
  try {
    const result = await getDoc(api.userByIdRef(friendId));
    if (result.exists()) {
      return { withdraw: result.data().withdraw }
    }
  } catch (e) {
    console.error(e);
  }
}

// import axios from 'axios';

// export function send_message(phone) {
//   const accessKey = process.env.NCP_KEY;
//   const date = Date.now().toString();
//   axios({
//     method: "POST",
//     // request는 uri였지만 axios는 url이다
//     url: process.env.SERVICE_ID,
//     headers: {
//       "Contenc-type": "application/json; charset=utf-8",
//       "x-ncp-iam-access-key": accessKey,
//       "x-ncp-apigw-timestamp": date,
//       // "x-ncp-apigw-signature-v2": signature,
//     },
//     // request는 body였지만 axios는 data다
//     data: {
//       type: "SMS",
//       countryCode: "82",
//       from: phone,
//       // 원하는 메세지 내용
//       content: `세환님 가격 예약을 신청해주셔서 감사합니다.`,
//       messages: [
//         // 신청자의 전화번호
//         { to: `${phone}`, },],
//     },
//   }).then(res => {
//     console.log(res.data);
//   })
//     .catch(err => {
//       console.log(err);
//     })
//   return ;
// }

// const request = require('request')
// import CryptoJS from "crypto-js";
// export async function send_message(phone) {
//   try {
//     const user_phone_number = phone;//수신 전화번호 기입
//     let resultCode = 404;
//     const date = Date.now().toString();
//     const uri = process.env.NEXT_PUBLIC_SERVICE_ID; //서비스 ID
//     console.log("어디",)
//     const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;// Secret Key
//     console.log("어디",)
//     const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;//Access Key
//     console.log("어디", accessKey)
//     const method = "POST";
//     console.log("어디",)
//     const space = " ";
//     console.log("어디",)
//     const newLine = "\n";
//     console.log("어디",)
//     const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
//     console.log("어디",)
//     const url2 = `/sms/v2/services/${uri}/messages`;
//     console.log("어디", secretKey)
//     const hmac = CryptoJS.algo.HMAC.create(CryptoJS?.algo.SHA256, secretKey);
//     console.log("어디",)
//     console.log(user_phone_number,
//       date,
//       uri,
//       secretKey,
//       accessKey,
//       method,
//       space,
//       newLine,
//       url,
//       url2,
//       hmac, "fuck")
//     hmac.update(method);
//     hmac.update(space);
//     hmac.update(url2);
//     hmac.update(newLine);
//     hmac.update(date);
//     hmac.update(newLine);
//     hmac.update(accessKey);
//     const hash = hmac?.finalize();
//     const signature = hash?.toString(CryptoJS.enc.Base64);
//     console.log(signature, "시그니쳐")
//     request({
//       method: method,
//       json: true,
//       uri: url,
//       headers: {
//         "Contenc-type": "application/json; charset=utf-8",
//         "x-ncp-iam-access-key": accessKey,
//         "x-ncp-apigw-timestamp": date,
//         "x-ncp-apigw-signature-v2": signature,
//       },
//       body: {
//         type: "SMS",
//         countryCode: "82",
//         from: "01075781252",
//         content: "방갑습네다",
//         messages: [
//           { to: `${user_phone_number}`, },],
//       },
//     },
//       function (err, res, html) {
//         if (err) console.error(err);
//         else { resultCode = 200; }
//       }
//     );
//     return resultCode;
//   } catch (e) {
//     console.error(e);
//   }
// }

export async function finishDate_Profile() {
  const user = auth.currentUser;
  const messageRef = collection(db, "messages");
  if (!user) return (
    alert("로그인 후 가능합니다.")
  );

  try {
    await updateUserDatabase("date_profile_finished", true);
    await updateUserDatabase("date_pending", true);
    await addDoc(messageRef, {
      body: `${user?.displayName}님이 가입했습니다.(ID: ${user?.uid})`,
      to: "+821075781252",
      // or to: "someone@example.com

    })
    return { date_profile_finished: true, date_pending: true }
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}


export async function MessageFunction(number) {
  try {
    const currentUser = auth.currentUser;
    const result = await getDoc(api.userByIdRef(currentUser?.uid));
    const newArr = []
    result.likes?.map((v) => (
      v?.startAt?.add(1, 'minute').diff(dayjs().format('YYYY MM DD HH:mm:ss'), 'minute') == 0
      && newArr.push(v)
    ))
    // const addMessage = httpsCallable(getFunctions(), 'senddatemessage');
    // addMessage(number).then((result) => {
    //   const data = result.data;
    //   const sanitizedMessage = data.text;
    //   console.log(data, sanitizedMessage)
    //   return data;
    // });



    // await addDoc(messageRef, {
    //   body: `${user?.displayName}님이 가입했습니다.(ID: ${user?.uid})`,
    //   to: "+821075781252",
    //   // or to: "someone@example.com
    // })
  } catch (error) {
    console.error(error);
    alert("update에 문제가 있습니다.");
  }
}



///////////////////// 이메일 발송

// for now mail will automatically be configured to my email
export async function sendMailForLike(email, targetname, nickname) {
  const mailRef = collection(db, "mail");
  try {
    await addDoc(mailRef, {
      to: `${[email]}`,
      from: "피그말리온 관리자 - admin@pygm.co.kr",
      // or to: "someone@example.com
      message: {
        subject: `${targetname}님! 피그말리온(PYGMALION)에서 ${nickname}님이 윙크를 보냈습니다!`,
        // text: '메시지를 확인해주세요',
        html: `
        <h3>안녕하세요 피그말리온입니다!</h3>
        <br/>
       ${nickname}님께서 ${targetname}님에게 윙크를 보냈습니다.😘
       <p>피그말리온 소개팅 사이트에서 상대방의 프로필을 확인한 다음 응답하실 수 있습니다.</p>
        <br/><br/>상대방 프로필 보러가기: <a href="https://pygm.co.kr/date/board">여기를</a> 클릭하세요.
        <p><a href="https://pygm.co.kr/date/board">https://pygm.co.kr/date/board</a></p>
        <br/>
        <br/>
        <h4>즐거운 하루 보내세요!^^</h4>
        `
      },
      template: {
        name: 'welcome',
        data: {
          fname: 'Pygmalion',
          msg: '자연스럽고 즐거운 만남! 피그말리온'
        }
      }
    })
  } catch (e) {
    throw new Error('Something went wrong with sending email. Error Message: ', e.message);
  }
}


// for now mail will automatically be configured to my email
export async function sendMailForMatch(email, targetname, nickname) {
  const mailRef = collection(db, "mail");
  try {
    await addDoc(mailRef, {
      to: `${[email]}`,
      from: "피그말리온 관리자 - admin@pygm.co.kr",
      // or to: "someone@example.com
      message: {
        subject: `${targetname}님! 피그말리온(PYGMALION)에서 ${nickname}님이 맞윙크를 보냈습니다!`,
        // text: '메시지를 확인해주세요',
        html: `
        <h3>안녕하세요 피그말리온입니다!</h3>
        <br/>
        <p>축하드립니다!💞</p>
       ${nickname}님께서 ${targetname}님에게 맞윙크를 보냈습니다.😘
       <p>피그말리온 소개팅 사이트에서 상대방의 연락처를 확인할 수 있습니다.</p>
       <p>상대방의 연락처를 확인 후, 먼저 상대방에게 인사말을 건네보세요!</p>
        <br/><br/>상대방 연락처 보러가기: <a href="https://pygm.co.kr/date/board">여기를</a> 클릭하세요.
        <p><a href="https://pygm.co.kr/date/board">https://pygm.co.kr/date/board</a></p>
        <br/>
        <br/>
        <h4>즐거운 하루 보내세요!^^</h4>
        `
      },
      template: {
        name: 'welcome',
        data: {
          fname: 'Pygmalion',
          msg: '자연스럽고 즐거운 만남! 피그말리온'
        }
      }
    })
  } catch (e) {
    throw new Error('Something went wrong with sending email. Error Message: ', e.message);
  }
}
// for now mail will automatically be configured to my email
export async function sendMailForDecline(email, targetname, nickname) {
  const mailRef = collection(db, "mail");
  try {
    await addDoc(mailRef, {
      to: `${[email]}`,
      from: "피그말리온 관리자 - admin@pygm.co.kr",
      // or to: "someone@example.com
      message: {
        subject: `${targetname}님! 피그말리온(PYGMALION)에서 ${nickname}님이 아쉽게도 윙크를 거절하였습니다.`,
        // text: '메시지를 확인해주세요',
        html: `
        <h3>안녕하세요 피그말리온입니다!</h3>
        <br/>
       ${nickname}님께서 ${targetname}님의 윙크를 거절했습니다.
       <p>안타까움을 뒤로하고 윙크를 다시 1개 반납하였습니다.</p>
        <br/><br/>피그말리온 소개팅 바로가기: <a href="https://pygm.co.kr/date/board">여기를</a> 클릭하세요.
        <p><a href="https://pygm.co.kr/date/board">https://pygm.co.kr/date/board</a></p>
        <br/>
        <h4>다음 만남을 기약하겠습니다.</h4>
        <br/>
        <h4>즐거운 하루 보내세요!^^</h4>
        `
      },
      template: {
        name: 'welcome',
        data: {
          fname: 'Pygmalion',
          msg: '자연스럽고 즐거운 만남! 피그말리온'
        }
      }
    })
  } catch (e) {
    throw new Error('Something went wrong with sending email. Error Message: ', e.message);
  }
}


export async function onBuyWink(nickname, email, winks, money) {
  const mailRef = collection(db, "mail");
  try {
    await addDoc(mailRef, {
      to: `${[email]}`,
      from: "피그말리온 관리자 - admin@pygm.co.kr",
      // or to: "someone@example.com
      message: {
        subject: `${nickname}님! 피그말리온(PYGMALION)에서 윙크구매 관련 안내드립니다.`,
        // text: '메시지를 확인해주세요',
        html: `
        <h3>안녕하세요 피그말리온입니다!</h3>
        <br/>
       무통장입금 관련 안내드립니다.
       <p>새로운 인연을 만나기 위해서 저렴하게 윙크를 구매해보세요!</p>
       <br/>
       <br/>
       <b>[상품정보 안내] 👉</b>
       <p>[윙크 ${winks}개 구매 / ${money}원]</p>
       <br/>
       <br/>
       <b>[입금계좌 안내] 👉</b>
       <p>🔖 예금주 : 전세환</p>
       <p>🏦 은행명 : 하나(외환)은행</p>
       <p>💌 계좌번호 :11289113899107</p>
       <br/>
       <br/>
       <p>메일을 수신하신 후, 5시간내에 입금을 완료해주세요!</p>
       <p>영업시간 3시간 내 확인 후, 윙크를 드리고 알림메일을 보내드립니다.</p>
       
        <br/><br/>피그말리온 소개팅 바로가기: <a href="https://pygm.co.kr">여기를</a> 클릭하세요.
        <p><a href="https://pygm.co.kr">https://pygm.co.kr</a></p>
        <br/>
        <h4>가치있고 즐거운 만남을 기약하겠습니다.</h4>
        <h4>즐거운 하루 보내세요!^^</h4>
        `
      },
      template: {
        name: 'welcome',
        data: {
          fname: 'Pygmalion',
          msg: '자연스럽고 즐거운 만남! 피그말리온'
        }
      }
    })
  } catch (e) {
    throw new Error('Something went wrong with sending email. Error Message: ', e.message);
  }
}
