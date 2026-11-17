import React, { useRef, useState } from "react";
import * as S from "../../pages/community/style";

/**
 * 커뮤니티 모바일 전용 검색창 (≤768px에서만 페이지가 렌더)
 * - 부모의 keyword 상태에 직접 연결 (기존 CommunityHeader와 동일하게 실시간 필터링)
 * - 빈 검색어 제출 시 shake, 그 외에는 키보드 닫기 + 맨 위로 스크롤
 */
const CommunityMobileSearch = ({
  keyword = "",
  onKeywordChange,
  onSearch,
  placeholder = "요리, 재료, 닉네임을 검색해보세요",
}) => {
  const [isError, setIsError] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const searchKeyword = keyword.trim();

    if (!searchKeyword) {
      setIsError(true);
      setTimeout(() => setIsError(false), 400);
      return;
    }

    onSearch?.({ keyword: searchKeyword });
    inputRef.current?.blur();
  };

  return (
    <S.MobileSearchForm onSubmit={handleSubmit} $error={isError}>
      <S.MobileSearchIcon src="/assets/icons/Search.svg" alt="" aria-hidden />
      <S.MobileSearchInput
        ref={inputRef}
        type="search"
        value={keyword}
        onChange={(e) => onKeywordChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label="커뮤니티 게시글 검색"
      />
    </S.MobileSearchForm>
  );
};

export default CommunityMobileSearch;
