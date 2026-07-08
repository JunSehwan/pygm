import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const loadedSrcCache = new Set();

export default function ImageWithSkeleton({
  src,
  alt,
  fallbackSrc = "",
  className = "",
  imageClassName = "",
  ...props
}) {
  const previousSrcRef = useRef(src || "");
  const [imgSrc, setImgSrc] = useState(src || "");
  const [isLoading, setIsLoading] = useState(() => {
    return !!src && !loadedSrcCache.has(src);
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextSrc = src || "";
    const previousSrc = previousSrcRef.current;

    previousSrcRef.current = nextSrc;
    setImgSrc(nextSrc);
    setHasError(false);

    if (!nextSrc) {
      setIsLoading(false);
      return;
    }

    if (loadedSrcCache.has(nextSrc)) {
      setIsLoading(false);
      return;
    }

    if (nextSrc !== previousSrc) {
      setIsLoading(true);
    }
  }, [src]);

  const shouldShowImage = useMemo(() => {
    return !!imgSrc && (!hasError || !!fallbackSrc);
  }, [imgSrc, hasError, fallbackSrc]);

  const handleLoad = () => {
    if (imgSrc) loadedSrcCache.add(imgSrc);
    setIsLoading(false);
  };

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setIsLoading(!loadedSrcCache.has(fallbackSrc));
      setHasError(false);
      return;
    }

    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {shouldShowImage ? (
        <Image
          src={imgSrc}
          alt={alt}
          className={`${imageClassName} transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"
            }`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-200" />
      )}

      {shouldShowImage && isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      ) : null}
    </div>
  );
}