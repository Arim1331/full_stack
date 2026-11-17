// ✅ items에서 받은 nickname/level을 Post로 변환해서 onCardClick(post)로 넘김
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import * as S from "../../pages/community/style";
import PostCard from "./PostCard";
import useMediaQuery from "../../hooks/useMediaQuery";

const PAGE_SIZE = 12;

const FeedGrid = ({
  items = [],
  isSearching = false,
  searchKeyword = "",
  onCardClick,
  meNickname,
  onLikeToggle,
  onEmptyAction,
  mobileList = false, // (선택) true면 모바일(≤768px)에서 가로형 리스트 카드로 표시
  // ----- (선택) 목록 복원 모드: 미전달 시 아래 복원 로직은 전혀 동작하지 않음 -----
  restoreVisibleCount, // 복원할 노출 개수 (마운트 시점 값만 사용)
  restoreDataReady = false, // 게시글 로딩이 끝났는지 (끝나기 전에는 복원 완료 처리하지 않음)
  onRestored, // 복원된 개수가 실제로 렌더된 뒤 호출
  visibleCountRef, // 현재 노출 개수를 부모가 저장할 수 있도록 노출하는 ref
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const useMobileList = mobileList && isMobile;
  const ListWrap = useMobileList ? S.MobileFeedList : S.FeedGridWrap;
  const showSearchEmpty = isSearching && items.length === 0;
  const showCommunityEmpty = !isSearching && items.length === 0;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef(null);

  const hasMore = visibleCount < items.length;

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  // ===== 목록 복원 (restoreVisibleCount 가 전달된 경우에만) =====
  const restoreModeRef = useRef(restoreVisibleCount != null);
  const restoreTargetRef = useRef(restoreVisibleCount ?? null); // 복원 대기값
  const awaitRenderRef = useRef(null); // 적용했지만 아직 렌더 확인 전인 개수
  const [restoreTick, setRestoreTick] = useState(0);
  const prevKeywordRef = useRef(searchKeyword);

  // 복원 모드에서는 이미지/좋아요 갱신처럼 id 가 안 바뀌는 items 재생성에 리셋되지 않도록 id 시그니처로 비교
  const idSignature = useMemo(() => items.map((it) => it?.id).join(","), [items]);
  const resetKey = restoreModeRef.current ? idSignature : items;

  useEffect(() => {
    // 복원 대기 중에는 리셋하지 않음 (복원 effect 가 개수를 정함)
    if (restoreTargetRef.current != null) return;

    setVisibleCount(PAGE_SIZE);
    setIsLoading(false);
  }, [resetKey]);

  // 검색어가 바뀌면 복원 대기값 폐기
  useEffect(() => {
    if (prevKeywordRef.current !== searchKeyword) {
      prevKeywordRef.current = searchKeyword;
      restoreTargetRef.current = null;
    }
  }, [searchKeyword]);

  // 데이터 로딩이 끝난 뒤에만 복원 개수 적용 (일부만 로딩된 상태에서 완료 처리 금지)
  useEffect(() => {
    if (restoreTargetRef.current == null) return;
    if (!restoreDataReady) return;

    const target = Math.max(restoreTargetRef.current, PAGE_SIZE);
    restoreTargetRef.current = null;

    if (items.length === 0) {
      onRestored?.();
      return;
    }

    const next = Math.min(target, items.length);
    awaitRenderRef.current = next;
    setVisibleCount(next);
    setIsLoading(false);
    setRestoreTick((t) => t + 1);
  }, [restoreDataReady, idSignature, items.length, onRestored]);

  // 복원한 개수가 실제로 렌더된 커밋 이후에 완료 알림
  useEffect(() => {
    if (awaitRenderRef.current == null) return;
    if (visibleItems.length !== awaitRenderRef.current) return;

    awaitRenderRef.current = null;
    onRestored?.();
  }, [restoreTick, visibleItems.length, onRestored]);

  // 부모가 카드 클릭 시점에 현재 노출 개수를 저장할 수 있도록 공유
  useEffect(() => {
    if (visibleCountRef) visibleCountRef.current = visibleCount;
  }, [visibleCount, visibleCountRef]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    if (!hasMore) return;

    restoreTargetRef.current = null; // 사용자가 직접 더 불러오면 복원 대기값 폐기
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
      setIsLoading(false);
    }, 350);
  }, [isLoading, hasMore, items.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // const buildMockPost = useCallback(
  //   (item) => ({
  //     id: item.id,
  //     images: [
  //       `${process.env.PUBLIC_URL}/assets/images/pancake.svg`,
  //       `${process.env.PUBLIC_URL}/assets/images/tteokbokki.svg`,
  //     ],
  //     author: {
  //       nickname: item.nickname ?? "파스타러버",
  //       level: item.level ?? 4,
  //     },
  //     likes: item.likes ?? 80,
  //     createdAt: item.createdAt ?? "2025. 12. 20",
  //     recipeTitle: item.recipeName ?? "팬케이크",
  //     content:
  //       item.desc ??
  //       "딸기 팬케이크 완성! 반죽이 쫀쫀하고 소스가 진짜 부드러워요. 가족들이 엄청 좋아했습니다",
  //     ingredients: item.ingredients ?? ["밀가루", "생크림", "파슬리가루"],
  //     xp: item.xp ?? 120,
  //     comments: item.comments ?? [
  //       { nickname: "금손수", time: "2초 전", text: "와 진짜 맛있어 보여요!" },
  //       {
  //         nickname: "요리왕금손수",
  //         time: "5분 전",
  //         text: "두번째 댓글도 테스트!",
  //       },
  //       { nickname: meNickname, time: "8분 전", text: "내 댓글 테스트🥲" },
  //       { nickname: "테스트", time: "8분 전", text: "다른 사람 댓글" },
  //     ],
  //   }),
  //   [meNickname],
  // );

  // const handleCardClick = useCallback(
  //   (item) => {
  //     const post = buildMockPost(item);
  //     onCardClick?.(post);
  //   },
  //   [buildMockPost, onCardClick],
  // );

  // 전체 items를 그대로 상위로 전달
  const handleCardClick = useCallback(
    (item) => {
      onCardClick?.(item); // 그대로 전달
    },
    [onCardClick],
  );

  return (
    <S.FeedGridSection>
      <ListWrap>
        {showSearchEmpty ? (
          <S.EmptyState>
            <S.EmptyTitle>“{searchKeyword}” 검색 결과가 없습니다.</S.EmptyTitle>
            <S.EmptyDesc>다른 키워드로 다시 검색해보세요.</S.EmptyDesc>
          </S.EmptyState>
        ) : showCommunityEmpty ? (
          <S.EmptyState>
            <S.EmptyTitle>아직 등록된 게시글이 없습니다.</S.EmptyTitle>
            <S.EmptyDesc>
              요리를 완성하고 첫 번째 인증 게시글을 남겨보세요!
            </S.EmptyDesc>

            <S.EmptyButton onClick={onEmptyAction}>
              추천 요리 보러가기
            </S.EmptyButton>
          </S.EmptyState>
        ) : (
          visibleItems.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              allItems={items}
              w="100%"
              variant={useMobileList ? "mobile-list" : undefined}
              meNickname={meNickname}
              onClick={() => handleCardClick(item)}
              onLikeToggle={onLikeToggle}
            />
          ))
        )}
      </ListWrap>

      {/* 아래는 items가 있을 때만 보여주기 */}
      {items.length > 0 && (
        <>
          <S.FeedGridSentinel ref={sentinelRef} />
          {isLoading && <S.FeedGridLoading>불러오는 중…</S.FeedGridLoading>}
          {!hasMore && <S.FeedGridEnd>마지막 게시물입니다.</S.FeedGridEnd>}
        </>
      )}
    </S.FeedGridSection>
  );
};

export default FeedGrid;
