import { P, match } from 'ts-pattern'

export type LiftSet = {
  weight: number
  reps: number
  rpe: number
}

type APRE = {
  min: number
  mid: number
  max: number
}

type APRE_MAP = Record<3 | 6 | 10, APRE>

const apreMap: APRE_MAP = {
  3: { min: 2, mid: 4, max: 6 },
  6: { min: 2, mid: 7, max: 12 },
  10: { min: 6, mid: 11, max: 16 },
}

type Level = 'conservative' | 'mid' | 'progressive'

type AdjustmentLevel = Readonly<{
  conservative: 2.5
  mid: 5
  progressive: 10
}>

const adjustmentLevels: AdjustmentLevel = {
  conservative: 2.5,
  mid: 5,
  progressive: 10,
} as const

export const adjustWeightAPRE =
  (apre: 3 | 6 | 10) =>
  (set: LiftSet, level: Level = 'progressive'): number => {
    const { min, mid, max } = apreMap[apre]
    const adjustmentValue = adjustmentLevels[level]
    return match(set)
      .with(
        {
          reps: P.when((value) => value <= min),
          weight: P.select(),
          rpe: P.when((value) => value >= 9),
        },
        (weight) => weight - adjustmentValue,
      )
      .with(
        {
          reps: P.when((value) => value <= mid),
          weight: P.select(),
          rpe: P.when((value) => value >= 8),
        },
        (weight) => weight,
      )
      .with(
        {
          reps: P.when((value) => value <= max),
          weight: P.select(),
          rpe: P.when((value) => value >= 1 && value <= 8),
        },
        (weight) => weight + adjustmentValue,
      )
      .with(P._, () => set.weight + 15)
      .exhaustive()
  }
