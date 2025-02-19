// ESM
import { faker } from "@faker-js/faker/locale/ko";
import { data } from 'autoprefixer';

export function createRandomUser() {
  return {
    id: faker.string.uuid(),
    uid: faker.string.uuid(),
    username: faker.person.fullName(), // before version 9.1.0, use userName()
    nickname: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    birthday: {
      year: faker.number.int({ min: 1981, max: 2010 }),
      month: faker.number.int({ min: 1, max: 12 }),
      day: faker.number.int({ min: 1, max: 31 })
    },
    gender: faker.helpers.arrayElement(["male", "female"]),
    thumbimage: faker.helpers.uniqueArray(faker.image.urlLoremFlickr, 5),
    phonenumber: '010'.concat(faker.string.numeric(8)),
    religion: faker.number.int({ min: 1, max: 13 })?.toString(),
    address_sido: faker.helpers.arrayElement(['11', '26', '27', '28', '29', '30', '31', '36', '41', '42', '43', '44', '45', '46', '47', '48', '50',]),
    address_sigugun: faker.helpers.arrayElement(['230', '260', '290', '305', '320', '350', '380', '410', '440', '470', '500', '530', '545', '560', '590', '620', '650', '680', '710', '740',]),

    education: faker.number.int({ min: 1, max: 12 })?.toString(),
    school: faker.word.noun({ length: { min: 5, max: 7 }, strategy: "fail" }),
    school_open: faker.datatype.boolean(),
    job: faker.number.int({ min: 1, max: 12 })?.toString(),
    company: faker.company.name(),
    company_open: faker.datatype.boolean(),
    date_sleep: faker.datatype.boolean(),
    withdraw: faker.datatype.boolean(),
    jobdocument: faker.image.urlLoremFlickr(),
    duty: faker.lorem.sentences(2, '\n'),
    // duty: faker.string.alpha({ length: { min: 5, max: 100 } }),  // 글자수 암거나
    // duty: faker.person.jobTitle(),
    salary: faker.number.int({ min: 1, max: 14 })?.toString(),
    company_location_sido: faker.helpers.arrayElement(['11', '26', '27', '28', '29', '30', '31', '36', '41', '42', '43', '44', '45', '46', '47', '48', '50',]),
    company_location_sigugun: faker.helpers.arrayElement(['230', '260', '290', '305', '320', '350', '380', '410', '440', '470', '500', '530', '545', '560', '590', '620', '650', '680', '710', '740',]),

    mbti_ei: faker.helpers.arrayElement(["E", "I"]),
    mbti_sn: faker.helpers.arrayElement(["S", "N"]),
    mbti_tf: faker.helpers.arrayElement(["T", "F"]),
    mbti_jp: faker.helpers.arrayElement(["J", "P"]),

    hobby: faker.lorem.sentences(2, '\n'),
    drink: faker.number.int({ min: 1, max: 7 })?.toString(),
    health: faker.number.int({ min: 1, max: 6 })?.toString(),
    hotplace: faker.number.int({ min: 1, max: 3 })?.toString(),
    tour: faker.number.int({ min: 1, max: 6 })?.toString(),
    tourlike: faker.number.int({ min: 1, max: 4 })?.toString(),
    tourpurpose: faker.number.int({ min: 1, max: 6 })?.toString(),
    hobbyshare: faker.number.int({ min: 1, max: 2 })?.toString(),
    interest: faker.string.alpha({ length: { min: 2, max: 30 } }),  // 글자수 암거나

    opfriend: faker.number.int({ min: 1, max: 4 })?.toString(),
    friendmeeting: faker.number.int({ min: 1, max: 6 })?.toString(),
    longdistance: faker.number.int({ min: 1, max: 4 })?.toString(),
    datecycle: faker.number.int({ min: 1, max: 6 })?.toString(),
    dateromance: faker.number.int({ min: 1, max: 4 })?.toString(),
    contact: faker.number.int({ min: 1, max: 2 })?.toString(),
    contactcycle: faker.number.int({ min: 1, max: 5 })?.toString(),
    passwordshare: faker.number.int({ min: 1, max: 2 })?.toString(),
    wedding: faker.number.int({ min: 1, max: 4 })?.toString(),
    wedding_dating: faker.number.int({ min: 1, max: 6 })?.toString(),
    prefer_age_min: faker.number.int({ min: 20, max: 48 }),
    prefer_age_max: faker.number.int({ min: 21, max: 49 }),

    career_goal: faker.number.int({ min: 1, max: 8 })?.toString(),
    living_weekend: faker.number.int({ min: 1, max: 9 })?.toString(),
    living_consume: faker.number.int({ min: 1, max: 5 })?.toString(),
    living_pet: faker.number.int({ min: 1, max: 5 })?.toString(),
    living_tatoo: faker.number.int({ min: 1, max: 5 })?.toString(),
    living_smoke: faker.number.int({ min: 1, max: 6 })?.toString(),
    living_charming: faker.number.int({ min: 1, max: 23 })?.toString(),

    religion_important: faker.number.int({ min: 1, max: 4 })?.toString(),
    religion_visit: faker.number.int({ min: 1, max: 6 })?.toString(),
    religion_accept: faker.number.int({ min: 1, max: 7 })?.toString(),
    food_taste: faker.number.int({ min: 1, max: 4 })?.toString(),
    food_like: faker.number.int({ min: 1, max: 14 })?.toString(),
    food_dislike: faker.number.int({ min: 1, max: 14 })?.toString(),
    food_vegetarian: faker.number.int({ min: 1, max: 4 })?.toString(),
    food_spicy: faker.number.int({ min: 1, max: 5 })?.toString(),
    food_diet: faker.number.int({ min: 1, max: 5 })?.toString(),

    likes: [],
    liked: [],
    dislikes: [],
    disliked: [],
    wink: 3,
    date_sleep: false,
    withdraw: false,
    timestamp: "2025-02-01 10:29:51",
    date_profile_finished: true,
    date_pending: false,
    // registeredAt: faker.date.past(),
    // registeredAt: faker.number.int(4), // 4를 넘기지 않는 숫자
    // wrong: faker.datatype.boolean(), // true
    // content: faker.lorem.paragraph(), // 더미데이터 로엠 이미지 만들기
    // Images: [{ src: faker.image.urlLoremFlickr() }],
    // Comments: [
    //   {
    //     User: {
    // id: faker.string.uuid(),
    //       nickname: faker.person.fullName(), // 더미데이터 이름
    //     },
    //     content: faker.lorem.sentence(), // 더미데이터 컨텐츠 내용
    //   },
    // ],
  };
}

const fake_friends = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

export default fake_friends;