import { SITE_CONFIG } from './config/constants';

export const ORIGIN = 'https://pugdb.github.io';
export const DEFAULT_TITLE = 'PugDB — embeddable Rust LSM';
export const DEFAULT_DESCRIPTION = SITE_CONFIG.description;
export const OG_IMAGE = '/logos/hero-scene.jpg';

export function canonicalUrl(pathname: string): string {
  const path = pathname.split('?')[0] ?? '/';
  if (path.endsWith('.html')) {
    return new URL(path, ORIGIN).href;
  }
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  return new URL(withSlash, ORIGIN).href;
}

export function absoluteUrl(path: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, ORIGIN).href;
}

export function pageTitle(title: string): string {
  const raw = title?.trim() ?? '';
  if (!raw || raw === 'Home') return DEFAULT_TITLE;
  if (raw.includes('PugDB')) return raw;
  return `${raw} | PugDB`;
}

export function softwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PugDB',
        alternateName: 'F4KVS',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Linux, macOS, Windows',
        url: ORIGIN,
        description: DEFAULT_DESCRIPTION,
        image: absoluteUrl(OG_IMAGE),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Organization', name: 'PugDB', url: ORIGIN },
      },
      {
        '@type': 'SoftwareSourceCode',
        name: 'PugDB',
        alternateName: 'F4KVS',
        codeRepository: SITE_CONFIG.githubUrl,
        programmingLanguage: 'Rust',
        url: ORIGIN,
      },
    ],
  };
}
