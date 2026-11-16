import Image, { type ImageProps } from "next/image";
import { LOGO_BLURHASH_DATA_URL } from "@/lib/blurhash";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  /** Use blurhash-derived placeholder (default true for raster). */
  withBlur?: boolean;
};

/**
 * next/image wrapper with a fixed blurhash placeholder for optimized assets.
 */
export function OptimizedImage({
  className,
  withBlur = true,
  alt,
  ...rest
}: Props) {
  const isSvg =
    typeof rest.src === "string" && rest.src.toLowerCase().endsWith(".svg");

  return (
    <Image
      alt={alt}
      className={cn(className)}
      placeholder={withBlur && !isSvg ? "blur" : undefined}
      blurDataURL={withBlur && !isSvg ? LOGO_BLURHASH_DATA_URL : undefined}
      {...rest}
    />
  );
}
