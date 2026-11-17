import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  useSearchParams,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import * as S from "./style";

import { CommunityHeader } from "../../components/communitycomponents/CommunityHeader";
import TrendingCarousel from "../../components/communitycomponents/TrendingCarousel";
import FeedGrid from "../../components/communitycomponents/FeedGrid";
import FloatingActions from "../../components/layoutcomponents/FloatingActions";
import SortTab from "../../components/myrecipecomponents/SortTab";
import CommunityMobileSortTab from "../../components/communitycomponents/CommunityMobileSortTab";
import CommunityMobileSearch from "../../components/communitycomponents/CommunityMobileSearch";
import useMediaQuery from "../../hooks/useMediaQuery";
import { isMyPost } from "../../utils/communityPost";

import CommunityPostModal from "../../components/communitycomponents/CommunityPostModal";
import MyPostModal from "../../components/communitycomponents/MyPostModal";
import LoginRequireModal from "../../components/layoutcomponents/loginrequiremodal/LoginRequireModal";

import usePostStore from "../../store/postStore";
import useAuthStore from "../../store/authStore";
import { createPostLike, deletePostLike } from "../../api/postLike";
import { updatePost, deletePost, getPostDetail } from "../../api/post";
import {
  createComment,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  deleteAllCommentsByPostId as deleteAllCommentsByPostIdApi,
  deleteSelectedComments as deleteSelectedCommentsApi,
} from "../../api/comment";
import {
  createPostImageFiles,
  getPostImages,
  replacePostImages,
} from "../../api/postimage";

// ===== 모바일: 상세 페이지 이동 전/후 목록 상태(검색어/정렬/스크롤/노출 개수) 저장·복원 =====
const LIST_STATE_KEY = "community:list";

const readSavedListState = (locationKey) => {
  try {
    const raw = sessionStorage.getItem(LIST_STATE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    // 같은 히스토리 엔트리로 돌아온 경우(뒤로가기/새로고침)에만 복원
    return saved?.key === locationKey ? saved : null;
  } catch {
    return null;
  }
};

const writeSavedListState = (state) => {
  try {
    sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패(사생활 보호 모드 등)는 무시: 복원만 생략됨
  }
};

const CommunityMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 모바일(≤768px) 여부: 모바일/데스크톱 UI 중 한쪽만 렌더
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 모바일 목록 복원 상태 (마운트 시 한 번만 읽음)
  const restoredListRef = useRef(undefined);
  if (restoredListRef.current === undefined) {
    restoredListRef.current = isMobile ? readSavedListState(location.key) : null;
  }
  const visibleCountRef = useRef(null); // FeedGrid 가 갱신하는 현재 노출 개수
  const listScrollRestoredRef = useRef(false);
  const [postsLoaded, setPostsLoaded] = useState(false); // 게시글 fetch 완료 여부

  // 모바일 관리 모드(?postId=..&modal=1) 상태
  const manageOpenedPostIdRef = useRef(null); // 같은 글을 한 번만 열기 위한 가드
  const manageExitedRef = useRef(false); // 복귀를 한 번만 실행하기 위한 가드
  const deletedPostIdRef = useRef(null); // deletePost API 가 성공한 게시글 id
  const [manageAttemptDone, setManageAttemptDone] = useState(false);

  const { posts, fetchPosts } = usePostStore();

  // authStore 현재 상태
  const authState = useAuthStore();

  const currentUser = authState.member ?? authState.user ?? null;

  const isLoggedIn = Boolean(authState.isAuthenticated && currentUser);

  // 로그인 유저 닉네임(없으면 게스트)
  const meNickname = currentUser?.memberName || "";

  // 로그인 요구 모달
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // "로그인 필요 행동" 공통 래퍼
  const requireLogin = useCallback(
    (action) => {
      if (!isLoggedIn) {
        setLoginModalOpen(true);
        return false;
      }
      action?.();
      return true;
    },
    [currentUser],
  );

  // 피드 최신순 인기순
  const COMMUNITY_SORT_OPTIONS = [
    { key: "latest", label: "최신순" },
    { key: "popular", label: "인기순" },
  ];

  // 게시글 fetch
  useEffect(() => {
    // 목록 복원이 "데이터 로딩 완료" 기준으로 동작하도록 완료 시점만 기록 (fetchPosts 호출/처리는 그대로)
    // (fetchPosts 는 스토어 내부에서 예외를 처리하므로 성공/실패와 관계없이 완료 시점에 true)
    Promise.resolve(fetchPosts()).finally(() => setPostsLoaded(true));
  }, [fetchPosts]);

  const normalizeFromStore = useCallback((raw) => {
    const nicknameRaw =
      raw?.member?.memberName ??
      raw?.author?.nickName ??
      raw?.nickName ??
      raw?.authorNickName ??
      "";

    return {
      id: raw?.id ?? 0,

      // 카드 상단 제목 = 요리명
      recipeName:
        raw?.postTitle ??
        raw?.recipeTitle ??
        raw?.recipeName ??
        raw?.recipe?.recipeTitle ??
        raw?.title ??
        "",
      nickname: String(nicknameRaw).trim() || "익명",
      level:
        raw?.member?.memberLevel ??
        raw?.member?.level ??
        raw?.author?.level ??
        raw?.level ??
        raw?.authorLevel ??
        1,
      images:
        Array.isArray(raw?.postImage) && raw.postImage.length > 0
          ? raw.postImage.map((img) => img.imageUrl).filter(Boolean)
          : Array.isArray(raw?.images) && raw.images.length > 0
            ? raw.images
            : raw?.imageUrl
              ? [raw.imageUrl]
              : [],
      likes: raw?.likes ?? raw?.likeCount ?? 0,
      liked: raw?.liked ?? false,
      content: raw?.postContent ?? raw?.content ?? raw?.desc ?? "",
      ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : [],

      postIngredientUsed: Array.isArray(raw?.postIngredientUsed)
        ? raw.postIngredientUsed
        : [],

      createdAt: raw?.createdAt ?? "",
      comments: Array.isArray(raw?.comment)
        ? raw.comment.map((c) => ({
            id: c.id,
            nickname: c.member?.memberName ?? "익명",
            time: c.createdAt ?? "",
            text: c.content ?? "",
            memberId: c.memberId,
          }))
        : [],
      memberXp:
        raw?.member?.memberXp ?? raw?.author?.memberXp ?? raw?.memberXp ?? 0,

      // 이 게시글에서 획득한 XP
      xp: raw?.postXp ?? raw?.xp ?? 0,
    };
  }, []);

  const [postImageMap, setPostImageMap] = useState({});

  useEffect(() => {
    if (!Array.isArray(posts) || posts.length === 0) return;

    const fetchPostImagesForCards = async () => {
      const entries = await Promise.all(
        posts.map(async (post) => {
          const postId = post?.id;
          if (!postId) return null;

          try {
            const images = await getPostImages(postId);

            const imageUrls = Array.isArray(images)
              ? images
                  .slice()
                  .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
                  .map((img) =>
                    typeof img === "string"
                      ? img
                      : (img.imageUrl ??
                        img.postImageUrl ??
                        img.url ??
                        img.image ??
                        img.imagePath ??
                        img.postImagePath),
                  )
                  .filter(Boolean)
              : [];

            return [postId, imageUrls];
          } catch (error) {
            console.error("카드 이미지 조회 실패:", postId, error);
            return [postId, []];
          }
        }),
      );

      const nextMap = Object.fromEntries(entries.filter(Boolean));
      setPostImageMap(nextMap);
    };

    fetchPostImagesForCards();
  }, [posts]);

  const allItems = useMemo(
    () =>
      (posts ?? []).map((raw) => {
        const item = normalizeFromStore(raw);
        const uploadedImages = postImageMap[item.id] ?? [];

        return {
          ...item,
          images:
            uploadedImages.length > 0 ? uploadedImages : (item.images ?? []),
        };
      }),
    [posts, normalizeFromStore, postImageMap],
  );

  const buildPostForModal = useCallback((item) => {
    return {
      id: item.id,
      images: item.images ?? [],
      author: {
        nickname: item.nickname ?? "익명",
        level: item.level ?? 1,
        xp: item.memberXp ?? 0,
      },
      likes: item.likes ?? 0,
      liked: item.liked ?? false,
      createdAt: item.createdAt ?? "",
      recipeTitle: item.recipeName ?? "",
      content: item.content ?? "",
      ingredients: item.ingredients ?? [],

      postIngredientUsed: item.postIngredientUsed ?? [],

      xp: item.xp ?? 0,
      comments: item.comments ?? [],
    };
  }, []);

  const [isOtherPostModalOpen, setIsOtherPostModalOpen] = useState(false);
  const [isMyPostModalOpen, setIsMyPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // 모바일 상세에서 돌아온 경우 저장된 검색어/정렬로 시작, 그 외에는 기존 초기값(latest)
  const [searchState, setSearchState] = useState(() => ({
    keyword: restoredListRef.current?.keyword ?? "",
    sort: restoredListRef.current?.sort ?? "latest",
  }));
  const isSearching = searchState.keyword.trim().length > 0;

  // 간단 텍스트 검색 (레시피명/본문/재료/닉네임)
  const matchesKeyword = useCallback((item, keyword) => {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;

    const usedIngredientNames = (item.postIngredientUsed ?? [])
      .map((used) => used?.ingredient?.ingredientName)
      .filter(Boolean);

    const hay = [
      item.recipeName,
      item.content,
      item.nickname,
      ...(item.ingredients ?? []),
      ...usedIngredientNames,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  }, []);

  const [likedMap, setLikedMap] = useState({});

  // 정렬 + 필터된 결과
  const displayItems = useMemo(() => {
    const merged = allItems.map((item) => {
      const likedState = likedMap[item.id];

      if (!likedState) return item;

      return {
        ...item,
        likes: likedState.likeCount,
        liked: likedState.liked,
      };
    });

    const filtered = merged.filter((it) =>
      matchesKeyword(it, searchState.keyword),
    );

    const sorted = [...filtered];

    if (searchState.sort === "popular") {
      sorted.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    } else {
      sorted.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }

    return sorted;
  }, [allItems, likedMap, matchesKeyword, searchState]);

  // 카드 클릭: 내 글이면 MyPostModal / 아니면 CommunityPostModal
  const handleOpenAnyPostModal = useCallback(
    async (item) => {
      console.log("🚨 handleOpenAnyPostModal 실행됨");
      console.log("🚨 클릭한 item:", item);
      console.log("🚨 클릭한 postId:", item.id);

      try {
        const detail = await getPostDetail(item.id);

        console.log("🔥 작성자 닉네임:", detail.member?.memberName);

        console.log("🔥 클릭한 카드 item:", item);
        console.log("🔥 상세 조회할 postId:", item.id);

        let imageList = [];

        try {
          console.log("🔥 detail.postImage:", detail.postImage);
          console.log("🔥 이미지 API 호출 직전 postId:", item.id);

          const postImages = await getPostImages(item.id);

          console.log("🔥 /postimage 응답:", postImages);

          const rawImages =
            Array.isArray(detail.postImage) && detail.postImage.length > 0
              ? detail.postImage
              : Array.isArray(postImages)
                ? postImages
                : [];

          console.log("🔥 최종으로 사용할 rawImages:", rawImages);

          imageList = rawImages
            .map((img) => {
              console.log("🔥 이미지 객체 확인:", img);

              return (
                img.imageUrl ??
                img.postImageUrl ??
                img.url ??
                img.image ??
                img.imagePath ??
                img.postImagePath
              );
            })
            .filter(Boolean);

          console.log("🔥 최종 imageList:", imageList);
        } catch (imageError) {
          console.error("🔥 게시글 이미지 조회 실패:", imageError);
        }

        const post = {
          id: detail.id,
          images: imageList,
          author: {
            nickname: detail.member?.memberName ?? "익명",
            level:
              detail.member?.memberLevel ??
              detail.member?.level ??
              detail.memberLevel ??
              detail.level ??
              1,

            xp: detail.member?.memberXp ?? detail.memberXp ?? 0,
          },
          likes: detail.likes ?? 0,
          liked: detail.liked ?? false,
          createdAt: detail.createdAt ?? "",
          recipeTitle: detail.postTitle ?? detail.recipe?.recipeTitle ?? "",
          content: detail.postContent ?? "",
          ingredients: detail.ingredients ?? [],
          postIngredientUsed: detail.postIngredientUsed ?? [],
          xp: detail.postXp ?? 0, // 게시글 획득 XP
          comments: detail.comment ?? [],
        };

        // 본인 판별: 작성자 고유 ID 우선, ID가 없으면 기존 닉네임 규칙으로 폴백
        const isMine = isMyPost({
          authorId: detail.member?.id ?? detail.memberId,
          authorNickname: post.author?.nickname,
          myId: currentUser?.id,
          myNickname: meNickname,
        });

        setSelectedPost(post);

        if (isMine) {
          requireLogin(() => {
            setIsMyPostModalOpen(true);
            setIsOtherPostModalOpen(false);
          });
          return;
        }

        setIsOtherPostModalOpen(true);
        setIsMyPostModalOpen(false);
      } catch (error) {
        console.error("게시글 상세 조회 실패:", error);

        if (error.status === 401) {
          setLoginModalOpen(true);
          return;
        }
        alert(error.message);
      }
    },
    [meNickname, requireLogin, currentUser?.id],
  );

  // 카드 클릭: 모바일은 상세 페이지로 이동(내 글 포함), 데스크톱은 기존 모달 그대로
  const handleOpenPost = useCallback(
    (item) => {
      if (!isMobile) {
        handleOpenAnyPostModal(item);
        return;
      }

      // 돌아왔을 때 검색어/정렬/스크롤/노출 개수를 복원하기 위해 이동 직전에 저장
      writeSavedListState({
        key: location.key,
        keyword: searchState.keyword,
        sort: searchState.sort,
        scrollY: window.scrollY,
        visibleCount: visibleCountRef.current,
      });

      navigate(`/community/posts/${item.id}`);
    },
    [isMobile, handleOpenAnyPostModal, location.key, searchState, navigate],
  );

  // 복원한 개수가 실제로 렌더된 뒤(데이터 로딩 완료 + 렌더 완료) 스크롤 위치 복원
  const handleListRestored = useCallback(() => {
    const saved = restoredListRef.current;
    if (!saved || listScrollRestoredRef.current) return;

    listScrollRestoredRef.current = true;
    requestAnimationFrame(() => window.scrollTo(0, saved.scrollY ?? 0));
  }, []);
  // const handleOpenAnyPostModal = useCallback(
  //   (item) => {
  //     const post = buildPostForModal(item);
  //     const isMine = !!meNickname && post.author?.nickname === meNickname;

  //     if (isMine) {
  //       requireLogin(() => {
  //         setSelectedPost(post);
  //         setIsMyPostModalOpen(true);
  //         setIsOtherPostModalOpen(false);
  //       });
  //       return;
  //     }

  //     setSelectedPost(post);
  //     setIsOtherPostModalOpen(true);
  //     setIsMyPostModalOpen(false);
  //   },
  //   [buildPostForModal, meNickname, requireLogin],
  // );

  const handleCloseModals = useCallback(() => {
    setIsOtherPostModalOpen(false);
    setIsMyPostModalOpen(false);
    setSelectedPost(null);

    // esc로 모달 닫으면 생기는 검은 테두리 제거
    requestAnimationFrame(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, []);

  // 쿼리스트링으로 모달 열기(postId) - 테스트용
  useEffect(() => {
    const postId = searchParams.get("postId");
    if (!postId) return;

    const idNum = Number(postId);
    if (!Number.isFinite(idNum)) return;

    const isManageMode = searchParams.get("modal") === "1";

    // 모바일: 일반 링크는 상세 페이지로 redirect(아래 <Navigate>)하므로 여기서 모달을 열지 않음
    if (isMobile && !isManageMode) return;

    const item = {
      id: idNum,
      recipeName: `레시피 ${idNum}`,
      nickname: idNum % 7 === 0 ? meNickname : "파스타러버",
      level: 4,
      likes: 80,
      images: [],
      content: "",
      ingredients: [],
      createdAt: "방금 전",
      comments: [],
    };

    // 모바일 관리 모드: 기존 모달(내 글 수정/삭제)을 열되, 같은 글은 한 번만 열기(재오픈 방지)
    if (isMobile && isManageMode) {
      if (manageOpenedPostIdRef.current === idNum) return;
      manageOpenedPostIdRef.current = idNum;

      Promise.resolve(handleOpenAnyPostModal(item)).finally(() =>
        setManageAttemptDone(true),
      );
      return;
    }

    handleOpenAnyPostModal(item);
  }, [searchParams, meNickname, handleOpenAnyPostModal, isMobile]);

  // 모바일 관리 모드: 모달이 닫히면(닫기/수정/삭제 완료/열기 실패) 한 번만 복귀
  useEffect(() => {
    const postId = Number(searchParams.get("postId"));
    const isManageMode =
      isMobile &&
      searchParams.get("modal") === "1" &&
      Number.isInteger(postId) &&
      postId > 0;

    if (!isManageMode || !manageAttemptDone || manageExitedRef.current) return;
    if (isOtherPostModalOpen || isMyPostModalOpen || loginModalOpen) return;

    manageExitedRef.current = true;

    // deletePost API 가 실제로 성공한 경우에만 목록으로 이동 (실패 시 모달은 닫히지 않으므로 이 지점에 오지 않음)
    if (deletedPostIdRef.current === postId) {
      navigate("/communitymain", { replace: true });
      return;
    }

    // 그 외(닫기/수정 완료/열기 실패): 상세 페이지로 복귀
    if (location.key === "default") {
      navigate(`/community/posts/${postId}`, { replace: true }); // 히스토리 없음(직접 접속/새로고침)
    } else {
      navigate(-1);
    }
  }, [
    searchParams,
    isMobile,
    manageAttemptDone,
    isOtherPostModalOpen,
    isMyPostModalOpen,
    loginModalOpen,
    location.key,
    navigate,
  ]);

  // ===== 댓글 등록 (로그인 필요) =====
  const handleSubmitComment = useCallback(
    async (text) => {
      const trimmed = String(text ?? "").trim();
      if (!trimmed || !selectedPost?.id) return;

      if (!currentUser) {
        setLoginModalOpen(true);
        return;
      }

      try {
        await createComment({
          postId: selectedPost.id,
          content: trimmed,
        });

        await fetchPosts();
        return true;
      } catch (error) {
        console.error("댓글 등록 실패:", error);
        alert(error.message);
        throw error;
      }
    },
    [selectedPost, currentUser, fetchPosts],
  );

  // ===== 댓글 수정  =====
  const handleEditComment = useCallback(
    async (comment, nextTextFromModal) => {
      const nextText =
        typeof nextTextFromModal === "string"
          ? nextTextFromModal
          : window.prompt("댓글을 수정하세요", comment?.content ?? "");

      if (nextText === null) return;

      const trimmed = String(nextText).trim();
      if (!trimmed || !comment?.id) return;

      if (!currentUser) {
        setLoginModalOpen(true);
        return;
      }

      try {
        await updateCommentApi(comment.id, trimmed);
        await fetchPosts();
        return true;
      } catch (error) {
        console.error("댓글 수정 실패:", error);
        alert(error.message);
        throw error;
      }
    },
    [currentUser, fetchPosts],
  );

  // 댓글 단일 삭제
  const handleDeleteComment = useCallback(
    async (comment) => {
      if (!comment?.id) return;

      if (!currentUser) {
        setLoginModalOpen(true);
        return;
      }

      try {
        await deleteCommentApi(comment.id);
        await fetchPosts();
        return true;
      } catch (error) {
        console.error("댓글 삭제 실패:", error);
        alert(error.message);
        throw error;
      }
    },
    [currentUser, fetchPosts],
  );

  // ===== 내 글 전용 액션들 =====
  // 실제 API 호출 + 목록 재조회
  // // 게시글 생성
  // const handleCreatePost = useCallback(
  //   (postData) => {
  //     requireLogin(async () => {
  //       try {
  //         await createPost(postData);
  //         await fetchPosts();
  //       } catch (error) {
  //         console.error("게시글 생성 실패:", error);
  //         alert(error.message);
  //       }
  //     });
  //   },
  //   [requireLogin, fetchPosts],
  // ); 이 함수는 글쓰는 페이지인 foodcomplete에서 사용하는 게 적합

  // 게시글 수정
  const handleEditPost = useCallback(
    (postId, patch) => {
      requireLogin(async () => {
        try {
          // MyPostModal에서 이미 postTitle, postContent, ingredientNames로 만들어서 넘기니까 그대로 보냄
          await updatePost(postId, patch);

          // 목록 최신화
          await fetchPosts();

          // 수정된 상세 데이터 다시 조회
          const detail = await getPostDetail(postId);

          // 이미지도 기존처럼 다시 조회
          let imageList = selectedPost?.images ?? [];

          try {
            const postImages = await getPostImages(postId);

            imageList = Array.isArray(postImages)
              ? postImages
                  .slice()
                  .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
                  .map((img) =>
                    typeof img === "string"
                      ? img
                      : (img.imageUrl ??
                        img.postImageUrl ??
                        img.url ??
                        img.image ??
                        img.imagePath ??
                        img.postImagePath),
                  )
                  .filter(Boolean)
              : imageList;
          } catch (imageError) {
            console.error("수정 후 이미지 재조회 실패:", imageError);
          }

          // 모달 즉시 최신 데이터로 갱신
          setSelectedPost((prev) => {
            if (!prev || prev.id !== postId) return prev;

            return {
              ...prev,
              images: imageList,
              recipeTitle:
                detail.postTitle ??
                detail.recipe?.recipeTitle ??
                prev.recipeTitle,
              content: detail.postContent ?? prev.content,
              postIngredientUsed: detail.postIngredientUsed ?? [],
              xp: detail.postXp ?? prev.xp,
              createdAt: detail.createdAt ?? prev.createdAt,
              likes: detail.likes ?? prev.likes,
              liked: detail.liked ?? prev.liked,
              comments: detail.comment ?? prev.comments,
              author: {
                nickname:
                  detail.member?.memberName ?? prev.author?.nickname ?? "익명",
                level:
                  detail.member?.memberLevel ??
                  detail.member?.level ??
                  detail.memberLevel ??
                  detail.level ??
                  prev.author?.level ??
                  1,
              },
            };
          });
        } catch (error) {
          console.error("게시글 수정 실패:", error);
          alert(error.message);
        }
      });
    },
    [requireLogin, fetchPosts, selectedPost?.images],
  );

  // 게시글 삭제

  const handleDeletePost = useCallback(
    (postId) => {
      requireLogin(async () => {
        try {
          const ok = window.confirm("게시글을 삭제할까요?");
          if (!ok) return;

          await deletePost(postId);
          deletedPostIdRef.current = postId; // 삭제 API 성공 기록 (모바일 관리 모드 복귀 판단용)
          await fetchPosts();
          handleCloseModals();
        } catch (error) {
          console.log("게시글 삭제 실패:", error);
          alert(error.message);
        }
      });
    },
    [requireLogin, handleCloseModals, fetchPosts],
  );

  // const handleEditPostImage = useCallback(
  //   (postId, index, fileOrUrl) => {
  //     requireLogin(() => {
  //       const nextUrl =
  //         typeof fileOrUrl === "string"
  //           ? fileOrUrl
  //           : URL.createObjectURL(fileOrUrl);

  //       setSelectedPost((prev) => {
  //         if (!prev || prev.id !== postId) return prev;
  //         const nextImages = [...(prev.images ?? [])];
  //         nextImages[index] = nextUrl;
  //         return { ...prev, images: nextImages };
  //       });
  //     });
  //   },
  //   [requireLogin],
  // );

  const handleEditPostImage = useCallback(
    async (postId, index, fileOrUrl) => {
      requireLogin(async () => {
        try {
          let nextImages = [];

          // 1. 여러 파일 배열이면 S3 다중 업로드
          // - MyPostModal에서 multiple 파일 선택 시 files 배열이 넘어옴
          // - 업로드 결과로 받은 S3 이미지 URL 배열을 DB 저장용 형태로 가공
          if (Array.isArray(fileOrUrl)) {
            const uploadResult = await createPostImageFiles(postId, fileOrUrl);
            const uploadedImages = uploadResult?.images ?? [];

            nextImages = uploadedImages
              .map((img, idx) => ({
                imageUrl:
                  img.imageUrl ??
                  img.postImageUrl ??
                  img.url ??
                  img.image ??
                  img.imagePath ??
                  img.postImagePath,
                imageOrder: img.imageOrder ?? idx,
              }))
              .filter((img) => img.imageUrl);
          }

          // 2. 단일 파일이면 S3 업로드 후 기존 이미지 배열의 해당 index만 교체
          // - 기존 단일 이미지 수정 흐름도 유지하기 위한 방어 코드
          // - createPostImageFiles에 배열 형태로 감싸서 넘김
          else if (fileOrUrl instanceof File) {
            const uploadResult = await createPostImageFiles(postId, [
              fileOrUrl,
            ]);
            const uploadedImage = uploadResult?.images?.[0];
            const uploadedUrl =
              uploadedImage?.imageUrl ??
              uploadedImage?.postImageUrl ??
              uploadedImage?.url ??
              uploadedImage?.image ??
              uploadedImage?.imagePath ??
              uploadedImage?.postImagePath;

            if (!uploadedUrl) {
              throw new Error("업로드된 이미지 URL이 없습니다.");
            }

            const prevImages = selectedPost?.images ?? [];
            const copiedImages = [...prevImages];

            copiedImages[index] = uploadedUrl;

            nextImages = copiedImages.map((imageUrl, idx) => ({
              imageUrl,
              imageOrder: idx,
            }));
          }

          // 3. URL 문자열이면 S3 업로드 없이 해당 index만 교체
          // - 이미 업로드된 URL을 넘겨받는 경우를 대비한 처리
          else {
            const uploadedUrl = fileOrUrl;

            if (!uploadedUrl) {
              throw new Error("업로드된 이미지 URL이 없습니다.");
            }

            const prevImages = selectedPost?.images ?? [];
            const copiedImages = [...prevImages];

            copiedImages[index] = uploadedUrl;

            nextImages = copiedImages.map((imageUrl, idx) => ({
              imageUrl,
              imageOrder: idx,
            }));
          }

          // 4. DB에는 게시글 이미지 전체 교체 API로 저장
          // - S3 업로드 API는 URL 생성/등록 역할
          // - 최종 이미지 목록은 replacePostImages로 정리
          await replacePostImages(postId, nextImages);

          // 5. 최신 이미지 다시 조회
          // - DB에 저장된 imageOrder 기준으로 정렬하기 위해 재조회
          const images = await getPostImages(postId);

          const imageList = Array.isArray(images)
            ? images
                .slice()
                .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
                .map((img) =>
                  typeof img === "string"
                    ? img
                    : (img.imageUrl ??
                      img.postImageUrl ??
                      img.url ??
                      img.image ??
                      img.imagePath ??
                      img.postImagePath),
                )
                .filter(Boolean)
            : [];

          // 6. 모달 즉시 반영
          // - 모달을 닫지 않아도 수정된 이미지가 바로 보이게 처리
          setSelectedPost((prev) => {
            if (!prev || prev.id !== postId) return prev;
            return { ...prev, images: imageList };
          });

          // 7. 카드 썸네일도 즉시 반영
          // - 피드 카드에서 첫 번째 이미지를 썸네일로 사용하므로 imageMap 갱신
          setPostImageMap((prev) => ({
            ...prev,
            [postId]: imageList,
          }));

          // 8. 게시글 목록 최신화
          await fetchPosts();
        } catch (error) {
          console.error("게시글 이미지 수정 실패:", error);
          alert(error.message);
        }
      });
    },
    [requireLogin, selectedPost?.images, fetchPosts],
  );

  // 게시글 댓글 전체 삭제
  const handleDeleteAllComments = useCallback(
    (postId) => {
      requireLogin(async () => {
        try {
          await deleteAllCommentsByPostIdApi(postId);
          await fetchPosts();
        } catch (error) {
          console.error("전체 댓글 삭제 실패:", error);
          alert(error.message);
        }
      });
    },
    [requireLogin, fetchPosts],
  );

  // 선택 댓글 삭제
  const handleDeleteSelectedComments = useCallback(
    async (postId, commentIds) => {
      if (!currentUser) {
        setLoginModalOpen(true);
        return;
      }

      if (!postId || !commentIds?.length) return;

      try {
        await deleteSelectedCommentsApi(commentIds);
        await fetchPosts();
        return true;
      } catch (error) {
        console.error("선택 댓글 삭제 실패:", error);
        alert(error.message);
        throw error;
      }
    },
    [currentUser, fetchPosts],
  );

  // 정렬 변경 핸들러(최신순/인기순)
  const handleSortChange = useCallback((key) => {
    setSearchState((prev) => ({
      ...prev,
      sort: key,
    }));
  }, []);

  // 빈화면일 때 버튼
  const handleEmptyAction = useCallback(() => {
    navigate("/foodrecommendation");
  }, [navigate]);

  // ===== 트렌딩 카드 클릭 =====
  const handleTrendingCardClick = useCallback(
    (item) => {
      handleOpenPost(item);
    },
    [handleOpenPost],
  );

  // ===== 좋아요 토글 =====
  const handleLikeToggle = useCallback(
    (postId, liked) => {
      console.log("handleToggleLike 진입", {
        postId,
        liked,
        likedMap,
        displayItems,
      });

      requireLogin(async () => {
        try {
          const targetItem = displayItems.find((post) => post.id === postId);

          const current = likedMap[postId] ?? {
            liked: liked ?? false,
            likeCount: targetItem?.likes ?? 0,
          };

          console.log("현재 좋아요 상태", current);

          if (current.liked) {
            console.log("DELETE 호출");
            await deletePostLike({ postId });
          } else {
            console.log("POST 호출");
            await createPostLike({ postId });
          }

          const nextLiked = !current.liked;
          const nextLikeCount = current.likeCount + (nextLiked ? 1 : -1);

          setLikedMap((prev) => ({
            ...prev,
            [postId]: {
              liked: nextLiked,
              likeCount: nextLikeCount,
            },
          }));

          setSelectedPost((prev) => {
            if (!prev || prev.id !== postId) return prev;
            return {
              ...prev,
              liked: nextLiked,
              likes: nextLikeCount,
            };
          });
        } catch (error) {
          console.error("좋아요 처리 실패:", error);
          alert(error.message);
        }
      });
    },
    [requireLogin, likedMap, displayItems],
  );

  // keyword 를 URL에서 읽어서 searchState에 동기화
  // useEffect(() => {
  //   const keywordFromUrl = searchParams.get("keyword") || "";
  //   const sortFromUrl = searchParams.get("sort") || "latest";

  //   setSearchState((prev) => {
  //     if (prev.keyword === keywordFromUrl && prev.sort === sortFromUrl) {
  //       return prev;
  //     }
  //     return {
  //       ...prev,
  //       keyword: keywordFromUrl,
  //       sort: sortFromUrl,
  //     };
  //   });
  // }, [searchParams]);

  // 모바일: /communitymain?postId=ID 링크는 상세 페이지로 redirect (관리 모드 modal=1 제외)
  // - replace 이므로 뒤로가기 시 이 링크가 히스토리에 남지 않음
  // - 상세 페이지의 데스크톱 redirect 목적지(/communitymain?postId=ID)에는 modal 이 없지만
  //   isMobile 이 false 이므로 서로 순환하지 않음
  const linkedPostId = Number(searchParams.get("postId"));
  const redirectToDetail =
    isMobile &&
    searchParams.get("modal") !== "1" &&
    Number.isInteger(linkedPostId) &&
    linkedPostId > 0;

  if (redirectToDetail) {
    return <Navigate to={`/community/posts/${linkedPostId}`} replace />;
  }

  return (
    <S.Page>
      {/* 모바일(≤768px)에서 공통 헤더/푸터 숨김 (이 페이지에서만 적용) */}
      <S.CommunityMobileLayoutStyle />

      <div id="community-top" />

      <S.Container $header>
        {isMobile ? (
          <CommunityMobileSearch
            keyword={searchState.keyword}
            onSearch={({ keyword }) => {
              setSearchState((prev) => ({
                ...prev,
                keyword,
              }));

              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onKeywordChange={(value) => {
              setSearchState((prev) => ({
                ...prev,
                keyword: value,
              }));
            }}
          />
        ) : (
          <CommunityHeader
            initialKeyword={searchState.keyword}
            keyword={searchState.keyword} // 모바일/데스크톱 전환 시 검색어 유지
            showSort={false}
            onSearch={({ keyword }) => {
              setSearchState((prev) => ({
                ...prev,
                keyword,
              }));

              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onKeywordChange={(value) => {
              setSearchState((prev) => ({
                ...prev,
                keyword: value,
              }));
            }}
          />
        )}
      </S.Container>

      <S.FullDivider />

      <S.Container>
        {!isSearching && displayItems.length > 0 && (
          <>
            <TrendingCarousel
              posts={displayItems}
              onCardClick={handleTrendingCardClick}
              meNickname={meNickname}
              onLikeToggle={handleLikeToggle}
            />

            <S.SectionDivider />
          </>
        )}

        {displayItems.length > 0 &&
          (isMobile ? (
            <S.MobileFeedHeader>
              <S.MobileSectionTitle>이웃들의 요리 이야기</S.MobileSectionTitle>
              <CommunityMobileSortTab
                options={COMMUNITY_SORT_OPTIONS}
                value={searchState.sort}
                onChange={handleSortChange}
              />
            </S.MobileFeedHeader>
          ) : (
            <S.FeedSortRow>
              <SortTab
                options={COMMUNITY_SORT_OPTIONS}
                value={searchState.sort}
                onChange={handleSortChange}
              />
            </S.FeedSortRow>
          ))}

        <FeedGrid
          items={displayItems}
          isSearching={isSearching}
          searchKeyword={searchState.keyword}
          onCardClick={handleOpenPost}
          meNickname={meNickname}
          onLikeToggle={handleLikeToggle}
          onEmptyAction={handleEmptyAction}
          mobileList
          restoreVisibleCount={restoredListRef.current?.visibleCount ?? undefined}
          restoreDataReady={postsLoaded}
          onRestored={handleListRestored}
          visibleCountRef={visibleCountRef}
        />
      </S.Container>

      <CommunityPostModal
        open={isOtherPostModalOpen}
        post={selectedPost}
        onClose={handleCloseModals}
        onClickDetail={(post) => console.log("자세히 보기", post)}
        meNickname={meNickname}
        onSubmitComment={handleSubmitComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onToggleLike={handleLikeToggle}
        requireLogin={requireLogin}
        isAuthenticated={isLoggedIn}
        loginModalOpen={loginModalOpen}
      />

      <MyPostModal
        open={isMyPostModalOpen}
        post={selectedPost}
        onClose={handleCloseModals}
        meNickname={meNickname}
        onSubmitComment={handleSubmitComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
        onEditPostImage={handleEditPostImage}
        onDeleteAllComments={handleDeleteAllComments}
        onDeleteSelectedComments={handleDeleteSelectedComments}
        onImageUpdated={fetchPosts}
        onToggleLike={handleLikeToggle}
      />

      {/* 모바일: 하단 고정 네비(68px) 위로 올려 겹침 방지 */}
      <FloatingActions
        targetId="community-top"
        mobileBottomOffset="calc(68px + env(safe-area-inset-bottom) + 16px)"
        mobileShowAfter={100}
      />

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
    </S.Page>
  );
};

export default CommunityMain;
