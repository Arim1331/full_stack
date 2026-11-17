import React, { useEffect, useState } from "react";
import { FloatingWrapper, ScrollButton } from "./style";

// mobileBottomOffset: (선택) 모바일(≤768px)에서만 적용되는 bottom 값. 미지정 시 기존 위치 유지
// mobileShowAfter: (선택) 모바일(≤768px)에서만 적용되는 버튼 표시 스크롤 거리(px). 미지정 시 300
const FloatingActions = ({
  targetId = "community-top",
  mobileBottomOffset,
  mobileShowAfter,
}) => {
  const [visible, setVisible] = useState(false);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      const isMobile =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 768px)").matches;
      const showAfter =
        isMobile && mobileShowAfter !== undefined ? mobileShowAfter : 300;

      setVisible(window.scrollY > showAfter);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileShowAfter]);

  // 버튼 클릭 시 스크롤 이동
  const handleScrollTop = () => {
    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!visible) return null;

  return (
    <FloatingWrapper $mobileBottom={mobileBottomOffset}>
      <ScrollButton onClick={handleScrollTop}>↑</ScrollButton>
    </FloatingWrapper>
  );
};

export default FloatingActions;



