export const EASE = [0.16, 1, 0.3, 1];

const revealMotion = {
  up: {
    initial: { opacity: 0, y: 52 },
    animate: { opacity: 1, y: 0 },
  },
  down: {
    initial: { opacity: 0, y: -52 },
    animate: { opacity: 1, y: 0 },
  },
  left: {
    initial: { opacity: 0, x: -76 },
    animate: { opacity: 1, x: 0 },
  },
  right: {
    initial: { opacity: 0, x: 76 },
    animate: { opacity: 1, x: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
  },
};

export function reveal(direction = "up", delay = 0, amount = 0.25) {
  const preset = revealMotion[direction] || revealMotion.up;

  return {
    initial: preset.initial,
    whileInView: preset.animate,
    transition: {
      duration: 0.8,
      delay,
      ease: EASE,
    },
    viewport: {
      once: true,
      amount,
    },
  };
}

export const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.075,
    },
  },
};

export const staggerCard = {
  initial: { opacity: 0, y: 36, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: {
    duration: 0.65,
    ease: EASE,
  },
};
