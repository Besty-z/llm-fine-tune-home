<template>
  <!-- 轻量 SVG 折线图：无需额外图表库，适配暗色主题，用于 loss / 学习率曲线 -->
  <div class="metric-chart" :style="{ height: `${height}px` }">
    <svg v-if="points.length" :viewBox="`0 0 ${WIDTH} ${height}`" preserveAspectRatio="none">
      <!-- 水平网格线与刻度 -->
      <g class="grid">
        <line
          v-for="(tick, idx) in yTicks"
          :key="`grid-${idx}`"
          :x1="PADDING.left"
          :x2="WIDTH - PADDING.right"
          :y1="tick.y"
          :y2="tick.y"
        />
      </g>
      <!-- 面积填充 -->
      <polygon class="area" :points="areaPoints" :fill="color" />
      <!-- 折线 -->
      <polyline class="line" :points="linePoints" :stroke="color" />
      <!-- 最新数据点 -->
      <circle
        v-if="lastPoint"
        class="dot"
        :cx="lastPoint.x"
        :cy="lastPoint.y"
        :r="3.5"
        :fill="color"
      />
    </svg>
    <div v-else class="chart-empty">暂无数据</div>

    <!-- Y 轴刻度文本（绝对定位，避免 SVG 拉伸导致字体变形） -->
    <div v-if="points.length" class="y-labels">
      <span v-for="(tick, idx) in yTicks" :key="`label-${idx}`" :style="{ top: `${tick.y}px` }">
        {{ tick.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// SVG 内部坐标系宽度（配合 preserveAspectRatio 自适应容器宽度）
const WIDTH = 640
const PADDING = { top: 14, right: 46, bottom: 18, left: 10 }

const props = defineProps({
  /** 数据点：[{ x: 步数, y: 数值 }] */
  points: { type: Array, default: () => [] },
  /** 折线颜色 */
  color: { type: String, default: '#4fc3f7' },
  /** 图表高度（px） */
  height: { type: Number, default: 220 },
  /** Y 轴数值保留小数位 */
  precision: { type: Number, default: 3 }
})

/** 绘图区尺寸 */
const plot = computed(() => ({
  width: WIDTH - PADDING.left - PADDING.right,
  height: props.height - PADDING.top - PADDING.bottom
}))

/** Y 轴数值范围：上下各留 8% 余量，避免曲线贴边 */
const range = computed(() => {
  const values = props.points.map((p) => p.y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.max(Math.abs(max), 1)
  return { min: min - span * 0.08, max: max + span * 0.08 }
})

/** X 轴步数范围 */
const xRange = computed(() => {
  const steps = props.points.map((p) => p.x)
  return { min: Math.min(...steps), max: Math.max(...steps) || 1 }
})

/** 将数据点映射到 SVG 坐标 */
const mapped = computed(() =>
  props.points.map((p) => {
    const xSpan = xRange.value.max - xRange.value.min || 1
    const ySpan = range.value.max - range.value.min || 1
    return {
      x: PADDING.left + ((p.x - xRange.value.min) / xSpan) * plot.value.width,
      y: PADDING.top + ((range.value.max - p.y) / ySpan) * plot.value.height
    }
  })
)

/** 折线路径 */
const linePoints = computed(() => mapped.value.map((p) => `${p.x},${p.y}`).join(' '))

/** 面积填充路径（首尾闭合到绘图区底部） */
const areaPoints = computed(() => {
  if (!mapped.value.length) return ''
  const first = mapped.value[0]
  const last = mapped.value[mapped.value.length - 1]
  const bottom = PADDING.top + plot.value.height
  return `${first.x},${bottom} ${linePoints.value} ${last.x},${bottom}`
})

/** 最新数据点 */
const lastPoint = computed(() => mapped.value[mapped.value.length - 1] || null)

/** Y 轴 4 条刻度线 */
const yTicks = computed(() => {
  const count = 4
  const span = range.value.max - range.value.min
  return Array.from({ length: count }, (_, i) => {
    const value = range.value.max - (span / (count - 1)) * i
    return {
      y: PADDING.top + (plot.value.height / (count - 1)) * i,
      label: Number(value).toFixed(props.precision)
    }
  })
})
</script>

<style scoped>
.metric-chart {
  position: relative;
  width: 100%;
}

svg {
  width: 100%;
  height: 100%;
  display: block;
}

.grid line {
  stroke: rgba(79, 195, 247, 0.12);
  stroke-width: 1;
}

.area {
  opacity: 0.12;
}

.line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
}

.dot {
  filter: drop-shadow(0 0 4px rgba(79, 195, 247, 0.8));
}

.y-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.y-labels span {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--app-text-secondary);
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--app-text-secondary);
  font-size: 13px;
  border: 1px dashed var(--app-border);
  border-radius: 8px;
}
</style>
