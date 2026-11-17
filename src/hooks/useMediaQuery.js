import { useEffect, useState } from "react";

const getMatches = (query) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

/**
 * matchMedia 결과를 반환 (초기값을 동기적으로 읽어 첫 렌더부터 정확)
 * 예: const isMobile = useMediaQuery("(max-width: 768px)");
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const mql = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);

    setMatches(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
