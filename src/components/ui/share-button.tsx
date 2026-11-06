import { motion } from 'framer-motion'
import { useId, useMemo } from 'react'

type ShareIconProps = {
  shared: boolean
  iconWidth: number
  iconHeight: number
}

const ShareIcon: React.FC<ShareIconProps> = ({ shared, iconWidth, iconHeight }) => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: This is a decorative icon.
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 48 48"
      fill={shared ? '#00B0FF' : 'none'}
      stroke={shared ? '#00B0FF' : 'currentColor'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="relative"
      animate={shared ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Curved Share Icon Path from your SVG */}
      {/* eslint-disable-next-line max-len */}
      <motion.path d="M 37 4 C 33.145666 4 30 7.1456661 30 11 C 30 11.723599 30.254088 12.375715 30.458984 13.041016 L 14.982422 20.492188 A 1.0001 1.0001 0 0 0 14.515625 21.828125 C 14.828633 22.476381 15 23.212766 15 24 C 15 26.773666 12.773666 29 10 29 C 7.2263339 29 5 26.773666 5 24 C 5 21.226334 7.2263339 19 10 19 C 10.582015 19 11.137771 19.09992 11.654297 19.28125 A 1.0006835 1.0006835 0 1 0 12.316406 17.392578 C 11.590932 17.137903 10.809985 17 10 17 C 6.1456661 17 3 20.145666 3 24 C 3 27.854334 6.1456661 31 10 31 C 13.854334 31 17 27.854334 17 24 C 17 23.276618 16.745857 22.625895 16.541016 21.960938 L 32.017578 14.509766 A 1.0001 1.0001 0 0 0 32.484375 13.173828 C 32.171083 12.52416 32 11.787234 32 11 C 32 8.2263339 34.226334 6 37 6 C 39.773666 6 42 8.2263339 42 11 C 42 13.773666 39.773666 16 37 16 C 36.424403 16 35.874993 15.90379 35.363281 15.726562 A 1.0001 1.0001 0 1 0 34.708984 17.615234 C 35.427272 17.864007 36.199597 18 37 18 C 40.854334 18 44 14.854334 44 11 C 44 7.1456661 40.854334 4 37 4 z M 18.986328 27.345703 A 1.0001 1.0001 0 0 0 18.603516 29.251953 L 31.150391 35.292969 A 1.0001 1.0001 0 0 0 32.484375 34.826172 C 33.289784 33.155509 35.005952 32 37 32 C 39.773666 32 42 34.226334 42 37 C 42 39.773666 39.773666 42 37 42 C 34.825009 42 32.988871 40.620187 32.294922 38.697266 A 1.0001 1.0001 0 1 0 30.414062 39.375 C 31.388113 42.074079 33.976991 44 37 44 C 40.854334 44 44 40.854334 44 37 C 44 33.145666 40.854334 30 37 30 C 34.593152 30 32.506417 31.255282 31.244141 33.117188 L 19.470703 27.449219 A 1.0001 1.0001 0 0 0 18.986328 27.345703 z" />
    </motion.svg>
  )
}

const svgWidth = 96
const svgHeight = 96
const centerX = svgWidth / 2
const centerY = svgHeight / 2

const blue1 = '#00B0FF'
const blue2 = '#0091EA'
const blue3 = '#0288D1'
const blues = [blue1, blue2, blue3]

const hashStringToSeed = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const createSeededRandom = (seed: number) => {
  let state = seed
  return () => {
    state += 0x6d2b79f5
    let result = state
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

type ShareAnimationProps = {
  shared: boolean
}

const ShareAnimation: React.FC<ShareAnimationProps> = ({ shared }) => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: This is a decorative icon.
    <svg
      width={svgWidth}
      height={svgHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute -top-9 -left-9 pointer-events-none ${
        shared ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <PulseWave shared={shared} />
      <Particles shared={shared} />
    </svg>
  )
}

type PulseWaveProps = {
  shared: boolean
  radius?: number
}

const PulseWave: React.FC<PulseWaveProps> = ({ shared = false, radius = 47 }) => {
  return (
    <motion.circle
      cx={centerX}
      cy={centerY}
      r={radius}
      strokeWidth={1}
      stroke={blue1}
      initial={{ scale: 0, opacity: 0 }}
      animate={shared ? { scale: 1, opacity: [1, 0] } : { scale: 0, opacity: 0 }}
      transition={{ duration: 0.4, delay: shared ? 0 : 0.2 }}
    />
  )
}

type ParticlesProps = {
  shared: boolean
  numParticles?: number
  minParticleRadius?: number
  maxParticleRadius?: number
  minParticleDistance?: number
  maxParticleDistance?: number
}

const Particles: React.FC<ParticlesProps> = ({
  shared = false,
  numParticles = 20,
  minParticleRadius = 1,
  maxParticleRadius = 3,
  minParticleDistance = 32,
  maxParticleDistance = 42,
}) => {
  const id = useId()
  const particles = useMemo(() => {
    const random = createSeededRandom(hashStringToSeed(id))

    return Array.from({ length: numParticles }, (_, i) => {
      const cx = centerX
      const cy = centerY
      const fill = blues[Math.floor(random() * blues.length)]
      const radius = minParticleRadius + random() * (maxParticleRadius - minParticleRadius)
      const travelDistance =
        minParticleDistance + random() * (maxParticleDistance - minParticleDistance) - radius
      const travelAngle = 2 * Math.PI * (i / numParticles)
      const targetCx = centerX + Math.cos(travelAngle) * travelDistance
      const targetCy = centerY + Math.sin(travelAngle) * travelDistance
      const translateX = targetCx - cx
      const translateY = targetCy - cy
      const travelDuration = 200 + random() * 300

      return {
        key: i,
        cx,
        cy,
        fill,
        radius,
        translateX,
        translateY,
        travelDuration,
      }
    })
  }, [
    id,
    numParticles,
    minParticleRadius,
    maxParticleRadius,
    minParticleDistance,
    maxParticleDistance,
  ])

  return (
    <>
      {particles.map((particle) => (
        <motion.circle
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a decorative element.
          key={particle.key}
          cx={particle.cx}
          cy={particle.cy}
          r={particle.radius}
          fill={particle.fill}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={
            shared
              ? { x: particle.translateX, y: particle.translateY, opacity: 0 }
              : { x: 0, y: 0, opacity: 1 }
          }
          transition={{
            x: { duration: particle.travelDuration / 1000 },
            y: { duration: particle.travelDuration / 1000 },
            opacity: {
              duration: (particle.travelDuration * 1.2) / 1000,
              delay: shared ? (particle.travelDuration * 0.8) / 1000 : 0,
            },
          }}
        />
      ))}
    </>
  )
}

type ShareButtonProps = {
  shared: boolean
  onClick: () => void
  iconWidth: number
  iconHeight: number
  className?: string
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  shared = false,
  onClick,
  iconWidth,
  iconHeight,
  className = 'text-white',
}) => {
  return (
    <motion.button
      className={`relative p-0 bg-transparent border-0 cursor-pointer ${className} ${
        shared ? 'shared' : ''
      }`}
      whileTap={{ scale: 0.7 }}
      onClick={onClick}
    >
      <ShareAnimation shared={shared} />
      <ShareIcon shared={shared} iconWidth={iconWidth} iconHeight={iconHeight} />
    </motion.button>
  )
}
