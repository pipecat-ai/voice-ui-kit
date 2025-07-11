import React, { useEffect, useState } from "react";

interface ThinkingProps {
  "aria-label"?: string;
  className?: string;
  initialDots?: number;
  interval?: number;
  maxDots?: number;
}

export const Thinking: React.FC<ThinkingProps> = ({
  "aria-label": ariaLabel = "Loading",
  className = "",
  initialDots = 1,
  interval = 500,
  maxDots = 3,
}) => {
  const [dots, setDots] = useState(initialDots);

  useEffect(() => {
    const i = setInterval(() => {
      setDots((prevDots) => (prevDots % maxDots) + 1);
    }, interval);

    return () => clearInterval(i);
  }, [interval, maxDots]);

  const renderDots = () => {
    return ".".repeat(dots);
  };

  return (
    <span className={className} aria-label={ariaLabel}>
      {renderDots()}
    </span>
  );
};

export default Thinking;
