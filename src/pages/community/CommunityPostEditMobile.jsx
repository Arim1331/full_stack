import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import * as D from "./CommunityPostDetailMobile.style";
import * as S from "./CommunityPostEditMobile.style";

import LoginRequireModal from "../../components/layoutcomponents/loginrequiremodal/LoginRequireModal";
import useMediaQuery from "../../hooks/useMediaQuery";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import { deletePost, getPostDetail, updatePost } from "../../api/post";
import { getPostImages } from "../../api/postimage";
import { isMyPost, normalizePostDetail } from "../../utils/communityPost";
import {
  MAX_POST_IMAGES,
  IMAGE_MAX_MESSAGE,
  PostImageSaveError,
  buildPostPatch,
  ingredientsToText,
  normalizeImageId,
  saveEditedPostImages,
  sortPostImages,
  validateImageCount,
} from "../../utils/postEdit";

const LEAVE_CONFIRM_MESSAGE = "수정 중인 내용이 있어요. 나가시겠어요?";

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

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 이미지 저장 단계별 안내 문구 (서버에 반영된 범위를 정확히 알려 중복 저장을 방지)
const getImageFailureNotice = (error, textSaved) => {
  const prefix = textSaved ? "게시글 내용은 저장됐어요. " : "";

  switch (error?.stage) {
    case "validate":
      return `${prefix}${error.message}`;
    case "upload":
      return `${prefix}이미지 업로드에 실패했어요. 기존 이미지는 그대로예요. 선택한 사진을 확인하고 다시 저장해 주세요.`;
    case "delete":
      return `${prefix}새 이미지는 업로드됐지만 기존 이미지 삭제에 실패했어요. 이미지가 일부만 반영되었을 수 있어서 서버의 현재 이미지 목록으로 다시 불러왔어요. 확인 후 다시 저장해 주세요.`;
    case "replace":
      return `${prefix}이미지 목록을 정리하는 중 오류가 발생했어요. 이미지가 일부만 반영되었을 수 있어서 서버의 현재 이미지 목록으로 다시 불러왔어요. 확인 후 다시 저장해 주세요.`;
    default:
      return `${prefix}이미지 수정에 실패했어요. 이미지가 일부만 반영되었을 수 있어요.`;
  }
};

/**
 * 모바일(≤768px) 게시글 수정 페이지 — /community/posts/:postId/edit
 * - MyPostModal 이 지원하는 편집 항목(제목/본문/재료/이미지)과 삭제만 제공 (새 항목/새 검증 규칙 없음)
 * - 기존 API(updatePost, deletePost, postimage)를 그대로 사용, 이미지 저장 순서는 utils/postEdit 에 동일하게 구현
 * - 데스크톱 폭에서는 기존 모달(/communitymain?postId=)로 이동
 */
const CommunityPostEditMobile = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const authState = useAuthStore();
  const currentUser = authState.member ?? authState.user ?? null;
  const isLoggedIn = Boolean(authState.isAuthenticated && currentUser);
  const meNickname = currentUser?.memberName || "";
  const myId = currentUser?.id;
  const fetchPosts = usePostStore((state) => state.fetchPosts);

  const idNum = Number(postId);
  const validId = Number.isInteger(idNum) && idNum > 0;

  const [status, setStatus] = useState("loading"); // loading | ready | error | unauthorized | forbidden
  const [reloadKey, setReloadKey] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 서버 기준값(저장된 값)과 입력값
  const [baseline, setBaseline] = useState({
    title: "",
    content: "",
    ingredientsText: "",
  });
  const [form, setForm] = useState({
    title: "",
    content: "",
    ingredientsText: "",
  });

  // 이미지: 화면에 남아 있는 기존 이미지(삭제 예정 제외) / 삭제 예정 id / 새로 추가할 파일
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newImageItems, setNewImageItems] = useState([]);
  const [imagesReady, setImagesReady] = useState(true);

  const [isBusy, setIsBusy] = useState(false); // 저장/삭제 진행 중
  const [notice, setNotice] = useState(null); // { type: "error" | "warn", text }
  const [needsReload, setNeedsReload] = useState(false); // 서버 상태를 다시 확인해야 저장 가능

  const savingRef = useRef(false); // 저장/삭제 중복 요청 차단 (state 보다 먼저 반영되는 동기 가드)
  const leavingRef = useRef(false); // 저장/삭제 성공 후 이동은 이탈 차단에서 제외
  const dirtyRef = useRef(false);
  const newItemsRef = useRef([]);
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);

  const textChanged =
    form.title !== baseline.title ||
    form.content !== baseline.content ||
    form.ingredientsText !== baseline.ingredientsText;
  const imagesChanged = deletedImageIds.length > 0 || newImageItems.length > 0;
  const dirty = textChanged || imagesChanged;
  const canSave = status === "ready" && !isBusy && dirty && !needsReload;

  dirtyRef.current = dirty;
  newItemsRef.current = newImageItems;

  const revokePreviews = (items) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  };

  /* ---------- 게시글/이미지 조회 (직접 접속/새로고침 지원) ---------- */
  useEffect(() => {
    if (!isMobile || !validId) return undefined;

    if (!isLoggedIn) {
      setStatus("unauthorized");
      setLoginModalOpen(true);
      return undefined;
    }

    let cancelled = false;

    setStatus("loading");
    setNotice(null);
    setNeedsReload(false);

    (async () => {
      try {
        const detail = await getPostDetail(idNum);
        const post = normalizePostDetail(detail, []);

        // 수정은 본인 게시글만 (실제 권한은 백엔드 인증/권한 검증이 담당)
        const mine = isMyPost({
          authorId: post.author?.id,
          authorNickname: post.author?.nickname,
          myId,
          myNickname: meNickname,
        });

        if (cancelled) return;

        if (!mine) {
          setStatus("forbidden");
          return;
        }

        // 이미지: 삭제 요청에 필요한 id 가 있는 목록을 사용 (MyPostModal 과 동일하게 이미지 API 기준)
        let serverImages = null;
        try {
          serverImages = sortPostImages(await getPostImages(idNum));
        } catch (imageError) {
          console.error("게시글 이미지 조회 실패:", imageError);
        }

        if (cancelled) return;

        revokePreviews(newItemsRef.current);

        const values = {
          title: post.recipeTitle ?? "",
          content: post.content ?? "",
          ingredientsText: ingredientsToText(detail?.postIngredientUsed),
        };

        setBaseline(values);
        setForm(values);
        setExistingImages(serverImages ?? []);
        setImagesReady(serverImages !== null);
        setDeletedImageIds([]);
        setNewImageItems([]);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;

        console.error("게시글 조회 실패:", error);

        if (error?.status === 401) {
          setStatus("unauthorized");
          setLoginModalOpen(true);
          return;
        }

        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMobile, validId, idNum, isLoggedIn, myId, meNickname, reloadKey]);

  // 언마운트 시 새 이미지 미리보기 URL 해제
  useEffect(
    () => () => {
      newItemsRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      );
    },
    [],
  );

  // 본문 textarea 자동 높이
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight + 2, 160)}px`;
  }, [form.content, status]);

  /* ---------- 변경사항 유실 방지 ---------- */
  // 앱 내 이동(브라우저/제스처 뒤로가기 포함): data router(RouterProvider/createBrowserRouter)에서 useBlocker 지원
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirtyRef.current &&
        !leavingRef.current &&
        currentLocation.pathname !== nextLocation.pathname,
      [],
    ),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;

    if (window.confirm(LEAVE_CONFIRM_MESSAGE)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  // 새로고침/탭 닫기
  useEffect(() => {
    if (!dirty) return undefined;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  /* ---------- 이동 ---------- */
  // 상세 페이지로 복귀
  // - 상세 페이지가 이동 시 넘긴 state(from: "detail")가 있을 때만 navigate(-1)
  //   (location.key 만으로는 이전 페이지가 상세인지 알 수 없음. state 는 새로고침 후에도 히스토리에 유지됨)
  // - 직접 URL 접속 등 그 외에는 /community/posts/:postId 로 replace 이동
  const goBackToDetail = () => {
    leavingRef.current = true;

    if (location.state?.from === "detail") {
      navigate(-1);
    } else {
      navigate(`/community/posts/${idNum}`, { replace: true });
    }
  };

  const handleBack = () => {
    if (isBusy) return;

    if (dirty) {
      if (!window.confirm(LEAVE_CONFIRM_MESSAGE)) return;
      goBackToDetail();
      return;
    }

    goBackToDetail();
  };

  /* ---------- 입력 ---------- */
  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  /* ---------- 이미지 편집 (MyPostModal 과 동일한 규칙) ---------- */
  const imageCount = existingImages.length + newImageItems.length;

  const handlePickImage = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const availableCount = MAX_POST_IMAGES - imageCount;

    if (availableCount <= 0) {
      alert(IMAGE_MAX_MESSAGE);
      e.target.value = "";
      return;
    }

    const items = files.slice(0, availableCount).map((file) => ({
      key: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImageItems((prev) => [...prev, ...items]);

    if (files.length > availableCount) {
      alert(IMAGE_MAX_MESSAGE);
    }

    e.target.value = "";
  };

  const handleRemoveExistingImage = (image) => {
    setExistingImages((prev) =>
      prev.filter(
        (item) => normalizeImageId(item.id) !== normalizeImageId(image.id),
      ),
    );
    setDeletedImageIds((prev) =>
      prev.some((id) => normalizeImageId(id) === normalizeImageId(image.id))
        ? prev
        : [...prev, image.id],
    );
  };

  const handleRemoveNewImage = (key) => {
    setNewImageItems((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  };

  // 서버의 현재 이미지 목록으로 동기화 (부분 저장 후 상태가 모호할 때)
  const syncImagesFromServer = async () => {
    try {
      const images = sortPostImages(await getPostImages(idNum));

      revokePreviews(newItemsRef.current);
      setExistingImages(images);
      setDeletedImageIds([]);
      setNewImageItems([]);
      setImagesReady(true);
      return true;
    } catch (error) {
      console.error("이미지 목록 재조회 실패:", error);
      setNeedsReload(true); // 서버 상태를 모르는 채로 다시 저장하면 중복 업로드될 수 있으므로 막음
      return false;
    }
  };

  /* ---------- 저장 ---------- */
  const handleSave = async () => {
    if (savingRef.current || !canSave) return;

    // 서버에 변경 요청을 보내기 전 이미지 개수 검증 (기존 이미지 최소 1장 / 최대 5장)
    if (imagesChanged) {
      const message = validateImageCount(imageCount);
      if (message) {
        alert(message);
        return;
      }
    }

    savingRef.current = true;
    setIsBusy(true);
    setNotice(null);

    let textSaved = false;

    try {
      // 1) 텍스트: 실패하면 이미지 저장은 진행하지 않음 (아무것도 저장되지 않은 상태 유지)
      if (textChanged) {
        try {
          await updatePost(idNum, buildPostPatch(form));
          textSaved = true;
          setBaseline({ ...form });
        } catch (error) {
          console.error("게시글 수정 실패:", error);
          setNotice({
            type: "error",
            text: "게시글 저장에 실패했어요. 저장된 내용은 없어요. 잠시 후 다시 시도해 주세요.",
          });
          alert(error.message);
          return;
        }
      }

      // 2) 이미지
      if (imagesChanged) {
        try {
          // refreshFailed 는 "저장은 성공, 마지막 목록 재조회만 실패"이므로 저장 실패로 취급하지 않음
          // (이후 상세 페이지로 이동하며 최신 데이터를 다시 조회하므로 재업로드 불필요)
          await saveEditedPostImages({
            postId: idNum,
            existingImages,
            deletedImageIds,
            newFiles: newImageItems.map((item) => item.file),
          });

          revokePreviews(newItemsRef.current);
          setDeletedImageIds([]);
          setNewImageItems([]);
        } catch (error) {
          console.error("이미지 수정 실패:", error);

          const stage =
            error instanceof PostImageSaveError ? error.stage : "unknown";

          // 업로드 이전 단계 실패는 서버 이미지가 바뀌지 않았으므로 선택한 사진을 유지
          // 삭제/교체 단계 실패는 서버 상태가 일부만 바뀌었을 수 있어 최신 목록으로 되돌림
          if (stage !== "validate" && stage !== "upload") {
            await syncImagesFromServer();
          }

          setNotice({
            type: textSaved ? "warn" : "error",
            text: getImageFailureNotice(
              error instanceof PostImageSaveError
                ? error
                : { stage, message: error.message },
              textSaved,
            ),
          });
          alert(
            textSaved
              ? "게시글 내용은 저장됐지만 이미지 수정에 실패했어요."
              : "이미지 수정에 실패했어요.",
          );
          return;
        }
      }

      // 3) 목록 동기화 → 상세 페이지로 복귀 (상세가 최신 데이터를 다시 조회)
      //    저장은 이미 끝났으므로 목록 동기화 실패는 기록만 하고 복귀를 막지 않음
      //    (실패를 저장 실패로 오인해 같은 내용을 다시 저장/업로드하지 않도록 함. 목록은 다음 진입 시 fetchPosts 로 갱신됨)
      try {
        await fetchPosts();
      } catch (syncError) {
        console.error("저장 후 목록 동기화 실패(저장은 완료됨):", syncError);
      }

      goBackToDetail();
    } finally {
      savingRef.current = false;
      setIsBusy(false);
    }
  };

  /* ---------- 삭제 ---------- */
  const handleDelete = async () => {
    if (savingRef.current || isBusy) return;

    if (!window.confirm("게시글을 삭제할까요?")) return;

    savingRef.current = true;
    setIsBusy(true);
    setNotice(null);

    try {
      await deletePost(idNum);
    } catch (error) {
      // 삭제 실패: 현재 페이지 유지 + 오류 안내
      console.error("게시글 삭제 실패:", error);
      setNotice({
        type: "error",
        text: "게시글을 삭제하지 못했어요. 게시글은 그대로 남아 있어요. 잠시 후 다시 시도해 주세요.",
      });
      alert(error.message);
      savingRef.current = false;
      setIsBusy(false);
      return;
    }

    // 삭제 성공(deletePost 결과 기준): 목록 동기화 실패와 무관하게 커뮤니티 목록으로 이동
    // (삭제된 상세/수정 페이지에 갇히거나 삭제를 다시 시도하지 않도록 함. 동기화 실패는 기록만)
    try {
      await fetchPosts();
    } catch (syncError) {
      console.error("삭제 후 목록 동기화 실패(삭제는 완료됨):", syncError);
    }

    leavingRef.current = true;
    navigate("/communitymain", { replace: true });
  };

  const handleGoList = () => {
    leavingRef.current = true;
    navigate("/communitymain", { replace: true });
  };

  /* ---------- 데스크톱 폭: 기존 모달 흐름으로 이동 ---------- */
  if (!isMobile && validId) {
    return <Navigate to={`/communitymain?postId=${idNum}`} replace />;
  }

  // 본인 글이 아니면 상세 페이지로
  if (status === "forbidden") {
    return <Navigate to={`/community/posts/${idNum}`} replace />;
  }

  const header = (
    <D.Header>
      <D.BackButton type="button" onClick={handleBack} aria-label="뒤로 가기">
        <BackIcon />
      </D.BackButton>
      <D.HeaderTitle>게시글 수정</D.HeaderTitle>
      {status === "ready" && (
        <S.SaveButton type="button" onClick={handleSave} disabled={!canSave}>
          {isBusy ? "처리 중…" : "저장"}
        </S.SaveButton>
      )}
    </D.Header>
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
      <S.Page>
        <S.EditLayoutStyle />
        {header}
        <D.StateBox>
          <D.StateTitle>게시글을 찾을 수 없어요</D.StateTitle>
          <D.StateDesc>삭제되었거나 불러올 수 없는 게시글이에요.</D.StateDesc>
          <D.StateActions>
            {validId && (
              <D.StateButton
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                다시 시도
              </D.StateButton>
            )}
            <D.StateButton type="button" $primary onClick={handleGoList}>
              목록으로
            </D.StateButton>
          </D.StateActions>
        </D.StateBox>
      </S.Page>
    );
  }

  if (status === "unauthorized") {
    return (
      <S.Page>
        <S.EditLayoutStyle />
        {header}
        <D.StateBox>
          <D.StateTitle>로그인이 필요해요</D.StateTitle>
          <D.StateDesc>로그인 후 게시글을 수정할 수 있어요.</D.StateDesc>
          <D.StateActions>
            <D.StateButton type="button" onClick={handleGoList}>
              목록으로
            </D.StateButton>
            <D.StateButton
              type="button"
              $primary
              onClick={() => navigate("/login")}
            >
              로그인
            </D.StateButton>
          </D.StateActions>
        </D.StateBox>
        {loginModal}
      </S.Page>
    );
  }

  if (status !== "ready") {
    return (
      <S.Page>
        <S.EditLayoutStyle />
        {header}
        <D.StateBox>
          <D.StateDesc>불러오는 중…</D.StateDesc>
        </D.StateBox>
      </S.Page>
    );
  }

  const previewUrls = [
    ...existingImages.map((image) => image.imageUrl),
    ...newImageItems.map((item) => item.previewUrl),
  ];

  return (
    <S.Page>
      <S.EditLayoutStyle />
      {header}

      {/* 현재 사진 (폭 100%, 원본 비율 유지) */}
      <D.Gallery>
        {previewUrls.length > 0 ? (
          <D.GalleryImg src={previewUrls[0]} alt="대표 이미지" />
        ) : (
          <D.GalleryPlaceholder>이미지가 없습니다.</D.GalleryPlaceholder>
        )}
      </D.Gallery>

      {/* 이미지 변경/삭제 */}
      <S.ThumbSection>
        <S.ThumbHeader>
          <S.ThumbTitle>사진</S.ThumbTitle>
          <S.ThumbCount>
            {imageCount} / {MAX_POST_IMAGES}
          </S.ThumbCount>
        </S.ThumbHeader>

        {imagesReady ? (
          <S.ThumbGrid>
            {existingImages.map((image, idx) => (
              <S.Thumb key={image.id ?? `${image.imageUrl}-${idx}`}>
                <img src={image.imageUrl} alt={`기존 이미지 ${idx + 1}`} />
                <S.ThumbRemove
                  type="button"
                  aria-label="이미지 삭제"
                  disabled={isBusy}
                  onClick={() => handleRemoveExistingImage(image)}
                >
                  <CloseIcon />
                </S.ThumbRemove>
              </S.Thumb>
            ))}

            {newImageItems.map((item, idx) => (
              <S.Thumb key={item.key} $new>
                <img src={item.previewUrl} alt={`새 이미지 ${idx + 1}`} />
                <S.ThumbRemove
                  type="button"
                  aria-label="추가한 이미지 취소"
                  disabled={isBusy}
                  onClick={() => handleRemoveNewImage(item.key)}
                >
                  <CloseIcon />
                </S.ThumbRemove>
              </S.Thumb>
            ))}

            {imageCount < MAX_POST_IMAGES && (
              <S.ThumbAdd
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon />
                사진 추가
              </S.ThumbAdd>
            )}
          </S.ThumbGrid>
        ) : (
          <S.FieldHint>
            이미지를 불러오지 못해 사진은 수정할 수 없어요. 게시글 내용만
            수정할 수 있어요.
          </S.FieldHint>
        )}

        <S.HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePickImage}
        />
      </S.ThumbSection>

      {/* 부분 저장/오류 안내 */}
      {notice && (
        <S.Notice $type={notice.type} role="alert">
          {notice.text}
          {needsReload && (
            <S.NoticeAction
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              서버 상태 다시 불러오기
            </S.NoticeAction>
          )}
        </S.Notice>
      )}

      {/* 제목/본문/재료 */}
      <S.FormSection>
        <S.Field>
          <S.FieldLabel>요리 제목</S.FieldLabel>
          <S.TitleInput
            value={form.title}
            onChange={handleFieldChange("title")}
            placeholder="제목"
            disabled={isBusy}
          />
        </S.Field>

        <S.Field>
          <S.FieldLabel>게시글 내용</S.FieldLabel>
          <S.ContentTextarea
            ref={contentRef}
            value={form.content}
            onChange={handleFieldChange("content")}
            placeholder="내용"
            disabled={isBusy}
          />
        </S.Field>

        <S.Field>
          <S.FieldLabel>사용한 재료</S.FieldLabel>
          <S.TitleInput
            value={form.ingredientsText}
            onChange={handleFieldChange("ingredientsText")}
            placeholder="재료를 콤마로 구분 (예: 밀가루, 생크림)"
            disabled={isBusy}
          />
          <S.FieldHint>재료는 콤마(,)로 구분해서 입력해 주세요.</S.FieldHint>
        </S.Field>
      </S.FormSection>

      {/* 게시글 삭제 */}
      <S.DeleteSection>
        <S.DeleteButton type="button" onClick={handleDelete} disabled={isBusy}>
          게시글 삭제
        </S.DeleteButton>
      </S.DeleteSection>

      {loginModal}
    </S.Page>
  );
};

export default CommunityPostEditMobile;
