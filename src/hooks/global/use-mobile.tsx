/**
 * @fileoverview React hook for detecting mobile viewport and responsive design.
 * @author zpl
 * @created 2024-11-20
 */

import * as React from "react";

/**
 * Breakpoint width in pixels that defines the boundary between mobile and desktop views.
 * Viewport widths below this value are considered mobile.
 * @constant
 * @type {number}
 */
const MOBILE_BREAKPOINT = 768;

/**
 * React hook that detects whether the current viewport is mobile-sized.
 * Uses CSS media queries and window resize events for real-time detection.
 *
 * @function
 * @returns {boolean} True if viewport width is less than MOBILE_BREAKPOINT
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *   return (
 *     <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
 *       {isMobile ? <MobileContent /> : <DesktopContent />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile() {
  // Initialize state as undefined to prevent hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Create media query list for mobile breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Update state when viewport changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Add event listener and set initial value
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Cleanup event listener on unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Convert undefined to false for consistent boolean return
  return !!isMobile;
}
