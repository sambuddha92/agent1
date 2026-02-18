/**
 * useDropdownPosition Hook
 * 
 * Intelligent dropdown positioning that ensures the menu is always fully visible.
 * Follows industry best practices from Radix UI, Headless UI, and Floating UI.
 * 
 * Features:
 * - Dynamic viewport detection
 * - Collision detection and avoidance
 * - Automatic position adjustment (top/bottom/left/right)
 * - Smooth transitions with proper transform origins
 * - Responsive behavior across screen sizes
 * - Performance optimized with debouncing
 */

import { useEffect, useState, useCallback, RefObject } from 'react';

export interface DropdownPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transformOrigin: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  maxHeight: number;
  maxWidth?: number;
}

interface UseDropdownPositionOptions {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement>;
  dropdownRef: RefObject<HTMLElement>;
  offset?: number; // Gap between trigger and dropdown
  preferredPlacement?: 'top' | 'bottom';
}

const VIEWPORT_PADDING = 8; // Minimum distance from viewport edges
const DEFAULT_OFFSET = 8; // Default gap between trigger and dropdown

export function useDropdownPosition({
  isOpen,
  triggerRef,
  dropdownRef,
  offset = DEFAULT_OFFSET,
  preferredPlacement = 'bottom',
}: UseDropdownPositionOptions): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const calculatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) {
      return null;
    }

    const trigger = triggerRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Calculate available space in all directions
    const spaceAbove = trigger.top;
    const spaceBelow = viewport.height - trigger.bottom;

    // Determine vertical placement (top or bottom)
    let placement: 'top' | 'bottom' = preferredPlacement;
    const dropdownHeight = dropdown.height || 400; // fallback if not measured yet

    if (preferredPlacement === 'bottom') {
      // Check if there's enough space below
      if (spaceBelow < dropdownHeight + offset + VIEWPORT_PADDING) {
        // Not enough space below, try above
        if (spaceAbove > spaceBelow && spaceAbove > dropdownHeight + offset + VIEWPORT_PADDING) {
          placement = 'top';
        }
      }
    } else if (preferredPlacement === 'top') {
      // Check if there's enough space above
      if (spaceAbove < dropdownHeight + offset + VIEWPORT_PADDING) {
        // Not enough space above, try below
        if (spaceBelow > spaceAbove && spaceBelow > dropdownHeight + offset + VIEWPORT_PADDING) {
          placement = 'bottom';
        }
      }
    }

    // Calculate vertical position
    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight: number;

    if (placement === 'bottom') {
      top = trigger.bottom + offset;
      maxHeight = spaceBelow - offset - VIEWPORT_PADDING;
    } else {
      bottom = viewport.height - trigger.top + offset;
      maxHeight = spaceAbove - offset - VIEWPORT_PADDING;
    }

    // Calculate horizontal position (align with trigger, but avoid viewport edges)
    let left = trigger.left;
    const dropdownWidth = dropdown.width || 288; // fallback width

    // Check if dropdown would overflow right edge
    if (left + dropdownWidth > viewport.width - VIEWPORT_PADDING) {
      // Align dropdown's right edge with trigger's right edge
      left = trigger.right - dropdownWidth;
    }

    // Check if dropdown would overflow left edge
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    // Calculate transform origin for smooth animation
    const triggerCenterX = trigger.left + trigger.width / 2;
    const dropdownCenterX = left + dropdownWidth / 2;
    
    const originX = triggerCenterX < dropdownCenterX ? 'left' : 'right';
    const originY = placement === 'bottom' ? 'top' : 'bottom';
    const transformOrigin = `${originX} ${originY}`;

    return {
      top,
      bottom,
      left,
      transformOrigin,
      placement,
      maxHeight: Math.max(200, Math.min(maxHeight, 600)), // Min 200px, max 600px
      maxWidth: Math.min(dropdownWidth, viewport.width - 2 * VIEWPORT_PADDING),
    };
  }, [isOpen, triggerRef, dropdownRef, offset, preferredPlacement]);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    // Initial calculation
    const newPosition = calculatePosition();
    if (newPosition) {
      setPosition(newPosition);
    }

    // Recalculate on scroll and resize with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const updatedPosition = calculatePosition();
        if (updatedPosition) {
          setPosition(updatedPosition);
        }
      }, 16); // ~60fps
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  return position;
}
