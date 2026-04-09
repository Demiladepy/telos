import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXLM(amount: number): string {
  if (amount >= 1_000_000) return `₮${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₮${(amount / 1_000).toFixed(1)}K`;
  return `₮${amount.toFixed(2)}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function truncateHash(hash: string, start = 6, end = 4): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function truncateAddress(addr: string): string {
  return truncateHash(addr, 4, 4);
}

export function generateAgentColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "linear-gradient(135deg, #ff6b00, #ff9500)",
    "linear-gradient(135deg, #7b2fff, #9b59ff)",
    "linear-gradient(135deg, #00b4ff, #00ff94)",
    "linear-gradient(135deg, #ff3366, #ff6b00)",
    "linear-gradient(135deg, #9b59ff, #00b4ff)",
    "linear-gradient(135deg, #ffd600, #ff9500)",
    "linear-gradient(135deg, #00ff94, #00b4ff)",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
