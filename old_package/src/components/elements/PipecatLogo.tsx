import React from "react";

interface PipecatLogoProps {
  alt?: string;
  className?: string;
  color?: string;
  height?: number;
  width?: number;
}

const aspectRatio = 45 / 26;

export const PipecatLogo: React.FC<PipecatLogoProps> = ({
  className = "",
  alt = "Pipecat Logo",
  color = "currentColor",
  height,
  width,
}) => {
  const resolvedHeight = height
    ? height
    : width
      ? Math.round(width / aspectRatio)
      : 100;
  const resolvedWidth = width
    ? width
    : height
      ? Math.round(height * aspectRatio)
      : 200;

  return (
    <svg
      width={resolvedWidth}
      height={resolvedHeight}
      viewBox="0 0 45 26"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
    >
      <path
        d="M6.19825 0.104287C6.83144 -0.13411 7.5461 0.044779 7.99232 0.553371L13.8037 7.17714H31.1545L36.9659 0.553371C37.4121 0.044779 38.1268 -0.13411 38.76 0.104287C39.3932 0.342685 39.8124 0.948477 39.8124 1.62507V16.25H44.9582V19.5H36.5624V5.94116L33.112 9.87383C32.8035 10.2255 32.3584 10.4271 31.8905 10.4271H13.0677C12.5998 10.4271 12.1547 10.2255 11.8462 9.87383L8.39581 5.94116V19.5H0V16.25H5.14582V1.62507C5.14582 0.948477 5.56505 0.342685 6.19825 0.104287Z"
        fill={color}
      />
      <path d="M36.5624 22.75H44.9582V26H36.5624V22.75Z" fill={color} />
      <path d="M0 22.75H8.39581V26H0V22.75Z" fill={color} />
      <path
        d="M17.3333 17.3334C17.3333 18.53 16.3632 19.5 15.1666 19.5C13.97 19.5 13 18.53 13 17.3334C13 16.1367 13.97 15.1667 15.1666 15.1667C16.3632 15.1667 17.3333 16.1367 17.3333 17.3334Z"
        fill={color}
      />
      <path
        d="M31.9582 17.3334C31.9582 18.53 30.9882 19.5 29.7916 19.5C28.595 19.5 27.6249 18.53 27.6249 17.3334C27.6249 16.1367 28.595 15.1667 29.7916 15.1667C30.9882 15.1667 31.9582 16.1367 31.9582 17.3334Z"
        fill={color}
      />
    </svg>
  );
};

export default PipecatLogo;
