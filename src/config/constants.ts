export const SITE_CONFIG = {
  name: 'PugDB',
  tagline: 'Blazing-fast modular key-value store that adapts to anything.',
  description: 'A privacy-first, Rust-native key-value store designed for high-performance applications.',
  githubUrl: 'https://github.com/pugdb',
  blogUrl: '/blog',
};

export const NAV_ITEMS = [
  { name: 'Features', href: '/features' },
  { name: 'Showcase', href: '/showcase' },
  { name: 'Docs', href: '/docs' },
  { name: 'GitHub', href: SITE_CONFIG.githubUrl, external: true },
  { name: 'Blog', href: SITE_CONFIG.blogUrl },
] as const;

export const FEATURES = [
  {
    title: 'Lightning Fast',
    description: '4–8x faster than PostgreSQL in YCSB benchmarks, with sub-millisecond P95 latency.',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    title: 'Infinitely Extensible',
    description: 'Modular architecture with pluggable storage engines, compression algorithms, and extensions.',
    icon: '🔌',
    color: 'from-purple-400 to-pink-500',
  },
  {
    title: 'Modular Design',
    description: 'Choose the right components for your needs. Clean layered architecture with clear boundaries.',
    icon: '🧩',
    color: 'from-cyan-400 to-blue-500',
  },
] as const;

// Module colors for future chameleon color changes
export const MODULE_COLORS = {
  foundation: '#6B46C1', // Purple
  extensions: '#0891B2',  // Teal
  distributed: '#06B6D4', // Cyan
  cloud: '#F97316',      // Orange
  application: '#EC4899', // Pink
} as const;

