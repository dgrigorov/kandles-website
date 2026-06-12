import { useId } from 'react'
import type { SVGProps } from 'react'

const SIZE_MAP = { sm: 16, md: 24, lg: 32 } as const

const COLORWAY_MAP = {
  amber:     'var(--color-amber)',
  cream:     'var(--color-cream)',
  chocolate: 'var(--color-chocolate)',
} as const

// TODO: Replace placeholder SVG paths with final artwork from Hamza Shehzad (UX-DR2)
const VARIANT_PATHS: Record<Variant, string> = {
  flame:    'M12 2C12 2 7 8.5 7 13a5 5 0 0010 0C17 8.5 12 2 12 2z',
  pot:      'M6 10h12v9a1 1 0 01-1 1H7a1 1 0 01-1-1v-9zm2-4h8v4H8V6zm4-4v4',
  sunburst: 'M12 2v2m0 16v2M2 12h2m16 0h2m-3.05-6.95-1.41 1.41M5.46 18.54l-1.41 1.41M18.54 18.54l-1.41-1.41M5.46 5.46 4.05 4.05M12 7a5 5 0 100 10A5 5 0 0012 7z',
  badge:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
}

type Variant  = 'flame' | 'pot' | 'sunburst' | 'badge'
type Size     = 'sm' | 'md' | 'lg'
type Colorway = 'amber' | 'cream' | 'chocolate'

type A11yProps =
  | { 'aria-hidden': true; 'aria-label'?: never }
  | { 'aria-hidden'?: false; 'aria-label': string }

type KandlesIconProps = {
  variant: Variant
  size?: Size
  colorway?: Colorway
  className?: string
} & A11yProps &
  Omit<SVGProps<SVGSVGElement>, 'aria-hidden' | 'aria-label' | 'width' | 'height' | 'fill'>

export function KandlesIcon({
  variant,
  size = 'md',
  colorway = 'amber',
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...rest
}: KandlesIconProps) {
  const titleId = useId()
  const px      = SIZE_MAP[size]
  const fill    = COLORWAY_MAP[colorway]
  const hidden  = ariaHidden === true ? true : undefined
  const role    = hidden ? undefined : 'img'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill={fill}
      role={role}
      aria-hidden={hidden}
      aria-labelledby={ariaLabel ? titleId : undefined}
      aria-label={ariaLabel}
      className={className}
      {...rest}
    >
      {ariaLabel && <title id={titleId}>{ariaLabel}</title>}
      <path d={VARIANT_PATHS[variant]} />
    </svg>
  )
}
