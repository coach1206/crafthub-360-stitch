// Venue-controlled rotating hero content for the SmokeCraft 360 landing page.
// Each venue can define its own rotator slides (image, copy, route). If a
// venue has no config or a slide image fails to load, the rotator falls back
// to a polished gradient/texture panel — never a broken image or "pending" box.

const VENUE_HOME_CONTENT = {
  'demo-lounge': {
    venueId: 'demo-lounge',
    heroRotator: [
      {
        id: 'humidor',
        title: 'Browse the House Humidor',
        subtitle: "Explore today's featured cigars, pairings, and staff picks.",
        image: '/assets/smokecraft/cropped/humidor-match-bg.jpg',
        route: '/smokecraft/humidor',
        icon: 'inventory_2',
      },
      {
        id: 'pairing',
        title: "Tonight's Featured Pairing",
        subtitle: 'A curated cigar and drink pairing selected by the venue.',
        image: '/assets/smokecraft/cropped/flavor-dna-bg.jpg',
        route: '/smokecraft/pairing',
        icon: 'local_bar',
      },
      {
        id: 'challenge',
        title: 'Event Challenge Active',
        subtitle: 'Join the current SmokeCraft challenge and earn passport credit.',
        image: '/assets/smokecraft/cropped/golden-box-hero.jpg',
        route: '/smokecraft/challenge',
        icon: 'emoji_events',
      },
    ],
  },
}

const DEFAULT_VENUE_ID = 'demo-lounge'

/** Returns the rotating hero content for a venue, falling back to the default venue config. */
export function getVenueHomeContent(venueId) {
  return VENUE_HOME_CONTENT[venueId] || VENUE_HOME_CONTENT[DEFAULT_VENUE_ID]
}

export const venueHomeContent = VENUE_HOME_CONTENT[DEFAULT_VENUE_ID]
