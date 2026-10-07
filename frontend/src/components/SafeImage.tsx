"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='#EBEBEB'/></svg>`,
  );

/**
 * next/image with graceful degradation:
 *   1. optimized (default)
 *   2. on error → retry the raw URL unoptimized (recovers transient optimizer failures)
 *   3. on second error → a neutral placeholder (handles genuinely broken images)
 */
export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [stage, setStage] = useState(0);
  const resolvedSrc = stage >= 2 ? PLACEHOLDER : src;
  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      unoptimized={stage >= 1}
      onError={() => setStage((s) => Math.min(s + 1, 2))}
    />
  );
}
