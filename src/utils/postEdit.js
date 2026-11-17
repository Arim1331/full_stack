// 모바일 게시글 수정 페이지용 순수 로직
// - MyPostModal 의 게시글 수정/이미지 수정과 동일한 규칙/순서/요청 형식을 사용
//   (모달은 수정하지 않으므로 같은 규칙이 이 파일에 한 번 더 존재함)
import {
  createPostImageFiles,
  deleteSelectedPostImages,
  getPostImages,
  replacePostImages,
} from "../api/postimage";

export const MAX_POST_IMAGES = 5;

export const IMAGE_MIN_MESSAGE = "이미지를 최소 1장 등록해주세요.";
export const IMAGE_MAX_MESSAGE = "이미지는 최대 5장까지 등록할 수 있습니다.";

// imageOrder 기준 정렬 (MyPostModal 과 동일)
export const sortPostImages = (images) =>
  [...(Array.isArray(images) ? images : [])].sort(
    (a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0),
  );

// 이미지 id 비교용 정규화 (숫자/문자열 혼용 방지)
export const normalizeImageId = (id) => String(id);

// 사용한 재료 → 콤마 구분 문자열 (MyPostModal 의 초기 draft 와 동일)
export const ingredientsToText = (postIngredientUsed) =>
  (postIngredientUsed ?? [])
    .map((item) => item?.ingredient?.ingredientName)
    .filter(Boolean)
    .join(", ");

// PUT /posts/:id 요청 body (MyPostModal.savePostEdit 과 동일)
export const buildPostPatch = ({ title, content, ingredientsText }) => ({
  postTitle: String(title ?? "").trim(),
  postContent: String(content ?? "").trim(),
  ingredientNames: String(ingredientsText ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});

// 이미지 개수 검증: 문제가 있으면 안내 문구, 없으면 null (MyPostModal 과 동일한 기준/문구)
export const validateImageCount = (totalCount) => {
  if (totalCount === 0) return IMAGE_MIN_MESSAGE;
  if (totalCount > MAX_POST_IMAGES) return IMAGE_MAX_MESSAGE;
  return null;
};

/**
 * 이미지 저장 단계별 오류 — 어느 단계에서 실패했는지에 따라 서버에 반영된 범위가 달라지므로
 * 호출부가 부분 저장 상태를 정확히 안내할 수 있도록 stage 를 함께 던짐
 * - validate : 요청 전 검증 실패(서버 변경 없음)
 * - upload   : 새 이미지 업로드 실패(기존 이미지 변경 없음, 일부 파일만 S3 에 올라갔을 수 있음)
 * - delete   : 업로드는 끝났지만 기존 이미지 삭제 실패(목록 교체 전)
 * - replace  : 삭제까지 끝났지만 최종 목록 교체 실패(삭제만 반영됐을 수 있음)
 */
export class PostImageSaveError extends Error {
  constructor(stage, message, cause) {
    super(message);
    this.name = "PostImageSaveError";
    this.stage = stage;
    this.cause = cause;
  }
}

/**
 * 이미지 수정 저장 (MyPostModal.handleSaveImageEdit 와 동일한 순서)
 * 1) 새 이미지 S3 업로드  2) 삭제 예정 기존 이미지 삭제
 * 3) 최종 목록을 imageOrder 0부터 다시 매겨 교체  4) 서버 최신 목록 재조회
 *
 * - existingImages: 화면에 남아 있는 기존 이미지(삭제 예정 제외). 방어적으로 deletedImageIds 도 한 번 더 걸러냄(id 는 문자열로 비교)
 * - 어떤 서버 요청보다 먼저 최종 개수(최소 1 / 최대 5)를 검증함
 * - 3단계(replace)까지 성공하면 "저장 완료"이며, 4단계 재조회만 실패하면 예외 대신
 *   { images: null, refreshFailed: true } 를 반환해 저장 실패와 구분함
 * - 반환: { images: 서버 최신 목록(imageOrder 정렬) | null, refreshFailed }
 */
export const saveEditedPostImages = async ({
  postId,
  existingImages,
  deletedImageIds,
  newFiles,
}) => {
  const deletedSet = new Set(deletedImageIds.map(normalizeImageId));
  const keptImages = existingImages.filter(
    (image) => !deletedSet.has(normalizeImageId(image.id)),
  );

  // 1. 서버 변경 전 검증
  const validationMessage = validateImageCount(
    keptImages.length + newFiles.length,
  );
  if (validationMessage) {
    throw new PostImageSaveError("validate", validationMessage);
  }

  // 2. 새 이미지 업로드
  let uploadedImages = [];

  if (newFiles.length > 0) {
    try {
      const result = await createPostImageFiles(postId, newFiles);
      // 기존 호출부(MyPostModal, CommunityMain)와 동일하게 result.images 의 imageUrl 사용
      uploadedImages = (result?.images ?? []).filter((image) => image?.imageUrl);
    } catch (error) {
      throw new PostImageSaveError("upload", error.message, error);
    }

    // 업로드 결과가 선택한 파일 수와 다르면 이후 단계(삭제/교체)로 넘어가지 않음
    // (일부 이미지가 조용히 사라지는 것을 방지)
    if (uploadedImages.length !== newFiles.length) {
      throw new PostImageSaveError(
        "upload",
        "업로드된 이미지 정보를 확인할 수 없습니다.",
      );
    }
  }

  // 3. 삭제 예정 기존 이미지 삭제
  if (deletedImageIds.length > 0) {
    try {
      await deleteSelectedPostImages(deletedImageIds);
    } catch (error) {
      throw new PostImageSaveError("delete", error.message, error);
    }
  }

  // 4. 최종 이미지 목록(남은 기존 + 새 이미지)으로 교체, imageOrder 는 0부터 재부여
  //    삭제한 이미지는 keptImages 에서 이미 제외되어 최종 목록에 다시 들어가지 않음
  const finalImages = [...keptImages, ...uploadedImages].map(
    (image, index) => ({
      imageUrl: image.imageUrl,
      imageOrder: index,
    }),
  );

  try {
    await replacePostImages(postId, finalImages);
  } catch (error) {
    throw new PostImageSaveError("replace", error.message, error);
  }

  // 5. 서버 최신 목록 재조회 — 여기까지 왔다면 저장은 이미 성공한 상태
  try {
    return {
      images: sortPostImages(await getPostImages(postId)),
      refreshFailed: false,
    };
  } catch (error) {
    console.error("이미지 저장 후 목록 재조회 실패(저장은 완료됨):", error);
    return { images: null, refreshFailed: true };
  }
};
