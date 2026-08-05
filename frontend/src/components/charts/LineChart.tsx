import { useState } from "react";

export interface LineChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface LineChartDatum {
  label: string;
  values: Record<string, number>;
}

const TOP_PAD = 40;
const LEFT_PAD = 64;
const LEFT_PAD_WITH_AXIS_LABEL = 78;
const Y_TICK_COUNT = 4;

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export function LineChart({
  data,
  series,
  height = 220,
  valueFormatter = (n: number) => n.toLocaleString(),
  axisLabel,
}: {
  data: LineChartDatum[];
  series: LineChartSeries[];
  height?: number;
  valueFormatter?: (n: number) => string;
  axisLabel?: string;
}) {
  const [hover, setHover] = useState<{ i: number; si: number } | null>(null);

  const allValues = data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0));
  const rawMax = Math.max(1, ...allValues);
  const step = niceStep(rawMax / Y_TICK_COUNT);
  const max = step * Y_TICK_COUNT;
  const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) => i * step);

  const leftPad = axisLabel ? LEFT_PAD_WITH_AXIS_LABEL : LEFT_PAD;
  const plotWidth = Math.max(320, data.length * 56);
  const width = plotWidth + leftPad;
  const chartHeight = height;
  const axisY = TOP_PAD + chartHeight;
  const colSlot = plotWidth / Math.max(1, data.length - 1 || 1);
  const tooltipHeight = 30;

  function pointX(i: number) {
    return data.length === 1 ? leftPad + plotWidth / 2 : leftPad + i * colSlot;
  }
  function seriesOffset(si: number) {
    return series.length > 1 ? (si - (series.length - 1) / 2) * 4 : 0;
  }
  function pointY(value: number, si: number) {
    return axisY - (value / max) * (chartHeight - 12) + seriesOffset(si);
  }

  return (
    <div className="w-full">
      {series.length > 1 && (
        <div className="mb-3 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <svg width={width} height={axisY + 32} viewBox={`0 0 ${width} ${axisY + 32}`} className="min-w-full">
          {yTicks.map((tick) => {
            const y = axisY - (tick / max) * (chartHeight - 12);
            return (
              <g key={tick}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="var(--chart-axis)"
                  strokeWidth={1}
                  opacity={tick === 0 ? 0 : 0.35}
                  strokeDasharray={tick === 0 ? undefined : "3 3"}
                />
                <text x={leftPad - 8} y={y + 3} textAnchor="end" fontSize={10} fill="var(--chart-muted)">
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}
          {axisLabel && (
            <text x={-(axisY / 2)} y={12} textAnchor="middle" fontSize={10} fill="var(--chart-muted)" transform="rotate(-90)">
              {axisLabel}
            </text>
          )}
          <line x1={leftPad} y1={axisY} x2={width} y2={axisY} stroke="var(--chart-axis)" strokeWidth={1} />

          {series.map((s, si) => {
            const points = data.map((d, i) => `${pointX(i)},${pointY(d.values[s.key] ?? 0, si)}`).join(" ");
            return <polyline key={s.key} points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
          })}

          {data.map((d, i) => (
            <text key={d.label} x={pointX(i)} y={axisY + 18} textAnchor="middle" fontSize={11} fill="var(--chart-muted)">
              {d.label}
            </text>
          ))}

          {data.map((d, i) =>
            series.map((s, si) => {
              const x = pointX(i);
              const y = pointY(d.values[s.key] ?? 0, si);
              const isHover = hover?.i === i && hover?.si === si;
              const tooltipText = `${d.label} · ${s.label}: ${valueFormatter(d.values[s.key] ?? 0)}`;
              const tooltipWidth = Math.min(260, Math.max(90, tooltipText.length * 5.6 + 16));
              const tooltipX = Math.min(Math.max(x - tooltipWidth / 2, leftPad + 2), width - tooltipWidth - 2);
              const tooltipY = Math.max(2, y - tooltipHeight - 8);

              return (
                <g
                  key={`${d.label}-${s.key}`}
                  onMouseEnter={() => setHover({ i, si })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "default" }}
                >
                  <circle cx={x} cy={y} r={9} fill="transparent" />
                  <circle cx={x} cy={y} r={isHover ? 5 : 3} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />
                  {isHover && (
                    <g>
                      <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={6} fill="var(--chart-tooltip-bg)" />
                      <text x={tooltipX + tooltipWidth / 2} y={tooltipY + 19} textAnchor="middle" fontSize={11} fontWeight={600} fill="#ffffff">
                        {tooltipText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
      {data.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-muted)]">No data yet.</p>}
    </div>
  );
}
