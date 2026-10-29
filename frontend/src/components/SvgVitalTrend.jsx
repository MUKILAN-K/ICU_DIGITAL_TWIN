import React, { useId } from 'react';

/**
 * High-Precision Clinical SVG Vital Trend Component
 * Renders lightweight, scalable vector waveform graphs and historical trend sparklines.
 * 
 * Supports:
 * - 'ecg': Medical electrocardiogram P-QRS-T complex pattern
 * - 'pleth': Photoplethysmogram pulsatile waveform (SpO2)
 * - 'trend': Historical numeric line trend with subtle area fill
 */
export default function SvgVitalTrend({
  type = 'trend',
  data = [],
  dataKey = 'value',
  color = '#14b8a6',
  status = 'safe',
  width = 110,
  height = 36,
  minVal,
  maxVal,
}) {
  const gradientId = useId();

  // If type is synthetic live ECG rhythm
  if (type === 'ecg') {
    const isAlert = status === 'alert';
    const isWarning = status === 'warning';

    // SVG path string representing clean clinical cardiac rhythm
    let pathD = 'M 0 18 Q 8 18 12 18 L 15 15 L 18 18 L 22 18 L 25 7 L 28 29 L 31 12 L 34 18 L 40 18 Q 44 14 48 18 L 56 18 Q 62 18 66 18 L 69 15 L 72 18 L 76 18 L 79 7 L 82 29 L 85 12 L 88 18 L 94 18 Q 98 14 102 18 L 110 18';

    if (isAlert) {
      // Rapid polymorphic tachycardia
      pathD = 'M 0 18 L 8 18 L 12 4 L 16 32 L 20 8 L 24 28 L 28 18 L 34 18 L 38 3 L 42 33 L 46 7 L 50 29 L 54 18 L 62 18 L 66 4 L 70 32 L 74 8 L 78 28 L 82 18 L 90 18 L 94 4 L 98 32 L 102 18 L 110 18';
    } else if (isWarning) {
      // Elevated baseline sinus rhythm
      pathD = 'M 0 18 L 10 18 L 14 14 L 17 18 L 20 6 L 24 30 L 27 10 L 30 18 L 38 18 L 48 18 L 52 14 L 55 18 L 58 6 L 62 30 L 65 10 L 68 18 L 76 18 L 86 18 L 90 14 L 93 18 L 96 6 L 100 30 L 103 10 L 106 18 L 110 18';
    }

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 110 36"
        fill="none"
        style={{ overflow: 'visible', flexShrink: 0 }}
      >
        <path
          d={pathD}
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="110" cy="18" r="2" fill={color} />
      </svg>
    );
  }

  // If type is photoplethysmogram (SpO2)
  if (type === 'pleth') {
    const plethPath =
      'M 0 24 Q 6 24 10 18 Q 14 8 18 6 Q 22 8 24 14 Q 26 18 28 16 Q 30 14 34 22 L 38 24 ' +
      'Q 44 24 48 18 Q 52 8 56 6 Q 60 8 62 14 Q 64 18 66 16 Q 68 14 72 22 L 76 24 ' +
      'Q 82 24 86 18 Q 90 8 94 6 Q 98 8 100 14 Q 102 18 104 16 Q 106 14 110 22';

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 110 36"
        fill="none"
        style={{ overflow: 'visible', flexShrink: 0 }}
      >
        <path
          d={plethPath}
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="110" cy="22" r="2" fill={color} />
      </svg>
    );
  }

  // Trend line from actual historical data
  if (!data || data.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          fontSize: '10px',
        }}
      >
        Acquiring...
      </div>
    );
  }

  const values = data.map((d) => (typeof d === 'number' ? d : d[dataKey] ?? 0));
  const autoMin = minVal !== undefined ? minVal : Math.min(...values);
  const autoMax = maxVal !== undefined ? maxVal : Math.max(...values);
  const span = autoMax - autoMin || 1;

  const paddingY = 4;
  const usableH = height - paddingY * 2;
  const stepX = width / (values.length - 1);

  const points = values.map((val, idx) => {
    const x = idx * stepX;
    // Invert Y so highest value is at top
    const normalized = (val - autoMin) / span;
    const y = height - paddingY - normalized * usableH;
    return { x, y };
  });

  const lineD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
  const lastPt = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Subtle Area Fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Crisp Metric Trend Line */}
      <path
        d={lineD}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current Value Head Dot */}
      {lastPt && <circle cx={lastPt.x} cy={lastPt.y} r="2.25" fill={color} />}
    </svg>
  );
}

