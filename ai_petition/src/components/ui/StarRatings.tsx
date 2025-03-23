import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  setRating, 
  size = 24, 
  readOnly = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index: number) => {
    if (!readOnly && setRating) {
      setRating(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "transition-all duration-200", 
            (hoverRating >= index || (!hoverRating && rating >= index))
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-gray-300 dark:text-gray-600",
            !readOnly && "cursor-pointer hover:scale-110"
          )}
        />
      ))}
    </div>
  );
};

export default StarRating;