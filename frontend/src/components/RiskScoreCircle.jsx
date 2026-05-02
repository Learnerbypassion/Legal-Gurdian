export default function RiskScoreCircle({ score = 0, label = 'Unknown' }) {
  // Calculate percentage (score out of 10)
  const percentage = (score / 10) * 100;

  // Determine color based on score
  let color = '#10b981'; // green
  let strokeColor = '#34d399'; // light green
  if (score >= 5) {
    color = '#ef4444'; // red
    strokeColor = '#fca5a5'; // light red
  } else if (score >= 3) {
    color = '#f59e0b'; // yellow/amber
    strokeColor = '#fbbf24'; // light yellow
  }

  // SVG circle properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Text color based on score
  const textColor = score >= 5 ? 'text-red-600' : score >= 3 ? 'text-yellow-600' : 'text-green-600';
  const labelColor = score >= 5 ? 'text-red-600' : score >= 3 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Background Circle */}
        <svg width="160" height="160" className="absolute">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '80px 80px',
            }}
          />
        </svg>

        {/* Score Text */}
        <div className="text-center z-10">
          <p className={`text-5xl font-bold ${textColor}`}>{score.toFixed(1)}</p>
          <p className="text-sm text-gray-500">/10</p>
        </div>
      </div>

      {/* Label */}
      <h3 className="text-xl font-bold text-gray-900 mt-4">Risk Score</h3>
      <p className={`text-lg font-semibold ${labelColor}`}>{label}</p>

      {/* Percentage */}
      <p className="text-sm text-gray-500 mt-2">{percentage.toFixed(0)}% Risk</p>
    </div>
  );
}
