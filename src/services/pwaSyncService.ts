import { SystemConfig } from '../types';

let currentManifestBlobUrl: string | null = null;

/**
 * Synchronizes the runtime PWA identity (Document Title, Meta Theme Color, Favicon,
 * Apple Touch Icon, and Dynamic Web App Manifest Blob) with the active SystemConfig.
 */
export function syncPWAIdentity(config: SystemConfig): void {
  if (typeof window === 'undefined') return;

  const appName = config.namaAplikasi || 'KEAMANAN SANTRI AL-MALIKI';
  const shortName = config.namaPendekAplikasi || 'AL-MALIKI';
  const themeColor = config.themeColor || '#030712';
  const bgColor = config.backgroundColor || '#030712';
  const appIcon = config.appIconUrl || '/icon.svg';

  // 1. Update Document Title
  document.title = `${appName} | Pusat Komando & Pengawasan`;

  // 2. Update Theme Color Meta Tag
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', themeColor);

  // 3. Update Apple Mobile Web App Title
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', shortName);
  }

  // 4. Update Favicon & Apple Touch Icon Links
  let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.href = appIcon;

  let appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!appleIconLink) {
    appleIconLink = document.createElement('link');
    appleIconLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleIconLink);
  }
  appleIconLink.href = appIcon;

  // 5. Generate and inject Dynamic Web App Manifest Blob
  try {
    const dynamicManifest = {
      id: '/',
      name: appName,
      short_name: shortName,
      description: config.deskripsiAplikasi || 'Aplikasi Pusat Komando & Pengawasan Keamanan Santri Pondok Pesantren Salaf Al-Maliki',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      theme_color: themeColor,
      background_color: bgColor,
      icons: [
        {
          src: appIcon,
          sizes: '192x192',
          type: appIcon.startsWith('data:image/svg') || appIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any',
        },
        {
          src: appIcon,
          sizes: '512x512',
          type: appIcon.startsWith('data:image/svg') || appIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any',
        },
        {
          src: appIcon,
          sizes: '512x512',
          type: appIcon.startsWith('data:image/svg') || appIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'maskable',
        },
      ],
    };

    const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/manifest+json',
    });

    if (currentManifestBlobUrl) {
      URL.revokeObjectURL(currentManifestBlobUrl);
    }

    currentManifestBlobUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = currentManifestBlobUrl;
  } catch (err) {
    console.warn('PWA Manifest dynamic sync skipped:', err);
  }
}
