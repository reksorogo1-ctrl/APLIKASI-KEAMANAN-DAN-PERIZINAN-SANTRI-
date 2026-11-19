import React, { useEffect } from 'react';
import { motion, useAnimate, stagger, type Variants } from 'motion/react';

export const METALLIC_EASE = [0.22, 1, 0.36, 1] as const;

export const metallicContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

export const metallicCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: METALLIC_EASE,
    },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: METALLIC_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: METALLIC_EASE },
  },
};

export const modalCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: METALLIC_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 6,
    transition: { duration: 0.16, ease: METALLIC_EASE },
  },
};

interface StaggeredTabPanelProps {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a switched dashboard tab view with a smooth Framer Motion entrance
 * and automatically staggers all card surfaces inside the active tab
 * on first open and whenever switching menu tabs.
 */
export const StaggeredTabPanel: React.FC<StaggeredTabPanelProps> = ({
  tabKey,
  children,
  className = '',
}) => {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const root: HTMLDivElement | null = scope.current;
    if (!root) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const explicitCards = (
      Array.from(
        root.querySelectorAll(
          '.metallic-glass-card:not([data-motion-card]), .luxury-3d-card:not([data-motion-card]), .cyber-glass-card:not([data-motion-card]), [data-stagger-card]:not([data-motion-card])'
        )
      ) as HTMLElement[]
    ).filter(
      (el) => !el.closest('.fixed') && el.closest('[data-stagger-scope]') === root
    );

    const allCards =
      explicitCards.length >= 3
        ? explicitCards
        : (
            Array.from(
              root.querySelectorAll(
                'div[class*="rounded-2xl"][class*="border"]:not([data-motion-card]), div[class*="rounded-3xl"][class*="border"]:not([data-motion-card]), form[class*="rounded-2xl"][class*="border"]:not([data-motion-card])'
              )
            ) as HTMLElement[]
          ).filter((el) => {
            if (el.closest('.fixed') || el.closest('[data-stagger-scope]') !== root) return false;
            // Skip tiny badge/pill boxes (< 48px height)
            return el.offsetHeight >= 48;
          });

    if (allCards.length === 0) return;

    allCards.forEach((el) => {
      el.setAttribute('data-stagger-animating', 'true');
    });

    const primaryCards = allCards.slice(0, 14);
    const overflowCards = allCards.slice(14);

    const primaryAnim = animate(
      primaryCards,
      {
        opacity: [0, 1],
        y: [14, 0],
        scale: [0.985, 1],
      },
      {
        duration: 0.32,
        delay: stagger(0.045, { startDelay: 0.02 }),
        ease: METALLIC_EASE,
      }
    );

    const overflowAnim =
      overflowCards.length > 0
        ? animate(
            overflowCards,
            {
              opacity: [0, 1],
              y: [10, 0],
            },
            {
              duration: 0.28,
              delay: 0.38,
              ease: METALLIC_EASE,
            }
          )
        : null;

    let cancelled = false;
    Promise.all([primaryAnim.finished, overflowAnim?.finished].filter(Boolean))
      .then(() => {
        if (cancelled) return;
        allCards.forEach((el) => {
          el.removeAttribute('data-stagger-animating');
          el.style.removeProperty('transform');
          el.style.removeProperty('opacity');
        });
      })
      .catch(() => {
        // Ignore animation cancellation on rapid tab switching
      });

    return () => {
      cancelled = true;
      primaryAnim.stop();
      overflowAnim?.stop();
      allCards.forEach((el) => {
        el.removeAttribute('data-stagger-animating');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
      });
    };
  }, [tabKey, animate, scope]);

  return (
    <motion.div
      ref={scope}
      data-stagger-scope="true"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: METALLIC_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface LaserScanLineProps {
  className?: string;
}

/**
 * Thin bright emerald laser scan line sweeping up and down smoothly
 * inside camera / scanner viewports.
 */
export const LaserScanLine: React.FC<LaserScanLineProps> = ({ className = '' }) => (
  <motion.div
    aria-hidden="true"
    initial={{ top: '8%' }}
    animate={{ top: ['8%', '90%', '8%'] }}
    transition={{
      duration: 2.1,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={`pointer-events-none absolute left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_12px_#10B981,0_0_24px_rgba(16,185,129,0.75)] z-20 ${className}`}
  >
    <div className="absolute -top-3 inset-x-0 h-6 bg-gradient-to-b from-transparent via-[#10B981]/20 to-transparent pointer-events-none" />
  </motion.div>
);

export const FLOATING_MODAL_CARD_CLASS =
  'bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 shadow-2xl';
