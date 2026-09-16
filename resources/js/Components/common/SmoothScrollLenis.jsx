import React, { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // 3. Force scroll to top on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    window.addEventListener('load', resetScroll);
    window.addEventListener('beforeunload', resetScroll);

    // 4. Reset scroll on route change using Inertia router events
    const unsubscribeRouter = router.on('navigate', () => {
      resetScroll();
    });

    return () => {
      window.removeEventListener('load', resetScroll);
      window.removeEventListener('beforeunload', resetScroll);
      unsubscribeRouter();
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  return children;
}

// Trigger HMR
