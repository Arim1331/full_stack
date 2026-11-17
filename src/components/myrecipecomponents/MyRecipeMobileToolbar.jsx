import React, { useEffect, useRef, useState } from "react";
import * as S from "./style";

/**
 * 마이레시피 모바일 전용 툴바 (≤768px에서만 페이지가 노출)
 * - 전체(N): 탭 전환 기능 없는 정적 라벨. N = 저장된 전체 개수
 * - 검색: 부모의 keyword 상태에 직접 연결 (기존 실시간 필터링과 동일)
 * - 정렬: 기존 MYRECIPE_SORT_OPTIONS / sortKey 재사용
 */
const SortIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7.5 20V4M7.5 4L3.5 8M7.5 4l4 4"
      stroke="#111"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 4v16M16.5 20l-4-4M16.5 20l4-4"
      stroke="#111"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MyRecipeMobileToolbar = ({
  totalCount,
  showTotal = true,
  keyword,
  onKeywordChange,
  placeholder = "요리명, 재료 검색...",
  sortOptions = [],
  sortKey,
  onSortChange,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const sortRef = useRef(null);
  const inputRef = useRef(null);

  // 바깥 클릭 / ESC 로 정렬 메뉴 닫기
  useEffect(() => {
    if (!isSortOpen) return undefined;

    const handleOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsSortOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isSortOpen]);

  // 기존 CommunityHeader와 동일: 빈 검색어면 shake, 아니면 키보드 닫기(검색은 실시간 반영됨)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      setIsError(true);
      setTimeout(() => setIsError(false), 400);
      return;
    }

    inputRef.current?.blur();
  };

  const handleSelectSort = (opt) => {
    setIsSortOpen(false);
    onSortChange?.(opt.key);
  };

  return (
    <S.MobileToolbar>
      {showTotal && (
        <S.MobileTabBar>
          <S.MobileTotalLabel>전체({totalCount})</S.MobileTotalLabel>
        </S.MobileTabBar>
      )}

      <S.MobileSearchRow>
        <S.MobileSearchForm onSubmit={handleSubmit} $error={isError}>
          <S.MobileSearchIcon src="/assets/icons/Search.svg" alt="" aria-hidden />
          <S.MobileSearchInput
            ref={inputRef}
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
            placeholder={placeholder}
            aria-label="저장한 레시피 검색"
          />
        </S.MobileSearchForm>

        <S.MobileSortWrap ref={sortRef}>
          <S.MobileSortButton
            type="button"
            aria-label="정렬"
            aria-haspopup="menu"
            aria-expanded={isSortOpen}
            onClick={() => setIsSortOpen((prev) => !prev)}
          >
            <SortIcon />
          </S.MobileSortButton>

          {isSortOpen && (
            <S.MobileSortMenu role="menu">
              {sortOptions.map((opt) => (
                <S.MobileSortItem
                  key={opt.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={opt.key === sortKey}
                  $active={opt.key === sortKey}
                  onClick={() => handleSelectSort(opt)}
                >
                  {opt.label}
                </S.MobileSortItem>
              ))}
            </S.MobileSortMenu>
          )}
        </S.MobileSortWrap>
      </S.MobileSearchRow>
    </S.MobileToolbar>
  );
};

export default MyRecipeMobileToolbar;
