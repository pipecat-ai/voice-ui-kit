import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <svg
          width="22"
          height="22"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="rounded-xs dark:invert"
        >
          <rect width="600" height="600" fill="black" />
          <path d="M0 190H245V275H0V190Z" fill="white" />
          <path d="M0 360H245V445H0V360Z" fill="white" />
          <path
            d="M498 220.5C498 262.197 464.197 296 422.5 296C380.803 296 347 262.197 347 220.5C347 178.803 380.803 145 422.5 145C464.197 145 498 178.803 498 220.5Z"
            fill="white"
          />
        </svg>
        <span className="font-semibold">Voice UI Kit</span>
      </>
    ),
  },
};
