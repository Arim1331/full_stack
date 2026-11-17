import React from "react";
import * as S from "../../pages/community/style";

/**
 * 커뮤니티 모바일 전용 정렬 탭 (최신순 | 인기순)
 * - 선택: primary.main + 굵은 글씨 / 비선택: 회색
 * - props 는 기존 SortTab 과 동일 (options, value, onChange)
 */
const CommunityMobileSortTab = ({ options = [], value, onChange }) => {
  return (
    <S.MobileSortTabWrap role="group" aria-label="정렬">
      {options.map((opt, idx) => (
        <S.MobileSortTabButton
          key={opt.key}
          type="button"
          $active={opt.key === value}
          $isLast={idx === options.length - 1}
          aria-pressed={opt.key === value}
          onClick={() => onChange?.(opt.key)}
        >
          {opt.label}
        </S.MobileSortTabButton>
      ))}
    </S.MobileSortTabWrap>
  );
};

export default CommunityMobileSortTab;
