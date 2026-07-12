<script setup lang="ts">
import { type ComputedRef, computed } from "vue";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { cn } from "@/app/lib/cn.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";

interface TrendSparklineProps {
  height?: number;
  points: number[];
  width?: number;
}

const props: Readonly<Omit<TrendSparklineProps, "height" | "width">> & {
  readonly height: number;
  readonly width: number;
} = withDefaults(defineProps<TrendSparklineProps>(), {
  height: 100,
  width: 100,
});

const i18n: TypedI18n = useTypedI18n();

const _ariaLabel: ComputedRef<string> = computed((): string =>
  i18n.t(TranslationKey.dashboardTrendLabel),
);

const padding: number = 6;

interface Coordinate {
  point: number;
  x: number;
  y: number;
}

const coordinates: ComputedRef<Coordinate[]> = computed((): Coordinate[] => {
  const length: number = props.points.length;
  if (length === 0) {
    return [];
  }

  const width: number = props.width - padding * 2;
  const height: number = props.height - padding * 2;

  return props.points.map((point: number, index: number): Coordinate => {
    let x: number;
    if (length === 1) {
      x = props.width / 2;
    } else {
      x = padding + (index / (length - 1)) * width;
    }
    const y: number = padding + height - (point / 100) * height;
    return { point, x, y };
  });
});

const _pathD: ComputedRef<string> = computed((): string =>
  coordinates.value
    .map((coordinate: Coordinate, index: number) => {
      let command: string;
      if (index === 0) {
        command = "M";
      } else {
        command = "L";
      }
      return `${command}${coordinate.x},${coordinate.y}`;
    })
    .join(" "),
);

/**
 * Fill class for a dot — the last point is emphasized.
 */
const _dotClass: (isLast: boolean) => string = (isLast: boolean): string =>
  cn(
    "stroke-accent",
    "stroke-[1.5]",
    isLast && "fill-accent",
    !isLast && "fill-surface",
  );
</script>

<template>
  <svg
    v-if="coordinates.length > 0"
    :class="cn('h-full', 'w-full', 'overflow-visible')"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="_ariaLabel"
  >
    <path
      :d="_pathD"
      fill="none"
      :class="
        cn(
          'stroke-accent',
          'stroke-2',
          '[stroke-linecap:round]',
          '[stroke-linejoin:round]',
        )
      "
    />
    <circle
      v-for="(c, i) in coordinates"
      :key="i"
      :cx="c.x"
      :cy="c.y"
      :r="i === coordinates.length - 1 ? 3.5 : 2"
      :class="_dotClass(i === coordinates.length - 1)"
    />
  </svg>
</template>
