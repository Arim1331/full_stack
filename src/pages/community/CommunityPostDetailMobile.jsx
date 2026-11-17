import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import * as S from "./CommunityPostDetailMobile.style";

import LoginRequireModal from "../../components/layoutcomponents/loginrequiremodal/LoginRequireModal";
import useMediaQuery from "../../hooks/useMediaQuery";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import { getPostDetail } from "../../api/post";
import { getPostImages } from "../../api/postimage";
import {
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
  deleteSelectedComments,
} from "../../api/comment";
import { createPostLike, deletePostLike } from "../../api/postLike";
import {
  extractImageUrls,
  formatPostDate,
  formatRelativeTime,
  isMyPost,
  normalizePostDetail,
} from "../../utils/communityPost";

const COMMENT_MAX_LENGTH = 300; // 기존 상세 모달과 동일
const COMPOSER_INPUT_MAX_HEIGHT = 104;

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 5l-7 7 7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 19V5M12 5l-6 6M12 5l6 6"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 모바일(≤768px) 게시글 상세 페이지 — /community/posts/:postId
 * - 데이터/로직은 기존 API(getPostDetail, getPostImages, comment, postLike)를 그대로 재사용
 * - 데스크톱 폭에서는 기존 모달(/communitymain?postId=)로 이동
 * - 내 글 수정/삭제는 기존 CommunityMain 의 MyPostModal 흐름을 관리 모드(&modal=1)로 재사용
 */
const CommunityPostDetailMobile = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const authState = useAuthStore();
  const currentUser = authState.member ?? authState.user ?? null;
  const isLoggedIn = Boolean(authState.isAuthenticated && currentUser);
  const meNickname = currentUser?.memberName || "";
  const updatePostInStore = usePostStore((state) => state.updatePost);

  const idNum = Number(postId);
  const validId = Number.isInteger(idNum) && idNum > 0;

  const [status, setStatus] = useState("loading"); // loading | ready | error | unauthorized
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [imageIndex, setImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState("");

  // 댓글 관리(내 글 주인 전용 선택 삭제) 모드
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const pageRef = useRef(null);
  const composerRef = useRef(null);
  const composerInputRef = useRef(null);
  const descRef = useRef(null);
  const likePendingRef = useRef(false);

  /* ---------- 게시글/이미지/댓글 조회 (URL 직접 접속/새로고침 지원) ---------- */
  useEffect(() => {
    if (!isMobile || !validId) return undefined;

    let cancelled = false;

    setStatus("loading");
    setPost(null);
    setComments([]);
    setImageIndex(0);
    setIsExpanded(false);
    setEditingId(null);
    setCommentText("");

    (async () => {
      try {
        const detail = await getPostDetail(idNum);

        // 기존 모달과 동일: 상세의 postImage 우선, 없으면 이미지 API
        let imageUrls = extractImageUrls(detail?.postImage);
        if (imageUrls.length === 0) {
          try {
            imageUrls = extractImageUrls(await getPostImages(idNum));
          } catch (imageError) {
            console.error("게시글 이미지 조회 실패:", imageError);
          }
        }

        let commentList = Array.isArray(detail?.comment) ? detail.comment : [];
        try {
          commentList = await getCommentsByPostId(idNum);
        } catch (commentError) {
          console.error("댓글 조회 실패:", commentError);
        }

        if (cancelled) return;

        setPost(normalizePostDetail(detail, imageUrls));
        setComments(commentList);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;

        console.error("게시글 상세 조회 실패:", error);

        if (error?.status === 401) {
          setLoginModalOpen(true);
          setStatus("unauthorized");
          return;
        }

        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMobile, validId, idNum, reloadKey]);

  /* ---------- 본문 "자세히 보기" 표시 여부 (모달과 동일: 접힌 상태에서 넘칠 때만) ---------- */
  useEffect(() => {
    if (status !== "ready" || isExpanded) return undefined;

    const el = descRef.current;
    if (!el) return undefined;

    const raf = requestAnimationFrame(() => {
      setCanToggle(el.scrollHeight > el.clientHeight + 1);
    });

    return () => cancelAnimationFrame(raf);
  }, [status, post?.content, isExpanded]);

  /* ---------- 하단 고정 댓글 입력창: 키보드/높이 변화 대응 ---------- */
  useEffect(() => {
    if (status !== "ready") return undefined;

    const composer = composerRef.current;
    const page = pageRef.current;
    if (!composer || !page) return undefined;

    // iOS Safari: 키보드가 올라와도 레이아웃 뷰포트는 그대로라 visualViewport 로 보정
    // (Android Chrome 은 레이아웃 뷰포트가 줄어 offset 이 0)
    const vv = window.visualViewport;
    const updateKeyboardOffset = () => {
      if (!vv) return;
      const offset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      composer.style.setProperty("--kb-offset", `${offset}px`);
    };

    // 입력창 실제 높이(자동 높이 textarea, safe-area 포함)만큼 본문 하단 여백 확보
    const updateComposerHeight = () => {
      page.style.setProperty(
        "--composer-h",
        `${composer.getBoundingClientRect().height}px`,
      );
    };

    updateKeyboardOffset();
    updateComposerHeight();

    vv?.addEventListener("resize", updateKeyboardOffset);
    vv?.addEventListener("scroll", updateKeyboardOffset);
    window.addEventListener("resize", updateComposerHeight);

    let observer;
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(updateComposerHeight);
      observer.observe(composer);
    }

    return () => {
      vv?.removeEventListener("resize", updateKeyboardOffset);
      vv?.removeEventListener("scroll", updateKeyboardOffset);
      window.removeEventListener("resize", updateComposerHeight);
      observer?.disconnect();
    };
  }, [status]);

  /* ---------- 이동 ---------- */
  const handleBack = () => {
    // 히스토리가 없으면(직접 접속/새로고침 후) 목록으로
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/communitymain", { replace: true });
    }
  };

  const handleGoList = () => navigate("/communitymain", { replace: true });

  const isMine =
    isLoggedIn &&
    !!post &&
    isMyPost({
      authorId: post.author?.id,
      authorNickname: post.author?.nickname,
      myId: currentUser?.id,
      myNickname: meNickname,
    });

  // 수정: 모바일 전용 수정 페이지로 이동 (수정/삭제는 수정 페이지에서 처리)
  // - state.from 으로 "상세에서 왔음"을 명시해 수정 페이지가 안전하게 뒤로가기(-1) 하도록 함
  const handleEdit = () => {
    navigate(`/community/posts/${idNum}/edit`, { state: { from: "detail" } });
  };

  /* ---------- 로그인 요구 ---------- */
  const requireLogin = useCallback(
    (action) => {
      if (!isLoggedIn) {
        setLoginModalOpen(true);
        return false;
      }
      action?.();
      return true;
    },
    [isLoggedIn],
  );

  /* ---------- 좋아요 (낙관 반영 → 성공 시 postStore 동기화, 실패 시 롤백) ---------- */
  const handleLikeToggle = () => {
    if (!post || likePendingRef.current) return;

    requireLogin(async () => {
      likePendingRef.current = true;

      const prev = { liked: post.liked, likes: post.likes };
      const nextLiked = !prev.liked;
      const nextLikes = Math.max(0, prev.likes + (nextLiked ? 1 : -1));

      setPost((p) => ({ ...p, liked: nextLiked, likes: nextLikes }));

      try {
        if (prev.liked) {
          await deletePostLike({ postId: idNum });
        } else {
          await createPostLike({ postId: idNum });
        }

        // 목록으로 돌아갔을 때 좋아요 상태/개수가 즉시 일치하도록 기존 store 액션으로 반영
        updatePostInStore?.(idNum, { likes: nextLikes, liked: nextLiked });
      } catch (error) {
        console.error("좋아요 처리 실패:", error);
        setPost((p) => ({ ...p, ...prev }));
        alert(error.message);
      } finally {
        likePendingRef.current = false;
      }
    });
  };

  /* ---------- 댓글 ---------- */
  const refreshComments = async () => {
    const data = await getCommentsByPostId(idNum);
    setComments(data);
  };

  const resetComposerHeight = () => {
    if (composerInputRef.current) composerInputRef.current.style.height = "";
  };

  const handleSendComment = (e) => {
    e?.preventDefault();

    const text = commentText.trim();
    if (!text || !post) return;

    requireLogin(async () => {
      const optimistic = {
        id: `temp-${Date.now()}`,
        content: text,
        createdAt: new Date().toISOString(),
        member: { memberName: meNickname || "나" },
      };

      setComments((prev) => [optimistic, ...prev]);
      setCommentText("");
      resetComposerHeight();

      try {
        await createComment({ postId: idNum, content: text });
        await refreshComments();
      } catch (error) {
        console.error("댓글 생성 실패", error);
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setCommentText(text);
        alert(error.message);
      }
    });
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setDraftText(comment.content ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftText("");
  };

  const saveEdit = (comment) => {
    const next = draftText.trim();
    if (!next || !comment?.id) return;

    requireLogin(async () => {
      const prevComments = comments;

      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, content: next } : c)),
      );
      cancelEdit();

      try {
        await updateComment(comment.id, next);
        await refreshComments();
      } catch (error) {
        console.error("댓글 수정 실패", error);
        setComments(prevComments);
        alert(error.message);
      }
    });
  };

  const handleDeleteComment = (comment) => {
    if (!comment?.id) return;

    requireLogin(async () => {
      if (!window.confirm("댓글을 삭제할까요?")) return;

      const prevComments = comments;
      setComments((prev) => prev.filter((c) => c.id !== comment.id));

      try {
        await deleteComment(comment.id);
        await refreshComments();
      } catch (error) {
        console.error("댓글 삭제 실패", error);
        setComments(prevComments);
        alert(error.message);
      }
    });
  };

  /* ---------- 댓글 관리: 내 글의 댓글 선택 삭제 (기존 MyPostModal 기능을 모바일에서 유지) ---------- */
  // 임시(낙관) 댓글은 서버 id 가 없으므로 선택 대상에서 제외
  const selectableComments = comments.filter(
    (c) => c?.id != null && !String(c.id).startsWith("temp-"),
  );
  const allSelected =
    selectableComments.length > 0 &&
    selectableComments.every((c) => selectedIds.has(c.id));

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(selectableComments.map((c) => c.id)),
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    requireLogin(async () => {
      if (!window.confirm("선택한 댓글을 삭제할까요?")) return;

      const ids = Array.from(selectedIds);
      const prevComments = comments;

      setComments((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      exitSelectMode();

      try {
        await deleteSelectedComments(ids);
        await refreshComments();
      } catch (error) {
        console.error("선택 댓글 삭제 실패", error);
        setComments(prevComments);
        alert(error.message);
      }
    });
  };

  const isMyComment = (comment) =>
    isLoggedIn &&
    isMyPost({
      authorId: comment?.memberId ?? comment?.member?.id,
      authorNickname: comment?.member?.memberName,
      myId: currentUser?.id,
      myNickname: meNickname,
    });

  const handleComposerFocus = (e) => {
    if (!isLoggedIn) {
      e.currentTarget.blur();
      setLoginModalOpen(true);
    }
  };

  const handleComposerChange = (e) => {
    if (!isLoggedIn) return;

    setCommentText(e.target.value.slice(0, COMMENT_MAX_LENGTH));

    // 자동 높이 (1~4줄)
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(
      e.target.scrollHeight + 2,
      COMPOSER_INPUT_MAX_HEIGHT,
    )}px`;
  };

  const handleGalleryScroll = (e) => {
    const track = e.currentTarget;
    if (!track.clientWidth) return;
    setImageIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  /* ---------- 데스크톱 폭: 기존 모달 흐름으로 이동 (모바일 redirect 와 순환하지 않음) ---------- */
  if (!isMobile && validId) {
    return <Navigate to={`/communitymain?postId=${idNum}`} replace />;
  }

  const renderHeader = () => (
    <S.Header>
      <S.BackButton type="button" onClick={handleBack} aria-label="뒤로 가기">
        <BackIcon />
      </S.BackButton>
      <S.HeaderTitle>요리 이야기</S.HeaderTitle>
      {status === "ready" && isMine && (
        <S.HeaderAction type="button" onClick={handleEdit}>
          수정
        </S.HeaderAction>
      )}
    </S.Header>
  );

  const loginModal = (
    <LoginRequireModal
      open={loginModalOpen}
      title="로그인이 필요합니다."
      desc="로그인이 만료되었거나 인증 정보가 없습니다. 다시 로그인해주세요."
      confirmText="로그인하러 가기"
      cancelText="닫기"
      onClose={() => setLoginModalOpen(false)}
      onConfirm={() => {
        setLoginModalOpen(false);
        navigate("/login");
      }}
    />
  );

  /* ---------- 상태 화면 ---------- */
  if (!validId || status === "error") {
    return (
      <S.Page ref={pageRef}>
        <S.PostDetailLayoutStyle />
        {renderHeader()}
        <S.StateBox>
          <S.StateTitle>게시글을 찾을 수 없어요</S.StateTitle>
          <S.StateDesc>삭제되었거나 불러올 수 없는 게시글이에요.</S.StateDesc>
          <S.StateActions>
            {validId && (
              <S.StateButton
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                다시 시도
              </S.StateButton>
            )}
            <S.StateButton type="button" $primary onClick={handleGoList}>
              목록으로
            </S.StateButton>
          </S.StateActions>
        </S.StateBox>
      </S.Page>
    );
  }

  if (status === "unauthorized") {
    return (
      <S.Page ref={pageRef}>
        <S.PostDetailLayoutStyle />
        {renderHeader()}
        <S.StateBox>
          <S.StateTitle>로그인이 필요해요</S.StateTitle>
          <S.StateDesc>로그인 후 게시글을 확인할 수 있어요.</S.StateDesc>
          <S.StateActions>
            <S.StateButton type="button" onClick={handleGoList}>
              목록으로
            </S.StateButton>
            <S.StateButton
              type="button"
              $primary
              onClick={() => navigate("/login")}
            >
              로그인
            </S.StateButton>
          </S.StateActions>
        </S.StateBox>
        {loginModal}
      </S.Page>
    );
  }

  if (status !== "ready" || !post) {
    return (
      <S.Page ref={pageRef}>
        <S.PostDetailLayoutStyle />
        {renderHeader()}
        <S.StateBox>
          <S.StateDesc>불러오는 중…</S.StateDesc>
        </S.StateBox>
      </S.Page>
    );
  }

  const images = post.images ?? [];
  const ingredients = post.postIngredientUsed ?? [];

  return (
    <S.Page ref={pageRef}>
      <S.PostDetailLayoutStyle />
      {renderHeader()}

      {/* 요리 사진: 폭 100%, 원본 비율 유지 */}
      <S.Gallery>
        {images.length > 0 ? (
          <>
            {/* 원본이 차지하지 않는 여백을 현재 사진의 블러 배경으로 채움 (스와이프 시 imageIndex 에 맞춰 변경) */}
            <S.GalleryBackdrop aria-hidden="true">
              <S.GalleryBgImg
                src={images[Math.min(imageIndex, images.length - 1)]}
                alt=""
              />
              <S.GalleryBgDim />
            </S.GalleryBackdrop>

            <S.GalleryTrack onScroll={handleGalleryScroll}>
              {images.map((src, idx) => (
                <S.GallerySlide key={`${src}-${idx}`}>
                  <S.GalleryImg src={src} alt={`요리 이미지 ${idx + 1}`} />
                </S.GallerySlide>
              ))}
            </S.GalleryTrack>
            {images.length > 1 && (
              <S.GalleryIndex>
                {Math.min(imageIndex + 1, images.length)} / {images.length}
              </S.GalleryIndex>
            )}
          </>
        ) : (
          <S.GalleryPlaceholder>이미지가 없습니다.</S.GalleryPlaceholder>
        )}
      </S.Gallery>

      <S.Section>
        {/* 작성자 정보 + 좋아요 */}
        <S.AuthorRow>
          <S.AuthorLeft>
            <S.AuthorTop>
              <S.Nickname>{post.author?.nickname ?? "익명"}</S.Nickname>
              <S.LevelChip>
                <img src="/assets/icons/star.svg" alt="" />
                Lv.{post.author?.level ?? 1}
              </S.LevelChip>
            </S.AuthorTop>
            <S.DateText>{formatPostDate(post.createdAt)}</S.DateText>
          </S.AuthorLeft>

          <S.LikeButton
            type="button"
            onClick={handleLikeToggle}
            aria-label="좋아요"
            aria-pressed={!!post.liked}
          >
            <img
              src={
                post.liked
                  ? "/assets/icons/heart.svg"
                  : "/assets/icons/empty_heart.svg"
              }
              alt=""
            />
            <span>{post.likes ?? 0}</span>
          </S.LikeButton>
        </S.AuthorRow>

        {/* 제목 + 본문 */}
        <S.Title>{post.recipeTitle || "제목"}</S.Title>
        <S.Desc ref={descRef} $expanded={isExpanded}>
          {post.content ?? ""}
        </S.Desc>
        {canToggle && (
          <S.MoreButton type="button" onClick={() => setIsExpanded((v) => !v)}>
            {isExpanded ? "간단히" : "자세히 보기"}
          </S.MoreButton>
        )}

        {/* 사용한 재료 */}
        <S.SectionTitle>사용한 재료</S.SectionTitle>
        <S.ChipRow>
          {ingredients.length > 0 ? (
            ingredients.map((item, idx) => (
              <S.Chip key={item.id ?? idx}>
                {item.ingredient?.ingredientName}
              </S.Chip>
            ))
          ) : (
            <span>사용한 재료를 불러오지 못했어요</span>
          )}
        </S.ChipRow>

        {/* XP 보상 (표시만) */}
        <S.XpBox>
          재료 소진 후 획득 XP : <b>+{post.xp ?? 0} XP</b>
        </S.XpBox>
      </S.Section>

      <S.BlockDivider />

      {/* 댓글 */}
      <S.Section>
        <S.CommentHeaderRow>
          <S.CommentHeader>
            댓글 <b>{comments.length}</b>
          </S.CommentHeader>

          {/* 내 글 주인만: 댓글 관리(선택 삭제) */}
          {isMine && comments.length > 0 && !selectMode && (
            <S.ManageButton
              type="button"
              onClick={() => {
                cancelEdit();
                setSelectMode(true);
              }}
            >
              관리
            </S.ManageButton>
          )}

          {isMine && selectMode && (
            <S.SelectBar>
              <S.CommentActionButton type="button" onClick={toggleSelectAll}>
                {allSelected ? "전체 해제" : "전체 선택"}
              </S.CommentActionButton>
              <S.CommentActionButton type="button" onClick={exitSelectMode}>
                취소
              </S.CommentActionButton>
              <S.CommentActionButton
                type="button"
                $danger
                disabled={selectedIds.size === 0}
                onClick={handleDeleteSelected}
              >
                삭제({selectedIds.size})
              </S.CommentActionButton>
            </S.SelectBar>
          )}
        </S.CommentHeaderRow>

        {comments.length === 0 ? (
          <S.EmptyComment>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요!
          </S.EmptyComment>
        ) : (
          comments.map((c, idx) => {
            const mine = isMyComment(c);
            const isTemp = String(c.id).startsWith("temp-");
            const isEditing = editingId === c.id;

            return (
              <S.CommentItem key={`${c.id}-${idx}`}>
                <S.CommentTop>
                  {isMine && selectMode && !isTemp && (
                    <S.SelectCheck
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      aria-label="댓글 선택"
                    />
                  )}
                  <S.CommentNickname>
                    {c.member?.memberName ?? "익명"}
                  </S.CommentNickname>
                  <S.CommentTime>{formatRelativeTime(c.createdAt)}</S.CommentTime>
                  {mine && <S.MineTag>나</S.MineTag>}
                </S.CommentTop>

                {isEditing ? (
                  <>
                    <S.EditTextarea
                      value={draftText}
                      autoFocus
                      maxLength={COMMENT_MAX_LENGTH}
                      onChange={(e) => setDraftText(e.target.value)}
                    />
                    <S.CommentActions>
                      <S.CommentActionButton type="button" onClick={cancelEdit}>
                        취소
                      </S.CommentActionButton>
                      <S.CommentActionButton
                        type="button"
                        $primary
                        disabled={!draftText.trim()}
                        onClick={() => saveEdit(c)}
                      >
                        저장
                      </S.CommentActionButton>
                    </S.CommentActions>
                  </>
                ) : (
                  <>
                    <S.CommentText>{c.content}</S.CommentText>
                    {mine && !isTemp && (
                      <S.CommentActions>
                        <S.CommentActionButton
                          type="button"
                          onClick={() => startEdit(c)}
                        >
                          수정
                        </S.CommentActionButton>
                        <S.CommentActionButton
                          type="button"
                          $danger
                          onClick={() => handleDeleteComment(c)}
                        >
                          삭제
                        </S.CommentActionButton>
                      </S.CommentActions>
                    )}
                  </>
                )}
              </S.CommentItem>
            );
          })
        )}
      </S.Section>

      {/* 하단 고정 댓글 입력창 */}
      <S.Composer ref={composerRef} onSubmit={handleSendComment}>
        <S.ComposerInput
          ref={composerInputRef}
          rows={1}
          value={commentText}
          readOnly={!isLoggedIn}
          onFocus={handleComposerFocus}
          onChange={handleComposerChange}
          placeholder="댓글을 입력하세요(최대 300자)"
          aria-label="댓글 입력"
        />
        <S.SendButton
          type="submit"
          aria-label="댓글 전송"
          disabled={commentText.trim().length === 0}
        >
          <SendIcon />
        </S.SendButton>
      </S.Composer>

      {loginModal}
    </S.Page>
  );
};

export default CommunityPostDetailMobile;
