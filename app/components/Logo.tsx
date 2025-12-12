interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Circle */}
          <circle
            cx="50"
            cy="50"
            r="30"
            className="fill-blue-600 dark:fill-blue-500"
          />

          {/* Playing Cards Stack - Centered */}
          <g transform="translate(50, 50)">
            {/* Back Card */}
            <rect
              x="-12"
              y="-16"
              width="24"
              height="32"
              rx="2"
              className="fill-white dark:fill-gray-100"
              transform="rotate(-15)"
              opacity="0.7"
            />

            {/* Middle Card */}
            <rect
              x="-12"
              y="-16"
              width="24"
              height="32"
              rx="2"
              className="fill-white dark:fill-gray-50"
              transform="rotate(-5)"
              opacity="0.85"
            />

            {/* Front Card with Number */}
            <rect
              x="-12"
              y="-16"
              width="24"
              height="32"
              rx="2"
              className="fill-white stroke-blue-200 dark:stroke-blue-300"
              strokeWidth="0.5"
              transform="rotate(5)"
            />

            {/* Number "8" on Front Card */}
            <text
              x="0"
              y="4"
              className="fill-blue-600 dark:fill-blue-500 font-bold"
              fontSize="18"
              textAnchor="middle"
              transform="rotate(5)"
            >
              8
            </text>
          </g>
        </svg>
      </div>

      {/* App Name */}
      {showText && (
        <div className="flex flex-col items-center">
          <span className={`${textSizeClasses[size]} font-bold text-gray-900 dark:text-white leading-none`}>
            Scrum Poker
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            
          </span>
        </div>
      )}
    </div>
  );
}
