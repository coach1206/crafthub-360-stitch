/**
 * E.A.T. Command — source stations with live specials.
 * Served publicly at GET /api/eat/sources.
 * Auth-gated dashboard data lives in eatController.js / eatRoutes.js.
 */
export const eatSources = {
  kitchen: {
    id:      'kitchen',
    name:    'Kitchen',
    status:  'operational',
    icon:    'restaurant',
    specials: [
      {
        id:        'kitchen-short-rib-sliders',
        title:     'Smoked Short Rib Sliders',
        pairing:   'Pairs with bourbon flight',
        available: true,
        tags:      ['food', 'pairing'],
      },
      {
        id:        'kitchen-aged-gouda-plate',
        title:     'Aged Gouda Plate',
        pairing:   'Pairs with Dominican Robusto',
        available: true,
        tags:      ['cheese', 'pairing'],
      },
    ],
  },
  humidor: {
    id:      'humidor',
    name:    'Humidor',
    status:  'operational',
    icon:    'smoke_free',
    specials: [
      {
        id:        'humidor-dominican-robusto',
        title:     'Dominican Robusto',
        pairing:   'Pairs with cognac flight',
        available: true,
        tags:      ['cigar', 'pairing'],
      },
      {
        id:        'humidor-connecticut-shade',
        title:     'Connecticut Shade Churchill',
        pairing:   'Pairs with single malt scotch',
        available: true,
        tags:      ['cigar', 'premium'],
      },
    ],
  },
  bar: {
    id:      'bar',
    name:    'Bar',
    status:  'operational',
    icon:    'local_bar',
    specials: [
      {
        id:        'bar-cognac-flight',
        title:     'Cognac Flight',
        pairing:   'Pairs with Dominican Robusto',
        available: true,
        tags:      ['drinks', 'pairing'],
      },
      {
        id:        'bar-bourbon-allocation',
        title:     'Reserve Bourbon Allocation',
        pairing:   'Limited stock — Pappy Van Winkle 15yr',
        available: true,
        tags:      ['drinks', 'rare', 'limited'],
      },
    ],
  },
}

export const EAT_SOURCE_KEYS = Object.keys(eatSources)
