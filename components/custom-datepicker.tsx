"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";

interface CustomDatePickerProps {
  onDateChange?: (date: Date) => void;
}

export function CustomDatePicker({ onDateChange }: CustomDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTickIndex, setSelectedTickIndex] = useState(0);
  const [isAnimatingToPosition, setIsAnimatingToPosition] = useState(false);
  const [hoveredTickIndex, setHoveredTickIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const today = new Date();

  // Fixed width and tick spacing
  const componentWidth = 350;
  const tickWidth = 2;
  const tickSpacing = 4;
  const totalTickSpace = tickWidth + tickSpacing;
  const numTicks = Math.floor(componentWidth / totalTickSpace);

  // Calculate days difference from today
  const daysDifference = Math.round(
    (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format date based on how far it is from today
  const formatDate = (date: Date, daysDiff: number) => {
    if (daysDiff === 0) return "TODAY";
    if (daysDiff === -1) return "YESTERDAY";
    if (daysDiff === 1) return "TOMORROW";

    // For other dates, show abbreviated month and zero-padded day
    const month = date
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    const day = date.getDate().toString().padStart(2, "0");
    return `${month} ${day}`;
  };

  // Calculate tick height based on distance from selected tick and drag state
  const getTickHeight = (tickIndex: number) => {
    const distance = Math.abs(tickIndex - selectedTickIndex);
    const isHovered = hoveredTickIndex === tickIndex;

    // Handle hover state (only affects the hovered tick, not neighbors)
    if (isHovered && !isDragging && !isAnimatingToPosition) {
      return 24; // Same size as when dragging
    }

    if (!isDragging && !isAnimatingToPosition) {
      // When not dragging or animating, only the selected tick is taller
      return tickIndex === selectedTickIndex ? 18 : 12;
    }

    // When dragging or animating, create the wave effect
    switch (distance) {
      case 0:
        return 24; // Selected tick
      case 1:
        return 20; // Immediate neighbors
      case 2:
        return 16; // Next neighbors
      default:
        return 12; // Default height
    }
  };

  // Handle mouse move for hover detection
  const handleMouseMoveHover = (e: React.MouseEvent) => {
    if (isDragging || isAnimatingToPosition) return;

    const rect = sliderRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const tickIndex = getTickIndexFromPosition(x, rect.width);
      setHoveredTickIndex(tickIndex);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredTickIndex(null);
  };

  // Animate to a specific tick index
  const animateToTick = (targetTickIndex: number) => {
    if (isAnimatingToPosition || targetTickIndex === selectedTickIndex) return;

    setIsAnimatingToPosition(true);
    const startTickIndex = selectedTickIndex;
    const distance = Math.abs(targetTickIndex - startTickIndex);
    const duration = Math.min(400, Math.max(150, distance * 25)); // Faster animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentTickIndex = Math.round(
        startTickIndex + (targetTickIndex - startTickIndex) * easeOutCubic
      );

      setSelectedTickIndex(currentTickIndex);

      // Update date
      const daysBack = numTicks - 1 - currentTickIndex;
      const newDate = new Date(today);
      newDate.setDate(today.getDate() - daysBack);
      setSelectedDate(newDate);
      onDateChange?.(newDate);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimatingToPosition(false);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle mouse down on the slider
  const handleMouseDown = (e: React.MouseEvent) => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setIsAnimatingToPosition(false);
    }

    // Clear hover state when clicking
    setHoveredTickIndex(null);

    const rect = sliderRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const targetTickIndex = getTickIndexFromPosition(x, rect.width);

      // If clicking on the same tick, start dragging
      if (targetTickIndex === selectedTickIndex) {
        setIsDragging(true);
      } else {
        // Otherwise, animate to the clicked position
        animateToTick(targetTickIndex);
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    updateSelectedTickFromPosition(x, rect.width);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get tick index from position
  const getTickIndexFromPosition = (position: number, sliderWidth: number) => {
    const clampedPosition = Math.max(0, Math.min(sliderWidth, position));
    const tickIndex =
      Math.round((clampedPosition / sliderWidth) * (numTicks - 1) + 0.5) - 0.5;
    return Math.max(0, Math.min(numTicks - 1, Math.round(tickIndex)));
  };

  // Update selected tick based on drag position
  const updateSelectedTickFromPosition = (
    position: number,
    sliderWidth: number
  ) => {
    const clampedTickIndex = getTickIndexFromPosition(position, sliderWidth);
    setSelectedTickIndex(clampedTickIndex);

    // Calculate days back from today (rightmost tick is today, leftmost is furthest back)
    const daysBack = numTicks - 1 - clampedTickIndex;
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - daysBack);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // Initialize with "Today" selected (rightmost tick)
  useEffect(() => {
    setSelectedTickIndex(numTicks - 1);
  }, [numTicks]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Generate tick marks
  const generateTicks = () => {
    return (
      <div className="flex items-center" style={{ gap: `${tickSpacing}px` }}>
        {Array.from({ length: numTicks }).map((_, i) => {
          const isSelected = i === selectedTickIndex;
          const tickHeight = getTickHeight(i);

          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ease-out ${
                isSelected ? "bg-[#FF7300]" : "bg-[#EDEDED]"
              }`}
              style={{
                width: "2px",
                height: `${tickHeight}px`,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: `${componentWidth}px` }}>
      {/* Date label */}
      <div className="text-right mb-2 select-none">
        <span
          className="text-base text-black transition-all duration-300 ease-out"
          style={{
            fontFamily: "Departure Mono, monospace",
            fontWeight: "normal",
            letterSpacing: "0.05em",
          }}
          key={formatDate(selectedDate, daysDifference)}
        >
          {formatDate(selectedDate, daysDifference)}
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={sliderRef}
        className="relative h-8 cursor-pointer select-none"
        style={{ width: `${componentWidth}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveHover}
        onMouseLeave={handleMouseLeave}
      >
        {/* Tick marks */}
        <div className="absolute top-1/2 transform -translate-y-1/2">
          {generateTicks()}
        </div>
      </div>
    </div>
  );
}
