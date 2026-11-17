import { styled, css, createGlobalStyle } from "styled-components";
import { FONT_STYLE } from "../../styles/common";
import {
  HeaderOuter,
  FooterOuter,
  MobileBottomNav as MobileBottomNavBar,
} from "../../components/layoutcomponents/style";
import * as D from "./CommunityPostDetailMobile.style";

/* 모바일(≤768px) 공통 헤더/푸터/하단 네비 숨김 — 게시글 수정 페이지 전용
   - 상세 페이지의 PostDetailLayoutStyle 과 "같은 컴포넌트"를 쓰지 않고 별도로 정의함:
     styled-components 6.3.x 브라우저 빌드는 같은 createGlobalStyle 의 인스턴스가 스타일 그룹을 공유하고,
     먼저 언마운트되는 인스턴스(상세 페이지)가 공유 규칙을 지워서 이동한 페이지(수정)의 숨김이 풀림
   - 규칙 문자열이 달라야 별도 그룹이 되므로 아래 주석을 지우지 말 것 (id 가 규칙 해시로 만들어짐) */
export const EditLayoutStyle = createGlobalStyle`
  /* community-post-edit-mobile: hide common header/footer/bottom-nav */
  @media (max-width: 768px) {
    ${HeaderOuter}, ${FooterOuter}, ${MobileBottomNavBar} {
      display: none !important;
    }
  }
`;

/* 헤더/뒤로가기/상태 화면/레이아웃 숨김 등 공통 요소는 상세 페이지 스타일을 그대로 재사용 */
export const Page = styled(D.Page)`
  /* 하단 고정 입력창이 없으므로 safe-area 만큼만 여백 */
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
`;

/* 헤더 우측 "저장" — 비활성 상태 표시 */
export const SaveButton = styled(D.HeaderAction)`
  &:disabled {
    color: ${({ theme }) => theme.PALLETE.gray[600]};
    cursor: not-allowed;
  }
`;

/* ---------- 사진 ---------- */
export const ThumbSection = styled.section`
  padding: 16px 20px 0;
`;

export const ThumbHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const ThumbTitle = styled.h3`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  margin: 0;
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

export const ThumbCount = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

export const ThumbGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

export const Thumb = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  background: ${({ theme }) => theme.PALLETE.gray[70]};
  outline: ${({ theme, $new }) =>
    $new ? `2px solid ${theme.PALLETE.primary.main}` : "none"};
  outline-offset: -2px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const ThumbRemove = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ThumbAdd = styled.button`
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 10px;
  border: 1px dashed ${({ theme }) => theme.PALLETE.primary.main};
  background: ${({ theme }) => theme.PALLETE.primary.sub};
  color: ${({ theme }) => theme.PALLETE.primary.main};
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

/* ---------- 입력 폼 ---------- */
export const FormSection = styled.section`
  padding: 20px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FieldLabel = styled.span`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  color: ${({ theme }) => theme.PALLETE.mainblack};
`;

const fieldBase = css`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 10px;
  outline: none;
`;

export const TitleInput = styled.input`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR}; /* 16px: iOS 확대 방지 */
  ${fieldBase};
  border: 1px solid ${({ theme }) => theme.PALLETE.gray[300]};
  background: ${({ theme }) => theme.PALLETE.background.white};

  &:focus {
    border-color: ${({ theme }) => theme.PALLETE.primary.main};
  }

  &:disabled {
    background: ${({ theme }) => theme.PALLETE.gray[70]};
  }
`;

export const ContentTextarea = styled.textarea`
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  ${fieldBase};
  min-height: 160px;
  resize: none;
  border: 1px solid ${({ theme }) => theme.PALLETE.gray[300]};
  background: ${({ theme }) => theme.PALLETE.background.white};

  &:focus {
    border-color: ${({ theme }) => theme.PALLETE.primary.main};
  }

  &:disabled {
    background: ${({ theme }) => theme.PALLETE.gray[70]};
  }
`;

export const FieldHint = styled.span`
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  color: ${({ theme }) => theme.PALLETE.gray[800]};
`;

/* ---------- 안내(부분 저장/오류) ---------- */
export const Notice = styled.div`
  margin: 16px 20px 0;
  padding: 12px 14px;
  border-radius: 10px;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  line-height: 1.5;
  color: ${({ theme }) => theme.PALLETE.mainblack};
  background: ${({ theme, $type }) =>
    $type === "error" ? "#fff0f0" : theme.PALLETE.primary.sub};
  border: 1px solid
    ${({ theme, $type }) =>
      $type === "error" ? theme.PALLETE.error : theme.PALLETE.primary.main};
`;

export const NoticeAction = styled.button`
  display: block;
  margin-top: 8px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H8_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.SEMIBOLD};
  color: ${({ theme }) => theme.PALLETE.primary.main};
  text-decoration: underline;
`;

/* ---------- 하단 삭제 ---------- */
export const DeleteSection = styled.section`
  padding: 28px 20px 0;
`;

export const DeleteButton = styled.button`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  cursor: pointer;
  ${FONT_STYLE.PRETENDARD.H7_REGULAR};
  font-weight: ${({ theme }) => theme.FONT_WEIGHT.PRETENDARD.MEDIUM};
  color: ${({ theme }) => theme.PALLETE.error};
  background: ${({ theme }) => theme.PALLETE.background.white};
  border: 1px solid ${({ theme }) => theme.PALLETE.error};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
