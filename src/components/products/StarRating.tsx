import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRate,
  showCount = false,
  count = 0,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.floor(rating);
          const isHalf = !isFilled && starValue <= rating + 0.5 && starValue > Math.floor(rating);

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(starValue)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} p-0 border-0 bg-transparent`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  isFilled
                    ? 'text-astro-500 fill-astro-500'
                    : isHalf
                    ? 'text-astro-500 fill-astro-500/50'
                    : 'text-dark-600'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showCount && count > 0 && (
        <span className={`text-dark-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({count})
        </span>
      )}
      {showCount && rating > 0 && (
        <span className={`text-dark-300 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
