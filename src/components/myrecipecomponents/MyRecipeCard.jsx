import React, { useEffect, useRef, useState } from "react";
import * as S from "./style";
import { getRecipeRating } from "../../utils/recipeRating";

/* 모바일 리스트 카드용 인라인 아이콘 (신규 에셋 파일 없이 사용) */
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="#ff4e37" strokeWidth="2.4" />
    <path d="M12 7v5l3 2" stroke="#ff4e37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 20V12M12 20V5M19 20v-5" stroke="#ff4e37" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const KebabIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#111" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

/**
 * variant
 * - "default": 기존 세로형 카드 (추천요리 등 기본 사용처, 변경 없음)
 * - "list": 마이레시피 전용. >768px 기존 카드 그대로 / ≤768px 가로형 리스트 카드
 */
const MyRecipeCard = ({
  item,
  onClick,
  onToggleBookmark,
  variant = "default",
}) => {
  const {
    id,
    title,
    recipe,
    description,
    xp,
    cookTime,
    difficulty,
    level,
    category,
    missingIngredients,
    image,
    imageUrl,
    saved,
  } = item;

  const displayDifficulty = difficulty || level || "쉬움";

  const displayRating = getRecipeRating(displayDifficulty, xp);

  const bookmarkIcon = saved
    ? "/assets/icons/bookmark_on.svg"
    : "/assets/icons/bookmark_off.svg";

  /* 토글할 때마다 애니메이션 강제 재실행용 */
  const [animKey, setAnimKey] = useState(0);

  /* ===============================
     부족한 재료 표시 및 툴팁
     =============================== */
  const missingIngredientList = Array.isArray(missingIngredients)
    ? missingIngredients
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (typeof item?.name === "string") return item.name.trim();
          return "";
        })
        .filter(Boolean)
    : [];

  const missingCount = (() => {
    if (missingIngredientList.length > 0) {
      return missingIngredientList.length;
    }

    if (typeof missingIngredients === "number") {
      return missingIngredients;
    }

    if (typeof missingIngredients === "string") {
      const cleaned = missingIngredients
        .replace(/부족한?\s*재료\s*\|?\s*/g, "")
        .trim();

      const countMatch = cleaned.match(/\d+/);

      if (countMatch) {
        return Number(countMatch[0]);
      }
    }
    return 0;
  })();

  const missingSummary =
    missingCount > 0 ? `부족한 재료 | ${missingCount}개` : "부족한 재료 | 없음";

  const missingTooltip =
    missingIngredientList.length > 0
      ? missingIngredientList.join(" . ")
      : missingCount > 0
        ? "부족한 재료의 상세 정보가 없습니다."
        : "부족한 재료가 없습니다.";

  /* ===============================
     북마크 핸들러
     =============================== */
  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    onToggleBookmark?.(id);
    setAnimKey((k) => k + 1); // 클릭할 때마다 key 바꿔서 애니메이션 재실행
  };

  const handleBookmarkKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onToggleBookmark?.(id);
      setAnimKey((k) => k + 1); // 키보드 토글도 애니메이션 재실행
    }
  };

  const DEFAULT_RECIPE_IMAGE = "/assets/images/default-recipe.png";
  const thumbSrc = image || imageUrl || DEFAULT_RECIPE_IMAGE;

  /* ===============================
     [list 전용] ⋮ 메뉴 (바깥 클릭 / ESC 로 닫기)
     =============================== */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuOpen]);

  // 카드 본문 클릭: 메뉴가 열려 있으면 메뉴만 닫고 상세 이동은 하지 않음
  const handleListCardClick = (e) => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    onClick?.(e);
  };

  const handleListCardKeyDown = (e) => {
    // ⋮ 버튼/메뉴에서 올라온 키 이벤트는 무시 (카드 자신에서 발생한 경우만)
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation(); // 카드 상세 이동 방지
    setMenuOpen((prev) => !prev);
  };

  // 기존 북마크(저장 해제) 핸들러와 동일한 onToggleBookmark 호출
  const handleMenuUnsave = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onToggleBookmark?.(id);
  };

  const desktopCard = (
    <S.Card
      type="button"
      onClick={onClick}
      role="link"
      aria-label={`${title} 상세 보기`}
    >
      <S.ThumbArea>
        <S.ThumbImg
          src={thumbSrc}
          alt={title || "추천 레시피 이미지"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_RECIPE_IMAGE;
          }}
        />

        {/* 아이콘 자체가 버튼 + key로 애니메이션 리셋 */}
        <S.BookmarkIcon
          key={animKey}
          src={bookmarkIcon}
          alt={saved ? "북마크 해제" : "북마크 저장"}
          role="button"
          tabIndex={0}
          aria-pressed={saved}
          data-saved={saved ? "true" : "false"} // style.js에 pop 애니메이션 쓰는 경우 유지
          onClick={handleBookmarkToggle}
          onKeyDown={handleBookmarkKeyDown}
        />
      </S.ThumbArea>

      <S.Body>
        <S.Title title={title}>{title}</S.Title>

        <S.Desc title={recipe || description || ""}>
          {recipe || description || "\u00A0"}
        </S.Desc>

        <S.BadgeRow>
          <S.Badge className="star">
            <img
              src="/assets/icons/star.svg"
              alt=""
              aria-hidden="true"
              width="16"
              height="16"
            />
            {displayRating}
          </S.Badge>

          <S.Badge className="xp">XP {xp ?? 0}</S.Badge>
        </S.BadgeRow>

        <S.MetaRow>
          <S.MetaChip>{`조리시간 | ${cookTime ?? 10}분`}</S.MetaChip>
          {/* <S.MetaChip>{`부족한 재료 | ${missingText}`}</S.MetaChip> */}
          <S.MissingChipWrap aria-label={`부족한 재료: ${missingTooltip}`}>
            <S.MetaChip>{missingSummary}</S.MetaChip>

            <S.MissingTooltip>
              <S.TooltipText>{missingTooltip}</S.TooltipText>
            </S.MissingTooltip>
          </S.MissingChipWrap>
        </S.MetaRow>
      </S.Body>
    </S.Card>
  );

  if (variant !== "list") return desktopCard;

  const cookTimeText = `${cookTime ?? 10}분`;

  return (
    <>
      {/* >768px: 기존 카드 그대로 */}
      <S.ListDesktopOnly>{desktopCard}</S.ListDesktopOnly>

      {/* ≤768px: 가로형 리스트 카드 */}
      <S.ListMobileOnly>
        <S.ListCard
          role="link"
          tabIndex={0}
          aria-label={`${title} 상세 보기`}
          onClick={handleListCardClick}
          onKeyDown={handleListCardKeyDown}
        >
          <S.ListThumb>
            <S.ListThumbImg
              src={thumbSrc}
              alt={title || "저장한 레시피 이미지"}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_RECIPE_IMAGE;
              }}
            />
          </S.ListThumb>

          <S.ListBody>
            <S.ListTitle title={title}>{title}</S.ListTitle>

            <S.ListMeta>
              <S.ListMetaItem className="rating">
                <img
                  src="/assets/icons/star.svg"
                  alt=""
                  aria-hidden="true"
                  width="14"
                  height="14"
                />
                {displayRating}
              </S.ListMetaItem>
              <S.ListMetaItem>
                <ClockIcon />
                {cookTimeText}
              </S.ListMetaItem>
              <S.ListMetaItem>
                <XpIcon />
                XP {xp ?? 0}
              </S.ListMetaItem>
            </S.ListMeta>

            {/* 실제 데이터(category)가 있을 때만 태그 표시 */}
            {category ? (
              <S.ListTagRow>
                <S.ListTag>{category}</S.ListTag>
              </S.ListTagRow>
            ) : null}
          </S.ListBody>

          <S.ListMenuWrap ref={menuRef}>
            <S.ListMenuButton
              type="button"
              aria-label="더보기 메뉴"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={handleMenuToggle}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <KebabIcon />
            </S.ListMenuButton>

            {menuOpen && (
              <S.ListMenu role="menu">
                <S.ListMenuItem
                  type="button"
                  role="menuitem"
                  onClick={handleMenuUnsave}
                >
                  저장 해제
                </S.ListMenuItem>
              </S.ListMenu>
            )}
          </S.ListMenuWrap>
        </S.ListCard>
      </S.ListMobileOnly>
    </>
  );
};

export default MyRecipeCard;
