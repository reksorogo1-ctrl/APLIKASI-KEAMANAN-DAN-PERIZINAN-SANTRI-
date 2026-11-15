import React, { useEffect } from 'react';
import { motion, useAnimate, stagger, type Variants } from 'motion/react';

export const METALLIC_EASE = [0.22, 1, 0.36, 1] as const;

export const metallicContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
};

export const metallicCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: METALLIC_EASE,
    },
  },
};

interface StaggeredTabPanelProps {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a switched dashboard tab view with a smooth Framer Motion entrance
 * and automatically staggers all `.metallic-glass-card` (and `.luxury-3d-card`)
 * surfaces inside the active tab whenever switching menu tabs.
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

    const allCards = (
      Array.from(
        root.querySelectorAll(
          '.metallic-glass-card:not([data-motion-card]), .luxury-3d-card:not([data-motion-card])'
        )
      ) as HTMLElement[]
    ).filter(
      (el) => !el.closest('.fixed') && el.closest('[data-stagger-scope]') === root
    );

    if (allCards.length === 0) return;

    allCards.forEach((el) => {
      el.setAttribute('data-stagger-animating', 'true');
    });

    const primaryCards = allCards.slice(0, 12);
    const overflowCards = allCards.slice(12);

    const primaryAnim = animate(
      primaryCards,
      {
        opacity: [0, 1],
        y: [18, 0],
        scale: [0.985, 1],
      },
      {
        duration: 0.42,
        delay: stagger(0.055, { startDelay: 0.04 }),
        ease: METALLIC_EASE,
      }
    );

    const overflowAnim =
      overflowCards.length > 0
        ? animate(
            overflowCards,
            {
              opacity: [0, 1],
              y: [14, 0],
            },
            {
              duration: 0.35,
              delay: 0.55,
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
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
