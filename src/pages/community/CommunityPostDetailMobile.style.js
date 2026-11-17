import { styled, createGlobalStyle } from "styled-components";
import { FONT_STYLE } from "../../styles/common";
import {
  HeaderOuter,
  FooterOuter,
  MobileBottomNav as MobileBottomNavBar,
} from "../../components/layoutcomponents/style";

/* ===========================
   모바일(≤768px) 공통 헤더/푸터/하단 네비 숨김 — 게시글 상세 전용
   - createGlobalStyle 은 이 페이지가 마운트된 동안에만 적용됨
   - 컴포넌트는 그대로 마운트(CSS만 숨김): Header의 인증 확인 등 유지
   - MobileBottomNav 는 자체 display 를 지정하므로 !important 로 우선순위 확보
=========================== */
export const PostDetailLayoutStyle = createGlobalStyle`
  @media (max-width: 768px) {
    ${HeaderOuter}, ${FooterOuter}, ${MobileBottomNavBar} {
      display: none !important;
    }
  }
`;

const COMPOSER_HEIGHT = "72px";

export const Page = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.PALLETE.background.white};
  /* 하단 고정 댓글 입력창에 가려지지 않도록 여백 확보
     --composer-h 는 입력창의 실제 높이(ResizeObserver)로 갱신됨 (safe-area 는 입력창 높이에 포함) */
  padding-bottom: calc(var(--composer-h, ${COMPOSER_HEIGHT}) + 24px);
`;

/* ---------- 상단 헤더 ---------- */
export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.PALLETE.background.white};
  border-bottom: 1px solid ${({ theme }) => theme.PALLETE.gray[100]};
`;

export const BackButton = styled.button`
  position: absolute;
  left: 4px;
  top: 4px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.PALLETE.mainblack};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
    border-radius: 50%;
  }
`;

export const HeaderAction = styled.button`
  position: absolute;
  right: 8px;
  top: 4px;
  height: 44px;
  padding: 0 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  color: ${({ theme }) => theme.PALLETE.primary.main};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.PALLETE.primary.main};
    border-radius: 8px;
  }
`;

export const HeaderTitle = styled.h1`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  margin: 0;
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

/* ---------- 사진 (폭 100%, 원본 비율 유지) ---------- */
export const Gallery = styled.div`
  position: relative;
  width: 100%;
  background: ${({ theme }) => theme.PALLETE.gray[70]};
`;

/* 현재 사진의 블러 배경: 원본이 차지하지 않는 위아래 여백을 채움 (상세 페이지 전용)
   - 같은 이미지 URL 을 재사용하므로 추가 요청/업로드 없음
   - blur 가 가장자리에서 번지거나 scale 로 넘치는 부분은 backdrop 의 overflow 로 잘라냄 */
export const GalleryBackdrop = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

export const GalleryBgImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(24px);
  transform: scale(1.25);
  opacity: 0.85;
`;

/* 배경을 원본보다 어둡고 은은하게 */
export const GalleryBgDim = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
`;

export const GalleryTrack = styled.div`
  /* 블러 배경(GalleryBackdrop) 위에 선명한 원본이 보이도록 */
  position: relative;
  z-index: 1;
  display: flex;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const GallerySlide = styled.div`
  flex: 0 0 100%;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* height:auto 로 원본 비율 유지. 세로로 매우 긴 이미지는 75vh 까지만 보이도록 하고
   object-fit: contain 으로 잘림/왜곡 없이 표시 */
export const GalleryImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-height: 75vh;
  object-fit: contain;
`;

export const GalleryIndex = styled.span`
  position: absolute;
  z-index: 2;
  right: 12px;
  bottom: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
`;

export const GalleryPlaceholder = styled.div`
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

/* ---------- 본문 영역 ---------- */
export const Section = styled.section`
  padding: 16px 20px;
`;

export const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const AuthorLeft = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const AuthorTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const Nickname = styled.span`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  color: ${({ theme }) => theme.PALLETE.mainblack};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LevelChip = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 6px;
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  background: ${({ theme }) => theme.PALLETE.primary.sub};
  color: ${({ theme }) => theme.PALLETE.primary.main};

  img {
    width: 12px;
    height: 12px;
    display: block;
  }
`;

export const DateText = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[700]};
`;

export const LikeButton = styled.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  color: ${({ theme }) => theme.PALLETE.mainblack};

  img {
    width: 22px;
    height: 20px;
    display: block;
  }
`;

export const Title = styled.h2`
  ${FONT_STYLE.PRETENDARD.H6_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  margin: 18px 0 10px;
  color: ${({ theme }) => theme.PALLETE.mainblack};
  word-break: break-word;
`;

export const Desc = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  margin: 0;
  color: ${({ theme }) => theme.PALLETE.mainblack};
  white-space: pre-wrap;
  word-break: break-word;

  ${({ $expanded }) =>
    !$expanded &&
    `
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`;

export const MoreButton = styled.button`
  margin-top: 6px;
  padding: 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.primary.main};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
`;

export const SectionTitle = styled.h3`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  margin: 24px 0 10px;
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

export const Chip = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.PALLETE.gray[70]};
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

export const XpBox = styled.div`
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  background: ${({ theme }) => theme.PALLETE.primary.sub};
  color: ${({ theme }) => theme.PALLETE.mainblack};

  b {
    color: ${({ theme }) => theme.PALLETE.primary.main};
    font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  }
`;

export const BlockDivider = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.PALLETE.gray[70]};
`;

/* ---------- 댓글 ---------- */
export const CommentHeader = styled.h3`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  margin: 0 0 4px;
  color: ${({ theme }) => theme.PALLETE.mainblack};

  b {
    color: ${({ theme }) => theme.PALLETE.primary.main};
    font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.BOLD};
  }
`;

/* 댓글 헤더 줄: 댓글 수 + (내 글 주인 전용) 관리/선택 삭제 */
export const CommentHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
`;

export const ManageButton = styled.button`
  min-height: 36px;
  padding: 0 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

export const SelectBar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const SelectCheck = styled.input`
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin: 0 2px 0 0;
  accent-color: ${({ theme }) => theme.PALLETE.primary.main};
  cursor: pointer;
`;

export const EmptyComment = styled.p`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  margin: 0;
  padding: 28px 0;
  text-align: center;
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

export const CommentItem = styled.div`
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.PALLETE.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

export const CommentTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const CommentNickname = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  color: ${({ theme }) => theme.PALLETE.mainblack};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CommentTime = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[700]};
  white-space: nowrap;
`;

export const MineTag = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  padding: 1px 6px;
  border-radius: 4px;
  background: ${({ theme }) => theme.PALLETE.primary.sub};
  color: ${({ theme }) => theme.PALLETE.primary.main};
`;

export const CommentText = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  margin: 6px 0 0;
  color: ${({ theme }) => theme.PALLETE.mainblack};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const CommentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
`;

export const CommentActionButton = styled.button`
  min-height: 32px;
  padding: 0 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme, $danger, $primary }) =>
    $danger
      ? theme.PALLETE.error
      : $primary
        ? theme.PALLETE.primary.main
        : theme.PALLETE.gray[800]};

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const EditTextarea = styled.textarea`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR}; /* 16px: iOS 확대 방지 */
  width: 100%;
  min-height: 72px;
  margin-top: 6px;
  padding: 10px 12px;
  box-sizing: border-box;
  resize: none;
  border: 1px solid ${({ theme }) => theme.PALLETE.primary.main};
  border-radius: 10px;
  outline: none;
  background: ${({ theme }) => theme.PALLETE.background.white};
`;

/* ---------- 하단 고정 댓글 입력창 ---------- */
export const Composer = styled.form`
  position: fixed;
  left: 0;
  right: 0;
  /* iOS 키보드 대응: visualViewport 기반으로 JS가 --kb-offset 을 갱신 */
  bottom: var(--kb-offset, 0px);
  z-index: 30;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  box-sizing: border-box;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: ${({ theme }) => theme.PALLETE.background.white};
  border-top: 1px solid ${({ theme }) => theme.PALLETE.gray[100]};
`;

export const ComposerInput = styled.textarea`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR}; /* 16px: iOS 확대 방지 */
  flex: 1;
  min-width: 0;
  min-height: 44px;
  max-height: 104px;
  padding: 10px 16px;
  box-sizing: border-box;
  resize: none;
  border: 1px solid transparent;
  border-radius: 22px;
  outline: none;
  background: ${({ theme }) => theme.PALLETE.gray[70]};

  &:focus {
    border-color: ${({ theme }) => theme.PALLETE.primary.main};
    background: ${({ theme }) => theme.PALLETE.background.white};
  }

  &::placeholder {
    color: ${({ theme }) => theme.PALLETE.gray[800]};
  }
`;

export const SendButton = styled.button`
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${({ theme }) => theme.PALLETE.primary.main};

  &:disabled {
    background: ${({ theme }) => theme.PALLETE.gray[300]};
    cursor: not-allowed;
  }
`;

/* ---------- 상태 화면 (로딩/오류) ---------- */
export const StateBox = styled.div`
  min-height: calc(100vh - 52px);
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
`;

export const StateTitle = styled.p`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  margin: 0;
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

export const StateDesc = styled.p`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  margin: 0;
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

export const StateActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

export const StateButton = styled.button`
  min-width: 96px;
  height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.MEDIUM};
  border: 1px solid
    ${({ theme, $primary }) =>
      $primary ? theme.PALLETE.primary.main : theme.PALLETE.gray[300]};
  background: ${({ theme, $primary }) =>
    $primary ? theme.PALLETE.primary.main : theme.PALLETE.background.white};
  color: ${({ theme, $primary }) =>
    $primary ? theme.PALLETE.white : theme.PALLETE.mainblack};
`;
