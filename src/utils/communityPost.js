// 커뮤니티 게시글 상세(모바일 페이지)용 공통 변환/포맷 유틸
// - CommunityMain.handleOpenAnyPostModal / CommunityPostModal 과 동일한 규칙을 사용

// 날짜: "2026년 11월 17일"
export const formatPostDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 상대 시간: "방금 전", "3분 전", ...
export const formatRelativeTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.floor((new Date() - date) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 30) return `${diffDays}일 전`;
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
};

// 이미지 객체/문자열 배열 → URL 배열 (imageOrder 기준 정렬)
export const extractImageUrls = (rawImages) => {
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .slice()
    .sort((a, b) => (a?.imageOrder ?? 0) - (b?.imageOrder ?? 0))
    .map((img) =>
      typeof img === "string"
        ? img
        : (img?.imageUrl ??
          img?.postImageUrl ??
          img?.url ??
          img?.image ??
          img?.imagePath ??
          img?.postImagePath),
    )
    .filter(Boolean);
};

// GET /posts/:id 응답 → 상세 화면 모델 (CommunityMain.handleOpenAnyPostModal 과 동일한 필드 규칙)
export const normalizePostDetail = (detail, imageUrls = []) => ({
  id: detail?.id,
  images: imageUrls,
  author: {
    id: detail?.member?.id ?? detail?.memberId ?? null,
    nickname: detail?.member?.memberName ?? "익명",
    level:
      detail?.member?.memberLevel ??
      detail?.member?.level ??
      detail?.memberLevel ??
      detail?.level ??
      1,
    xp: detail?.member?.memberXp ?? detail?.memberXp ?? 0,
  },
  likes: detail?.likes ?? 0,
  liked: detail?.liked ?? false,
  createdAt: detail?.createdAt ?? "",
  recipeTitle: detail?.postTitle ?? detail?.recipe?.recipeTitle ?? "",
  content: detail?.postContent ?? "",
  ingredients: detail?.ingredients ?? [],
  postIngredientUsed: detail?.postIngredientUsed ?? [],
  xp: detail?.postXp ?? 0, // 게시글 획득 XP (표시만)
  comments: detail?.comment ?? [],
});

// 본인 게시글 판별: 고유 ID 우선, ID가 없으면 기존(닉네임) 규칙으로 폴백
// - 실제 수정/삭제 권한은 백엔드 인증/권한 검증이 담당 (여기서는 UI 노출용 판별)
export const isMyPost = ({ authorId, authorNickname, myId, myNickname }) => {
  if (authorId != null && myId != null) {
    return String(authorId) === String(myId);
  }

  const me = String(myNickname ?? "").trim();
  return !!me && String(authorNickname ?? "").trim() === me;
};
