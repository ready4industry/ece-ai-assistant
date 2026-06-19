'use client';

import { useState } from 'react';

interface StarRatingProps {
  onRate: (stars: number) => void;
}

export function StarRating({ onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5" role="group" aria-label="Rate this response">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className={`text-lg transition-transform hover:scale-110 ${
            star <= hover ? 'text-yellow-400' : 'text-on-surface-variant/30'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
