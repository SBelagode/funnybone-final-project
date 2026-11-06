"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type BookmarkIconProps = {
	bookmarked: boolean;
	size?: number;
	playAnimation?: boolean;
};

const brandPrimary = "hsl(var(--primary))";
const brandPrimarySoft = "hsl(var(--primary) / 0.8)";
const brandPrimaryMuted = "hsl(var(--primary) / 0.6)";
const brandVariants = [brandPrimary, brandPrimarySoft, brandPrimaryMuted];
const seededRandom = (seed: number) => {
	const x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
};

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
	bookmarked,
	size = 16,
	playAnimation = false,
}) => {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: This is a decorative icon.
		<motion.svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={bookmarked ? brandPrimary : "none"}
			stroke={bookmarked ? brandPrimary : "currentColor"}
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="relative"
			animate={playAnimation ? { scale: [1, 1.2, 1] } : { scale: 1 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
		>
			<motion.path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</motion.svg>
	);
};

const svgWidth = 96;
const svgHeight = 96;
const centerX = svgWidth / 2;
const centerY = svgHeight / 2;

type BookmarkAnimationProps = {
	playAnimation: boolean;
};

const BookmarkAnimation: React.FC<BookmarkAnimationProps> = ({ playAnimation }) => {
	if (!playAnimation) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: This is a decorative icon.
		<svg
			width={svgWidth}
			height={svgHeight}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="absolute -top-9 -left-9 pointer-events-none opacity-100"
		>
			<PulseWave playAnimation={playAnimation} />
			<Particles playAnimation={playAnimation} />
		</svg>
	);
};

type PulseWaveProps = {
	playAnimation: boolean;
	radius?: number;
};

const PulseWave: React.FC<PulseWaveProps> = ({
	playAnimation = false,
	radius = 47,
}) => {
	return (
		<motion.circle
			cx={centerX}
			cy={centerY}
			r={radius}
			strokeWidth={1}
			stroke={brandPrimary}
			initial={{ scale: 0, opacity: 0 }}
			animate={playAnimation ? { scale: 1, opacity: [1, 0] } : { scale: 0, opacity: 0 }}
			transition={{ duration: 0.4 }}
		/>
	);
};

type ParticlesProps = {
	playAnimation: boolean;
	numParticles?: number;
	minParticleRadius?: number;
	maxParticleRadius?: number;
	minParticleDistance?: number;
	maxParticleDistance?: number;
};

const Particles: React.FC<ParticlesProps> = ({
	playAnimation = false,
	numParticles = 20,
	minParticleRadius = 1,
	maxParticleRadius = 3,
	minParticleDistance = 32,
	maxParticleDistance = 42,
}) => {
	return (
		<>
			{Array.from({ length: numParticles }).map((_, i) => {
				const cx = centerX;
				const cy = centerY;
				const fill =
					brandVariants[
						Math.floor(seededRandom(i + 1) * brandVariants.length)
					];
				const radius =
					minParticleRadius +
					seededRandom(i + 2) * (maxParticleRadius - minParticleRadius);

				const travelDistance =
					minParticleDistance +
					seededRandom(i + 3) *
						(maxParticleDistance - minParticleDistance) -
					radius;
				const travelAngle = 2 * Math.PI * (i / numParticles);
				const targetCx = centerX + Math.cos(travelAngle) * travelDistance;
				const targetCy = centerY + Math.sin(travelAngle) * travelDistance;

				const translateX = targetCx - cx;
				const translateY = targetCy - cy;
				const travelDuration = 200 + seededRandom(i + 4) * 300;

				return (
					<motion.circle
						// biome-ignore lint/suspicious/noArrayIndexKey:
						// This is a decorative element.
						key={i}
						cx={cx}
						cy={cy}
						r={radius}
						fill={fill}
						initial={{ x: 0, y: 0, opacity: 1 }}
						animate={
							playAnimation
								? { x: translateX, y: translateY, opacity: 0 }
								: { x: 0, y: 0, opacity: 1 }
						}
						transition={{
							x: { duration: travelDuration / 1000 },
							y: { duration: travelDuration / 1000 },
							opacity: {
								duration: (travelDuration * 1.2) / 1000,
								delay: playAnimation ? (travelDuration * 0.8) / 1000 : 0,
							},
						}}
					/>
				);
			})}
		</>
	);
};

type BookmarkButtonProps = {
	bookmarked: boolean;
	onClick: () => void;
	size?: number;
};

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
	bookmarked = false,
	onClick,
	size = 16,
}) => {
	const [playAnimation, setPlayAnimation] = useState(false);
	const pendingAnimationRef = useRef(false);
	const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		if (bookmarked && pendingAnimationRef.current) {
			pendingAnimationRef.current = false;
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			animationFrameRef.current = requestAnimationFrame(() => {
				setPlayAnimation(true);
				animationFrameRef.current = null;
			});

			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
			}

			animationTimeoutRef.current = setTimeout(() => {
				setPlayAnimation(false);
				animationTimeoutRef.current = null;
			}, 500);
		}

		if (!bookmarked) {
			pendingAnimationRef.current = false;
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
				animationTimeoutRef.current = null;
			}
		};
	}, [bookmarked]);

	return (
		<motion.button
			className={`relative p-0 bg-transparent border-0 cursor-pointer ${
				bookmarked ? "bookmarked" : ""
			}`}
			whileTap={{ scale: 0.7 }}
			onClick={() => {
				if (!bookmarked) {
					pendingAnimationRef.current = true;
				}
				onClick();
			}}
		>
			<BookmarkAnimation playAnimation={playAnimation} />
			<BookmarkIcon bookmarked={bookmarked} size={size} playAnimation={playAnimation} />
		</motion.button>
	);
};
