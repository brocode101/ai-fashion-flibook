import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate random positions for the floating effect
export const generateRandomPosition = (idx: number) => {
  const seed = idx * 1337; // Deterministic randomish
  const x = ((seed % 100) - 50) * 15; // Spread X
  const y = (((seed * 2) % 100) - 50) * 10; // Spread Y
  const z = idx * -400; // Distance between items on Z axis
  const rotation = ((seed % 30) - 15);
  const scale = 0.8 + (seed % 40) / 100;
  
  return { x, y, z, rotation, scale };
};
