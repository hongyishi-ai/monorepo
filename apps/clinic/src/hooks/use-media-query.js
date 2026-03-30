// src/hooks/use-media-query.js

import { useState, useEffect } from "react";

/**
 * 自定义 Hook，用于根据媒体查询检测视口是否匹配。
 *
 * @param {string} query - 媒体查询字符串，例如 "(min-width: 768px)"
 * @returns {boolean} - 当前视口是否匹配媒体查询
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};