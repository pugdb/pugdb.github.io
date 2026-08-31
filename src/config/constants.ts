import { PUBLIC_METRICS } from './metrics';

export const SITE_CONFIG = {
  name: 'PugDB',
  tagline: 'Modular LSM you can embed. Built so the data is still there after restart.',
  description:
    'A Rust-native key-value store for self-hosted RAG, memoirs, and embedded apps. PugDB is the public name of F4KVS.',
  githubUrl: 'https://github.com/pugdb',
  blogUrl: '/blog',
};

export const NAV_ITEMS = [
  { name: 'Features', href: '/features' },
  { name: 'Bench', href: '/bench' },
  { name: 'Showcase', href: '/showcase' },
  { name: 'Docs', href: '/docs' },
  { name: 'Blog', href: SITE_CONFIG.blogUrl },
  { name: 'GitHub', href: SITE_CONFIG.githubUrl, external: true },
] as const;

export const FEATURES = [
  {
    title: 'Survives restarts',
    description:
      `50 SIGKILL crash-loop rounds with zero loss, then 1.66M cache ops at ${PUBLIC_METRICS.ops_proof.soak_sustained.cache_ops_per_s}/s — keys still there after reopen.`,
    icon: '🛡',
    color: 'from-green-400 to-emerald-500',
  },
  {
    title: 'Embed in C and Go',
    description:
      `Production path is ${PUBLIC_METRICS.releases.f4kvs_ffi} over ${PUBLIC_METRICS.releases.f4kvs_lsm}. The same LSM under our memoirs and RAG — not a sidecar you have to operate.`,
    icon: '🔌',
    color: 'from-purple-400 to-pink-500',
  },
  {
    title: 'Product-shaped scale',
    description:
      '100k × 4 KB RAG chunks, bulk durable ingest, prefix catalogs in a few milliseconds, integrity after restart. Not a RocksDB chart war.',
    icon: '📦',
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
