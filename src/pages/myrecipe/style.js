import { styled, createGlobalStyle } from "styled-components";
import { FONT_STYLE } from "../../styles/common";
import { keyframes } from "framer-motion";
import {
  HeaderOuter,
  FooterOuter,
} from "../../components/layoutcomponents/style";

/* ===========================
   모바일(≤768px) 공통 헤더/푸터 숨김 — 마이레시피 전용
   - createGlobalStyle 은 이 페이지가 마운트된 동안만 적용됨
     (다른 페이지로 이동하면 자동 제거 → 다른 페이지 영향 없음)
   - 컴포넌트는 그대로 마운트(CSS만 숨김): Header의 인증 확인,
     하단 네비(MobileBottomNav), 프로필 팝업은 정상 동작
=========================== */
export const MyRecipeMobileLayoutStyle = createGlobalStyle`
  @media (max-width: 768px) {
    ${HeaderOuter}, ${FooterOuter} {
      display: none;
    }
  }
`;

/* ===========================
   Layout (CommunityMain 컨셉과 동일)
=========================== */

export const Page = styled.main`
  width: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.PALLETE.background.white};
`;

export const Container = styled.div`
  max-width: 1420px;
  margin: 0 auto;
  padding: 24px 0 80px;

  
  /* 데스크탑 */
  @media (max-width: 1920px) {
    width: 100%;
    padding: 24px 20px 80px;
  }
  
  /* 모바일 (공통 헤더/하단 네비와 동일한 768px 기준)
     목록 영역은 하단 고정 네비(68px)에 가려지지 않도록 하단 여백 확보 */
  @media (max-width: 768px) {
    padding: ${({ $header }) =>
      $header
        ? "8px 20px 0"
        : "12px 20px calc(68px + env(safe-area-inset-bottom) + 24px)"};
  }
`;

/* 데스크톱 전용 영역: ≤768px 에서 숨김 */
export const DesktopOnly = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

/* 모바일 전용 영역: >768px 에서 숨김 */
export const MobileOnly = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const FullDivider = styled.div`
  width: 100%;
  height: 1px;
  margin: 30px 0 0;
  background-color: ${({ theme }) => theme.PALLETE.gray[100]};

  /* 모바일에서는 툴바 하단 라인이 구분선 역할 */
  @media (max-width: 768px) {
    display: none;
  }
`;

export const LoadingWrapper = styled.div`
  min-height: calc(100vh - 260px);

  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LoadingSpinner = styled.div`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[700]};
`;

/* ===========================
   Empty State
=========================== */

export const EmptyState = styled.div`
  width: 100%;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

export const EmptyTitle = styled.p`
  ${FONT_STYLE.PRETENDARD.H6_REGULAR};
  color: ${({ theme }) => theme.PALLETE.mainblack};
  font-weight: 600;
`;

export const EmptyDesc = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[700]};
`;

//
export const SortRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  padding-top: 36px;
  padding-bottom: 16px;
  margin: 0;

  /* 모바일에선 최신순 | 조리 빠른순 | 난이도 낮은순 사라짐 */
  @media (max-width: 768px) {
    display: none;
  }
`;
