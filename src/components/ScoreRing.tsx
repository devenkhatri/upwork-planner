'use client';

interface ScoreRingProps {
  score: number; // 0–10
  size?: number;
  isApply: boolean;
}

export default function ScoreRing({ score, size = 60, isApply }: ScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference * (1 - pct);
  const cx = size / 2;
  const cy = size / 2;
  const uniqueId = `grad-${size}-${isApply ? 'a' : 's'}`;

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg
        className="score-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
            {isApply ? (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          className="score-ring-bg"
          cx={cx}
          cy={cy}
          r={radius}
        />
        <circle
          className="score-ring-progress"
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#${uniqueId})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-text">
        <span className="score-value">{score.toFixed(1)}</span>
        <span className="score-label">Score</span>
      </div>
    </div>
  );
}
