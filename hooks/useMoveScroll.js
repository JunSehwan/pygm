import { useRef } from 'react';

export function useMoveScroll1() {
  const element1 = useRef(null);
  const onMoveToElement1 = () => {
    element1.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return { element1, onMoveToElement1 };
}

//hook
export function useMoveScroll2() {
  const element2 = useRef(null);
  const onMoveToElement2 = () => {
    element2.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  return { element2, onMoveToElement2 };
}

//hook
export function useMoveScroll3() {
  const element3 = useRef(null);
  const onMoveToElement3 = () => {
    element3.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  return { element3, onMoveToElement3 };
}
//hook
export function useMoveScroll4() {
  const element4 = useRef(null);
  const onMoveToElement4 = () => {
    element4.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  return { element4, onMoveToElement4 };
}
//hook
export function useMoveScroll5() {
  const element5 = useRef(null);
  const onMoveToElement5 = () => {
    element5.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  return { element5, onMoveToElement5 };
}
//hook
export function useMoveScroll6() {
  const element6 = useRef(null);
  const onMoveToElement6 = () => {
    element6.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  return { element6, onMoveToElement6 };
}