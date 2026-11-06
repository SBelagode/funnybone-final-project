type Top100CaptionImageProps = {
  src: string;
  srcSet?: string;
  captionId: string;
};

const RESPONSIVE_SIZES =
  "(max-width: 640px) 320px, (max-width: 768px) 320px, 320px";

export function Top100CaptionImage({
  src,
  srcSet,
  captionId,
}: Top100CaptionImageProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-gray-200 dark:bg-neutral-900"
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={RESPONSIVE_SIZES}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-125
                   select-none object-cover opacity-70 blur-2xl saturate-125
                   dark:opacity-60"
        loading="lazy"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-white/10 dark:bg-black/10"
        aria-hidden="true"
      />
      <img
        src={src}
        srcSet={srcSet}
        sizes={RESPONSIVE_SIZES}
        alt={`Caption Image ${captionId}`}
        className="absolute inset-0 z-10 h-full w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}
