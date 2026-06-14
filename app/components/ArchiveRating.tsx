type ArchiveRatingProps = {
  rating?: number | null;
  className?: string;
};

export default function ArchiveRating({
  rating,
  className = "text-white",
}: ArchiveRatingProps) {
  if (
    rating === undefined ||
    rating === null ||
    !Number.isFinite(rating) ||
    rating <= 0
  ) {
    return null;
  }

  return <span className={className}>{rating}/10</span>;
}
