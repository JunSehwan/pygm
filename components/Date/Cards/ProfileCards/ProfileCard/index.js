import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { FaHome, FaBuilding, FaBriefcase } from "react-icons/fa";
import { GiNightSleep } from "react-icons/gi";
import hangjungdong from "components/Common/Address";
import { getNewFriends, getFriendSleep, getFriendWithdraw } from "firebaseConfig";
import {
  setFriendSleep,
  setFriendWithdraw,
  friendSleepLoadingEnd,
  userLoadingEnd,
} from "slices/user";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.tz.setDefault("Asia/Seoul");

// ---------- 스타일 ----------
const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  height: 440px;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }
`;

const ImageWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #f1f5f9;
`;

const InfoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1.4rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 10%, rgba(0, 0, 0, 0) 90%);
  color: white;
  backdrop-filter: blur(4px);
`;

const Nickname = styled.h3`
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
`;

const Meta = styled.p`
  font-size: 1rem;
  margin-bottom: 0.4rem;
  color: #e2e8f0;
`;

const TagGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  backdrop-filter: blur(3px);
  svg {
    font-size: 0.9rem;
  }
`;

const Badge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-weight: 700;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
`;

const Status = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
`;

// ---------- 유틸 ----------
const parseDate = (v) => {
  if (!v) return null;
  if (v.seconds) return dayjs(new Date(v.seconds * 1000)); // Timestamp
  if (typeof v === "string") return dayjs(v.replace(" ", "T")); // "YYYY-MM-DD HH:mm:ss"
  return dayjs(v);
};

// ---------- 컴포넌트 ----------
const ProfileCard = ({ friend }) => {
  const { user, allFriends } = useSelector((s) => s.user);
  const { sido } = hangjungdong;
  const router = useRouter();
  const dispatch = useDispatch();

  const [refreshedFriend, setRefreshedFriend] = useState(friend);
  const [gap, setGap] = useState(0);
  const [sleeping, setSleeping] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [isExpired, setIsExpired] = useState(false); // ✅ 만료상태

  useEffect(() => {
    if ((user?.datecard || []).filter(c => /* isActive */ true).length === 0) {
      getNewFriends();
    }
  }, [user?.datecard]);


  // 🔄 상태동기화
  useEffect(() => {
    (async () => {
      const sleep = await getFriendSleep(friend?.userID);
      if (sleep) dispatch(setFriendSleep({ ...sleep, id: friend?.userID }));
      const withdraw = await getFriendWithdraw(friend?.userID);
      if (withdraw) dispatch(setFriendWithdraw({ ...withdraw, id: friend?.userID }));
      dispatch(friendSleepLoadingEnd());
      dispatch(userLoadingEnd());
    })();
  }, [dispatch, friend?.userID]);

  // 🔄 친구 데이터 최신화
  useEffect(() => {
    const target = allFriends?.find((v) => v?.userID === friend?.userID);
    if (target) setRefreshedFriend(target);
  }, [allFriends, friend?.userID]);

  // 🔄 상태동기화
  useEffect(() => {
    setSleeping(refreshedFriend?.date_sleep);
    setWithdrawing(refreshedFriend?.withdraw);
  }, [refreshedFriend]);

  // 문자열/타임스탬프 무엇이 오든 KST로 안전 파싱
  const toKST = (v) => {
    if (!v) return null;
    if (v?.seconds) return dayjs.tz(new Date(v.seconds * 1000), "Asia/Seoul"); // Firestore Timestamp
    if (typeof v === "string") return dayjs.tz(v.replace(" ", "T"), "Asia/Seoul"); // "YYYY-MM-DD HH:mm:ss"
    return dayjs.tz(v, "Asia/Seoul");
  };

  // ✅ D-day 계산 + 만료 여부 (교체)
  useEffect(() => {
    const calc = () => {
      const now = dayjs.tz(); // KST now
      // expired가 있으면 우선 사용, 없으면 card_timestamp + 7일
      const expiredAtRaw = friend?.expired ? toKST(friend.expired) : toKST(friend?.card_timestamp)?.add(7, "day");
      if (!expiredAtRaw || !expiredAtRaw.isValid()) {
        setGap(0);
        setIsExpired(false);
        return;
      }

      // “그 날의 끝”까지 유효하도록 고정
      const expiredAt = expiredAtRaw.endOf("day");

      // 남은 일수: endOf('day') 기준, 음수 방지
      const remainDays = Math.max(0, expiredAt.diff(now, "day"));
      setGap(remainDays);

      // 만료 여부: 오늘 포함 만료 → 숨김
      // now가 만료일의 끝 이상이면 만료(true)
      setIsExpired(now.isSameOrAfter(expiredAt));
    };

    calc();
    const t = setInterval(calc, 1000 * 60 * 5); // 5분마다 갱신 (30분은 너무 길어 공백 체감됨)
    return () => clearInterval(t);
  }, [friend?.expired, friend?.card_timestamp]);

  const goDetail = useCallback(() => {
    if (user) router.push(`/date/cards/${friend?.userID}`);
    else router.push("/");
  }, [friend?.userID, router, user]);

  // ✅ 오늘 포함 만료된 카드 숨김
  if (isExpired) return null;

  // ✅ 휴면회원
  if (sleeping)
    return (
      <Card>
        <ImageWrap>
          <Status>
            <GiNightSleep size={34} />
            휴면 중인 회원입니다.
          </Status>
        </ImageWrap>
      </Card>
    );

  // ✅ 탈퇴회원
  if (withdrawing)
    return (
      <Card>
        <ImageWrap>
          <Status>탈퇴한 회원입니다.</Status>
        </ImageWrap>
      </Card>
    );

  // ✅ 정상회원 카드
  return (
    <Card onClick={goDetail}>
      <ImageWrap>
        <Image
          src={friend?.thumbimage?.[0] || "/image/image_error.png"}
          alt={friend?.nickname || "profile"}
          width={400}
          height={500}
          className="object-cover w-full h-full"
          unoptimized
        />
        <Badge>{gap > 0 ? `D-${gap}일` : "오늘 만료"}</Badge>
        <InfoOverlay>
          <Nickname>{friend?.nickname}</Nickname>
          <Meta>
            {friend?.birthday?.year}년생 ·{" "}
            {friend?.mbti_ei}
            {friend?.mbti_sn}
            {friend?.mbti_tf}
            {friend?.mbti_jp}
          </Meta>
          <TagGroup>
            <Tag>
              <FaHome />
              {sido.find((s) => s.sido === friend?.address_sido)?.codeNm || "거주지"}
            </Tag>
            <Tag>
              <FaBuilding />
              {sido.find((s) => s.sido === friend?.company_location_sido)?.codeNm ||
                "근무지"}
            </Tag>
            <Tag>
              <FaBriefcase />
              {(() => {
                switch (friend?.job) {
                  case "1":
                    return "대기업";
                  case "2":
                    return "중견기업";
                  case "3":
                    return "공기업";
                  case "4":
                    return "공무원";
                  case "5":
                    return "공공기관";
                  case "6":
                    return "외국계";
                  case "7":
                    return "전문직";
                  case "8":
                    return "금융권";
                  case "9":
                    return "교육계";
                  case "10":
                    return "프리랜서";
                  case "11":
                    return "사업가";
                  case "12":
                    return "기타";
                  default:
                    return "직업 정보 없음";
                }
              })()}
            </Tag>
          </TagGroup>
        </InfoOverlay>
      </ImageWrap>
    </Card>
  );
};

ProfileCard.propTypes = {
  friend: PropTypes.object,
};

export default ProfileCard;
