import { FONT_STYLE } from "../../styles/common";
import styled, { css, keyframes } from "styled-components";

/** ---------------------------
 * SortTab (오른쪽 정렬 탭)
 * --------------------------- */
export const SortTabWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;

  margin: 0;
`;

export const SortTabButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  ${FONT_STYLE.PRETENDARD.H7_REGULAR};

  color: ${({ theme, $active }) =>
    $active ? theme.PALLETE.mainblack : theme.PALLETE.gray[700]};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};

  transition: color 0.15s ease;
  position: relative;

  /* 구분자 | */
  &::after {
    content: ${({ $isLast }) => ($isLast ? "''" : "'|'")};
    margin-left: 6px; /* ← 핵심 */
    color: ${({ theme }) => theme.PALLETE.gray[300]};
    font-weight: 400;
  }

  &:hover {
    color: ${({ theme }) => theme.PALLETE.mainblack};
  }
`;

/** ---------------------------
 * Grid (4열)
 * --------------------------- */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 30px;
  align-items: start;

  @media (max-width: 1320px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

/** ---------------------------
 * Card (1번 스타일)
 * - 보더/그림자 없음
 * - 썸네일 정사각형
 * --------------------------- */
export const Card = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;

  display: block;
  align-self: start;

  /* 버튼 기본 스타일 제거 */
  appearance: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
    outline-offset: 6px;
    border-radius: 14px;
  }
`;

const pop = keyframes`
  0%   { transform: scale(1); }
  35%  { transform: scale(1.25); }
  65%  { transform: scale(0.92); }
  100% { transform: scale(1); }
`;

// export const ThumbArea = styled.div`
//   position: relative;
//   width: 100%;
//   aspect-ratio: 1 / 1; /* 정사각형 */
//   border-radius: 18px; /* 1번처럼 둥글게 */
//   overflow: hidden;
// `;

// export const ThumbImg = styled.img`
//   width: 100%;
//   height: auto;
//   object-fit: cover;
//   display: block;
//   transform: translateZ(0);
// `;

export const ThumbArea = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #f5f5f5;
`;

export const ThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const BookmarkIcon = styled.img`
  position: absolute;
  top: 12px;
  right: 12px;

  width: 28px;
  height: 28px;

  cursor: pointer;
  z-index: 2;

  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
  transform-origin: center;

  &:hover {
    transform: scale(1.08);
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 0, 0, 0.25);
    outline-offset: 3px;
    border-radius: 6px;
  }

  /*  저장된 상태로 바뀔 때 살짝 튕김 */
  &[data-saved="true"] {
    animation: ${pop} 240ms ease-out;
  }
`;

/** ---------------------------
 * Text / Badges / Chips
 * --------------------------- */
export const Body = styled.div`
  padding-top: 14px;
`;

export const Title = styled.h6`
  ${FONT_STYLE.PRETENDARD.H6_REGULAR};
  color: ${({ theme }) => theme.PALLETE.mainblack};
  margin: 0 0 10px;
  line-height: 1.3;

  /* 너무 길면 ... 처리 (1번처럼) */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Desc = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  color: ${({ theme }) => theme.PALLETE.primary.mainblack};
  margin: 6px 0 14px;
  line-height: 22px;
  height: 44px;

  /* 두 줄에서 ... 처리 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const BadgeRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
`;

export const Badge = styled.span`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  /* font-weight: 600; */
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};

  &.star {
    background: ${({ theme }) => theme.PALLETE.primary.sub};
    color: ${({ theme }) => theme.PALLETE.primary.main};
  }

  &.xp {
    background: #dff7f1;
    color: ${({ theme }) => theme.PALLETE.secondary};
  }

`;

export const BadgeStar = styled.i`
  font-style: normal;
  line-height: 1;
`;

export const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const MetaChip = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: ${({ theme }) => theme.PALLETE.gray[100]};
  color: ${({ theme }) => theme.PALLETE.mainblack};

  padding: 10px 12px;
  border-radius: 999px;
  white-space: nowrap;
`;

export const MissingTooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translate(-50%, 5px);

  width: max-content;
  min-width: 150px;
  max-width: 240px;
  padding: 10px 12px;

  border-radius: 10px;
  background: rgba(32, 32, 32, 0.96);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);

  color: #fff;
  text-align: left;
  white-space: normal;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  transition:
    opacity 0.18s ease,
    transform 0.18s ease;

  z-index: 30;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    border-width: 6px;
    border-style: solid;
    border-color: rgba(32, 32, 32, 0.96) transparent transparent transparent;
  }
`;

export const MissingChipWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;

  & > ${MetaChip} {
    width: 100%;
    box-sizing: border-box;
  }

  &:hover ${MissingTooltip}, &:focus-within ${MissingTooltip} {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
  }
`;

export const TooltipTitle = styled.div`
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 700;
`;

export const TooltipText = styled.div`
  font-size: 12px;
  line-height: 1.5;
  word-break: keep-all;
`;

/** ---------------------------
 * MyRecipeEmpty (빈 화면)
 * --------------------------- */

export const MyRecipeEmptyWrapper = styled.div`
  min-height: calc(100vh - 260px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export const MyRecipeEmptyImage = styled.img`
  width: 400px;
  height: auto;
  /* margin-bottom: 24px; */
  margin-bottom: 18px;
`;

export const MyRecipeEmptyTitle = styled.h2`
  ${FONT_STYLE.PRETENDARD.H5_BOLD};

  color: ${({ theme }) => theme.PALLETE.mainblack};

  /* margin: 0 0 12px; */
  margin: 0 0 6px;
`;
// export const MyRecipeEmptyTitle = styled.h2`
//   ${FONT_STYLE.PRETENDARD.H5_BOLD};

//   color: ${({ theme }) => theme.PALLETE.mainblack};

//   margin: 0 0 8px;
// `;

export const MyRecipeEmptyDesc = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};

  color: ${({ theme }) => theme.PALLETE.gray[700]};

  /* margin: 0 0 28px; */
  margin: 0 0 18px;
`;
// export const MyRecipeEmptyDesc = styled.p`
//   ${FONT_STYLE.PRETENDARD.H7_REGULAR};

//   color: ${({ theme }) => theme.PALLETE.gray[700]};

//   margin: 0 0 28px;
// `;

/** ---------------------------
 * MyRecipeEmpty CTA Button
 * --------------------------- */
export const MyRecipeEmptyButton = styled.button`
  min-width: 160px;
  height: 48px;
  padding: 0 24px;

  border: none;
  border-radius: 8px;

  background: ${({ theme }) => theme.PALLETE.primary.main};
  color: ${({ theme }) => theme.PALLETE.white};

  ${FONT_STYLE.PRETENDARD.H7_REGULAR};

  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.MEDIUM};

  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.88;
  }

  &:active {
    opacity: 1;
  }
`;
// export const MyRecipeEmptyButton = styled.button`
//   min-width: 176px;
//   height: 50px;
//   padding: 0 24px;

//   border: none;
//   border-radius: 8px;

//   background: ${({ theme }) => theme.PALLETE.primary.main};
//   color: ${({ theme }) => theme.PALLETE.white};

//   ${FONT_STYLE.PRETENDARD.H7_REGULAR};

//   font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.MEDIUM};

//   cursor: pointer;

//   transition: opacity 0.2s ease;

//   &:hover {
//     opacity: 0.88;
//   }

//   &:active {
//     opacity: 1;
//   }
// `;

/** ---------------------------------------------------------
 * [모바일 리스트형] variant="list" 전용 스타일 (마이레시피 전용)
 * - 기존 export는 수정하지 않고 아래에 "추가"만 함
 * - 기준: 768px (공통 헤더/하단 네비와 동일)
 * --------------------------------------------------------- */

/* 그리드: ≤768px 에서 1열 리스트 (기존 Grid 확장) */
export const ListGrid = styled(Grid)`
  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
`;

/* 데스크톱용(기존 카드) / 모바일용(리스트 카드) 전환 래퍼 */
export const ListDesktopOnly = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const ListMobileOnly = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const ListCard = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
    outline-offset: 2px;
    border-radius: 12px;
  }
`;

export const ListThumb = styled.div`
  flex: 0 0 104px;
  width: 104px;
  height: 104px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
`;

export const ListThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const ListBody = styled.div`
  flex: 1;
  min-width: 0;
  /* 우측 ⋮ 버튼 영역 확보 */
  padding-right: 28px;
`;

export const ListTitle = styled.h6`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  color: ${({ theme }) => theme.PALLETE.mainblack};
  margin: 2px 0 8px;
  line-height: 1.35;
  word-break: keep-all;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const ListMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-bottom: 8px;
`;

export const ListMetaItem = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  white-space: nowrap;
  color: ${({ theme }) => theme.PALLETE.gray[900]};

  svg,
  img {
    flex: 0 0 auto;
  }

  &.rating {
    color: ${({ theme }) => theme.PALLETE.mainblack};
    font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  }
`;

export const ListTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const ListTag = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.PALLETE.primary.sub};
  color: ${({ theme }) => theme.PALLETE.primary.main};
`;

/* ⋮ 메뉴 */
export const ListMenuWrap = styled.div`
  position: absolute;
  top: 6px;
  right: -6px;
  z-index: 5;
`;

export const ListMenuButton = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
  }
`;

export const ListMenu = styled.div`
  position: absolute;
  top: 38px;
  right: 6px;
  min-width: 112px;
  padding: 6px;
  background: ${({ theme }) => theme.PALLETE.background.white};
  border: 1px solid ${({ theme }) => theme.PALLETE.gray[300]};
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
`;

export const ListMenuItem = styled.button`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  text-align: left;
  white-space: nowrap;
  color: ${({ theme }) => theme.PALLETE.mainblack};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.PALLETE.gray[100]};
  }
`;

/** ---------------------------------------------------------
 * [모바일 툴바] 전체(N) + 둥근 검색바 + 정렬 아이콘
 * --------------------------------------------------------- */
const toolbarShake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
  100% { transform: translateX(0); }
`;

export const MobileToolbar = styled.div`
  width: 100%;
`;

export const MobileTabBar = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.PALLETE.gray[200]};
`;

/* 탭 전환 기능 없는 정적 라벨 (클릭 동작 없음) */
export const MobileTotalLabel = styled.h2`
  ${FONT_STYLE.PRETENDARD.H6_REGULAR};
  display: inline-block;
  margin: 0 0 -1px;
  padding: 10px 4px 12px;
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  color: ${({ theme }) => theme.PALLETE.primary.main};
  border-bottom: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
`;

export const MobileSearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0 8px;
`;

export const MobileSearchForm = styled.form`
  flex: 1;
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 999px;
  background: ${({ theme }) => theme.PALLETE.gray[70]};

  &:focus-within {
    border-color: ${({ theme }) => theme.PALLETE.primary.main};
    background: ${({ theme }) => theme.PALLETE.background.white};
  }

  ${({ $error, theme }) =>
    $error &&
    css`
      animation: ${toolbarShake} 0.35s ease;
      border-color: ${theme.PALLETE.error};
      background: ${theme.PALLETE.background.white};
    `}
`;

export const MobileSearchIcon = styled.img`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
`;

export const MobileSearchInput = styled.input`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR}; /* 16px: iOS 확대 방지 */
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.PALLETE.gray[800]};
  }
`;

export const MobileSortWrap = styled.div`
  position: relative;
  flex: 0 0 auto;
`;

export const MobileSortButton = styled.button`
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
  }
`;

export const MobileSortMenu = styled.div`
  position: absolute;
  top: 48px;
  right: 0;
  z-index: 50;
  min-width: 150px;
  width: max-content;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: ${({ theme }) => theme.PALLETE.background.white};
  border: 1px solid ${({ theme }) => theme.PALLETE.gray[300]};
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
`;

export const MobileSortItem = styled.button`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  color: ${({ theme, $active }) =>
    $active ? theme.PALLETE.primary.main : theme.PALLETE.mainblack};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.PALLETE.gray[100]};
  }
`;
