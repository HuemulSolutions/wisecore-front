import { useMemo } from "react"
import { useTheme } from "next-themes"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export type HuemulAreaChartColor = "blue" | "violet" | "emerald" | "orange"

// Paleta secuencial validada (ver ia context/dataviz palette): un hue por color,
// paso claro para light y paso oscuro para dark — nunca el mismo hex en ambos.
const COLOR_HEX: Record<HuemulAreaChartColor, { light: string; dark: string }> = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  violet: { light: "#4a3aa7", dark: "#9085e9" },
  emerald: { light: "#1baf7a", dark: "#199e70" },
  orange: { light: "#eb6834", dark: "#d95926" },
}

const GRID_COLOR = { light: "#e1e0d9", dark: "#2c2c2a" }
const AXIS_COLOR = { light: "#898781", dark: "#898781" }
const TOOLTIP_BG = { light: "#fcfcfb", dark: "#1a1a19" }
const TOOLTIP_BORDER = { light: "rgba(11,11,11,0.10)", dark: "rgba(255,255,255,0.10)" }
const TOOLTIP_TEXT = { light: "#0b0b0b", dark: "#ffffff" }

export interface HuemulAreaChartPoint {
  label: string
  value: number
}

export interface HuemulAreaChartProps {
  data: HuemulAreaChartPoint[]
  color?: HuemulAreaChartColor
  valueFormatter?: (value: number) => string
  loading?: boolean
  emptyMessage?: string
  height?: number
  className?: string
}

/**
 * `HuemulAreaChart` — serie única de área/línea (sin leyenda: un solo color no
 * la necesita — ver `ia context` guía de dataviz). Crosshair + tooltip on hover.
 *
 * @example
 * ```tsx
 * <HuemulAreaChart data={points} color="violet" valueFormatter={formatTokens} />
 * ```
 */
export function HuemulAreaChart({
  data,
  color = "blue",
  valueFormatter = (v) => String(v),
  loading = false,
  emptyMessage,
  height = 220,
  className,
}: HuemulAreaChartProps) {
  const { t } = useTranslation("common")
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme === "dark" ? "dark" : "light"

  const seriesColor = COLOR_HEX[color][mode]
  const gridColor = GRID_COLOR[mode]
  const axisColor = AXIS_COLOR[mode]
  const tooltipBg = TOOLTIP_BG[mode]
  const tooltipBorder = TOOLTIP_BORDER[mode]
  const tooltipText = TOOLTIP_TEXT[mode]
  const gradientId = useMemo(() => `huemul-area-${color}-${Math.round(Math.random() * 1e6)}`, [color])

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg border border-border bg-card animate-pulse", className)} style={{ height }}>
        <span className="text-xs text-muted-foreground">{t("loading")}</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg border border-border bg-card", className)} style={{ height }}>
        <span className="text-xs text-muted-foreground">{emptyMessage ?? t("noResults")}</span>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={seriesColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridColor} strokeWidth={1} />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: axisColor }}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 11 }}
            tickFormatter={valueFormatter}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: axisColor, strokeDasharray: "3 3" }}
            formatter={(value) => [valueFormatter(Number(value)), ""]}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: tooltipText,
            }}
            labelStyle={{ color: tooltipText, fontWeight: 600 }}
            itemStyle={{ color: tooltipText }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={seriesColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, fill: seriesColor, stroke: tooltipBg, strokeWidth: 2 }}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
