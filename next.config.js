/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /**
     * NOTE: DealCard and SaleDealRow both use unoptimized={true} on external
     * images, which bypasses next/image hostname validation entirely. This list
     * is kept for any components that DO use next/image optimization (e.g. the
     * GameDetailClient hero image, OG image route, profile images).
     *
     * The unoptimized approach in deal cards is intentional — CheapShark
     * returns images from 30+ store CDNs that change over time.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // ── Epic Games ──────────────────────────────────────────────────
      { protocol: 'https', hostname: 'cdn1.epicgames.com' },
      { protocol: 'https', hostname: 'cdn2.unrealengine.com' },
      { protocol: 'https', hostname: 'store-images.s-microsoft.com' },

      // ── Steam ────────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'cdn.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'cdn.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },

      // ── GOG ──────────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'images.gog-statics.com' },
      { protocol: 'https', hostname: 'items.gog-statics.com' },
      { protocol: 'https', hostname: 'images2.gog-statics.com' },

      // ── itch.io ──────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'img.itch.zone' },
      { protocol: 'https', hostname: 'static.itch.io' },

      // ── Prime Gaming / Amazon ─────────────────────────────────────────
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'gaming.amazon.com' },

      // ── CheapShark ───────────────────────────────────────────────────
      { protocol: 'https', hostname: 'cdn.cheapshark.com' },

      // ── Humble Bundle ────────────────────────────────────────────────
      { protocol: 'https', hostname: 'hb.imgix.net' },
      { protocol: 'https', hostname: 'cdn.humblebundle.com' },

      // ── Fanatical ────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'cdn.fanatical.com' },

      // ── Green Man Gaming ─────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.greenmangaming.com' },
      { protocol: 'https', hostname: 'gmg-media.greenmangaming.com' },
      { protocol: 'https', hostname: 'images.greenmangaming.com' },

      // ── GamersGate ───────────────────────────────────────────────────
      { protocol: 'https', hostname: 'sttc.gamersgate.com' },
      { protocol: 'https', hostname: 'www.gamersgate.com' },

      // ── GamesPlanet ──────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.gamesplanet.com' },
      { protocol: 'https', hostname: 'uk.gamesplanet.com' },
      { protocol: 'https', hostname: 'de.gamesplanet.com' },
      { protocol: 'https', hostname: 'fr.gamesplanet.com' },

      // ── DLGamer ──────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.dlgamer.com' },
      { protocol: 'https', hostname: 'cdn.dlgamer.com' },

      // ── IndieGala ────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'store.indiegala.com' },
      { protocol: 'https', hostname: 'imgcdn.indiegala.com' },

      // ── GameBillet ───────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.gamebillet.com' },
      { protocol: 'https', hostname: 'images.gamebillet.com' },

      // ── WinGameStore ─────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.wingamestore.com' },

      // ── 2Game ────────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.2game.com' },
      { protocol: 'https', hostname: 'cdn.2game.com' },

      // ── Voidu ────────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.voidu.com' },

      // ── DreamGame ────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.dreamgame.com' },

      // ── AllYouPlay ───────────────────────────────────────────────────
      { protocol: 'https', hostname: 'www.allyouplay.com' },

      // ── IGDB ─────────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'images.igdb.com' },

      // ── Fallback ─────────────────────────────────────────────────────
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
}

module.exports = nextConfig
