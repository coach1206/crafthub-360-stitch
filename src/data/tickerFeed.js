export const TICKER_FEED = [
  {
    id: 'tk-001', type: 'drink_special', source: 'Bar', craft: 'all',
    title: 'Bar Special', message: 'Cognac flight special available tonight',
    priority: 2, area: 'bar', route: '/eat/bar', ctaLabel: 'View Bar', active: true,
  },
  {
    id: 'tk-002', type: 'cigar_special', source: 'Humidor', craft: 'smokecraft',
    title: 'Humidor Feature', message: 'Dominican Robusto pairing unlocked',
    priority: 2, area: 'humidor', route: '/eat/humidor', ctaLabel: 'View Humidor', active: true,
  },
  {
    id: 'tk-003', type: 'food_special', source: 'Kitchen', craft: 'all',
    title: 'Kitchen Special', message: 'Smoked short rib sliders pair with tonight\'s bourbon flight',
    priority: 1, area: 'kitchen', route: '/eat/kitchen', ctaLabel: 'View Kitchen', active: true,
  },
  {
    id: 'tk-004', type: 'event', source: 'Events', craft: 'all',
    title: 'Event Alert', message: 'Cigar & Cognac Collectors Night starts at 7 PM',
    priority: 3, area: 'venue', route: '/passport/events', ctaLabel: 'View Event', active: true,
  },
  {
    id: 'tk-005', type: 'passport_stamp', source: 'Passport', craft: 'all',
    title: 'Passport Bonus', message: 'Earn +2 stamps when you complete tonight\'s pairing',
    priority: 2, area: 'passport', route: '/passport', ctaLabel: 'View Passport', active: true,
  },
  {
    id: 'tk-006', type: 'ranking_bonus', source: 'Ranking', craft: 'all',
    title: 'XP Opportunity', message: 'Earn +75 XP for verified Passport connections tonight',
    priority: 2, area: 'ranking', route: '/grand-lounge-ranking', ctaLabel: 'View Ranking', active: true,
  },
  {
    id: 'tk-007', type: 'travel_offer', source: 'DayOne360 Travel', craft: 'smokecraft',
    title: 'Travel Offer', message: 'Explore Dominican Republic cigar-country experiences',
    priority: 1, area: 'travel', route: '/dayone360-travel', ctaLabel: 'Explore', active: true,
  },
  {
    id: 'tk-008', type: 'command_alert', source: 'E.A.T. Command', craft: 'all',
    title: 'Reserve Alert', message: 'Rare bourbon allocation available while inventory lasts',
    priority: 3, area: 'bar', route: '/eat/inventory', ctaLabel: 'View Inventory', active: true,
  },
  {
    id: 'tk-009', type: 'pairing', source: 'Kitchen', craft: 'smokecraft',
    title: 'Pairing Rec', message: 'Aged gouda pairs beautifully with tonight\'s Robusto selection',
    priority: 1, area: 'kitchen', route: '/eat/pairings', ctaLabel: 'View Pairings', active: true,
  },
  {
    id: 'tk-010', type: 'vip_offer', source: 'E.A.T. Command', craft: 'all',
    title: 'VIP Offer', message: 'Grand Lounge VIP table service available — limited seats',
    priority: 3, area: 'venue', route: '/eat-command', ctaLabel: 'Reserve Now', active: true,
  },
]

export const TICKER_SOURCE_COLORS = {
  'Bar':            '#C9A84C',
  'Humidor':        '#A0714C',
  'Kitchen':        '#8B6914',
  'Events':         '#1A5276',
  'Passport':       '#196F3D',
  'Ranking':        '#7D3C98',
  'DayOne360 Travel': '#117A65',
  'E.A.T. Command': '#922B21',
}
