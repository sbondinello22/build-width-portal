import { useState } from "react";

export interface BarChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarChartDatum {
  label: string;
  values: Record<string, number>;
}

const TOP_PAD = 68;

export function BarChart({
  data,
  series,
  height = 220,
  valueFormatter = (n: number) => n.toLocaleString(),
}: {
  data: BarChartDatum[];
  series: BarChartSeries[];
  height?: number;
  valueFormatter?: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
  const max = Math.max(1, ...totals);

  const width = Math.max(360, data.length * 56);
  const chartHeight = height;
  const axisY = TOP_PAD + chartHeight;
  const barSlot = width / Math.max(1, data.length);
  const barWidth = Math.max(8, barSlot * 0.55);
  const tooltipHeight = series.length > 1 ? 20 + series.length * 16 : 36;

  return (
    <div className="w-full">
      {series.length > 1 && (
        <div className="mb-3 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={axisY + 32}
          viewBox={`0 0 ${width} ${axisY + 32}`}
          className="min-w-full"
        >
          <line x1={0} y1={axisY} x2={width} y2={axisY} stroke="var(--chart-axis)" strokeWidth={1} />
          {data.map((d, i) => {
            const x = i * barSlot + (barSlot - barWidth) / 2;
            let yCursor = axisY;
            const segments = series.map((s) => {
              const value = d.values[s.key] ?? 0;
              const segHeight = max > 0 ? (value / max) * (chartHeight - 12) : 0;
              const y = yCursor - segHeight;
              yCursor -= segHeight + (segHeight > 0 ? 2 : 0);
              return { key: s.key, color: s.color, value, y, height: segHeight };
            });
            const total = totals[i];
            const isHover = hover === i;
            const topSegmentY = segments[segments.length - 1]?.y ?? axisY;
            const tooltipY = Math.max(4, topSegmentY - tooltipHeight - 8);
            const tooltipX = Math.min(Math.max(x - 40, 4), width - 144);

            return (
              <g
                key={d.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "default" }}
              >
                <rect x={x} y={TOP_PAD} width={barWidth} height={chartHeight} fill="transparent" />
                {segments.map((seg, si) =>
                  seg.height > 0 ? (
                    <rect
                      key={seg.key}
                      x={x}
                      y={seg.y}
                      width={barWidth}
                      height={seg.height}
                      rx={si === segments.length - 1 ? 3 : 0}
                      fill={seg.color}
                      opacity={isHover ? 1 : 0.9}
                    />
                  ) : null
                )}
                <text x={x + barWidth / 2} y={axisY + 18} textAnchor="middle" fontSize={11} fill="var(--chart-muted)">
                  {d.label}
                </text>
                {isHover && (
                  <g>
                    <rect x={tooltipX} y={tooltipY} width={140} height={tooltipHeight} rx={6} fill="var(--chart-tooltip-bg)" />
                    <text x={tooltipX + 8} y={tooltipY + 16} fontSize={11} fontWeight={600} fill="#ffffff">
                      {d.label}: {valueFormatter(total)}
                    </text>
                    {series.length > 1 &&
                      segments.map((seg, si) => (
                        <text
                          key={seg.key}
                          x={tooltipX + 8}
                          y={tooltipY + 16 + (si + 1) * 16}
                          fontSize={10}
                          fill="var(--chart-tooltip-text-secondary)"
                        >
                          {series[si].label}: {valueFormatter(seg.value)}
                        </text>
                      ))}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {data.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-muted)]">No data yet.</p>}
    </div>
  );
}
