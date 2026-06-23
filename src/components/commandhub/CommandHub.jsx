import TicketTicker from '../common/TicketTicker.jsx'

const MEMBER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWXglzb_WYKEWLzx_GP2htMAmylt3mc4x271sR6Sgl-GSMFBDFFhp6UUSJ2p60KWwRXW1GJBT4BMHdiVk08RE8Q3Hqc0qlOGLkQ_-JOa7PIyCTDdIKun_viSNQVYI9HPXOQTsapFdp4Z7pFymCG7xoMHqziC0aay19DnTmthayXgUzViZ9CJ6o9n6ckNjypwlfJgv5k_Zae8mCfcyk6TKoenHMSe54VO9On3spC7zVcWvFUCHaTaJan02aA5niZ-u5z7nEY3caQw'

const tickerItems = [
  ['ticker-drink', 'BAR', 'Featured cocktail', 'Barrel-aged old fashioned special now active', '/pourcraft'],
  ['ticker-food', 'KITCHEN', 'Food special', 'Chef tasting board open for Passport members', '/crafthub'],
  ['ticker-cigar', 'HUMIDOR', 'Cigar special', 'Maduro + Bourbon pairing begins tonight', '/smokecraft/pairing'],
  ['ticker-event', 'EVENTS', 'Member alert', 'VIP cellar flight at 8 PM', '/winecraft'],
  ['ticker-travel', 'DAYONE360', 'Travel offer', 'Dominican Republic craft tourism preview', '/dayone360'],
  ['ticker-vip', 'PASSPORT', 'VIP announcement', 'Double XP for completed journeys tonight', '/passport'],
].map(([id, source, title, message, route]) => ({
  id,
  source,
  title,
  message,
  route,
  sourceColor: '#E9C176',
  ctaLabel: 'Open',
}))

const summaryTiles = [
  ['Active Experiences', '14', 'Craft, events, travel'],
  ['Passport Members', '248', 'Identity layer synced'],
  ['Today’s Events', '6', 'Experiences live'],
  ['E.A.T. Alerts', '3', 'Kitchen, bar, humidor'],
  ['POS / Inventory Signals', 'Ready', 'Protected staff access'],
]

const ecosystem = [
  ['CraftHub', ['SmokeCraft 360', 'PourCraft', 'WineCraft', 'BeerCraft', 'Kitchen / Food Experiences', 'Events']],
  ['360 Passport Connections', ['XP', 'Badges', 'Sensory Profile', 'Visits', 'Mentor Sessions', 'Leaderboard', 'Membership Level']],
  ['E.A.T. Command Center', ['Kitchen', 'Bar', 'Humidor', 'Events', 'Specials', 'Ticket Ticker']],
  ['POS 3', ['Orders', 'Membership', 'Rewards', 'Inventory']],
  ['DayOne360 Travel', ['Travel Concierge', 'Craft Tourism', 'VIP Trips', 'Relocation']],
  ['Staff Terminal', ['Service Flow', 'Guest Tabs', 'Venue Ops']],
  ['Mentor Console', ['Guided Sessions', 'Notes', 'Recommendations']],
  ['Founder Command', ['Full Access', 'System Control', 'Policy']],
  ['Developer Diagnostics', ['Health', 'Logs', 'Integrations']],
]

const commandModules = [
  {
    title: 'CraftHub 360',
    route: '/crafthub',
    image: '/crafthub-gold.jpg',
    purpose: 'Craft experience hub for cigars, drinks, cellar, beer, food, events, and guided discovery.',
    connected: 'SmokeCraft / PourCraft / WineCraft / BeerCraft / Events',
    access: 'Guest + Passport',
    status: 'Hub Online',
  },
  {
    title: 'SmokeCraft 360',
    route: '/smokecraft',
    image: '/smokecraft.jpg',
    purpose: 'Guided cigar education, wrapper, binder, filler, shape, size, burn time, pairing, mentor notes, and Passport XP.',
    connected: 'Passport / Humidor / E.A.T. / Mentor',
    access: 'Guest + Mentor',
    status: 'Journey Active',
  },
  {
    title: 'PourCraft',
    route: '/pourcraft',
    image: '/background-lounge-airy.jpg',
    purpose: 'Spirits, cocktails, tasting notes, aroma, pairing suggestions, drink specials, and bar-connected recommendations.',
    connected: 'Passport / Bar / E.A.T. / POS 3',
    access: 'Guest + Staff',
    status: 'Bar Linked',
  },
  {
    title: 'WineCraft',
    route: '/winecraft',
    image: '/background-lounge-airy.jpg',
    purpose: 'Wine regions, grape varieties, tasting notes, pairing intelligence, cellar logic, and Passport journey history.',
    connected: 'Passport / E.A.T. / Events',
    access: 'Guest + Passport',
    status: 'Cellar Ready',
  },
  {
    title: 'BeerCraft',
    route: '/beercraft',
    image: '/background-lounge-airy.jpg',
    purpose: 'Beer styles, ABV, IBU, brewery notes, tasting profile, event specials, and Passport achievements.',
    connected: 'Passport / Bar / E.A.T.',
    access: 'Guest + Passport',
    status: 'Taproom Ready',
  },
  {
    title: 'Food / Kitchen Experiences',
    route: '/crafthub',
    image: '/background-lounge-airy.jpg',
    purpose: 'Chef tastings, pairing menus, culinary specials, food preferences, and kitchen event signals.',
    connected: 'CraftHub / E.A.T. / POS 3 / Passport',
    access: 'Guest + Staff',
    status: 'Kitchen Live',
  },
  {
    title: 'E.A.T. Command Center',
    route: '/eat-command',
    image: '/background-lounge-airy.jpg',
    purpose: 'Operational brain for Kitchen, Bar, Humidor, Events, Specials, Ticket Ticker, and guest flow.',
    connected: 'POS 3 / Craft Screens / Inventory / Events',
    access: 'Admin + Staff',
    status: 'Protected',
  },
  {
    title: 'POS 3',
    route: '/pos3',
    image: '/background-lounge-airy.jpg',
    purpose: 'Touchscreen checkout for food, drinks, cigars, specials, guest tabs, membership discounts, and Passport rewards.',
    connected: 'E.A.T. / Staff / Inventory / Passport',
    access: 'Staff',
    status: 'Protected',
  },
  {
    title: '360 Passport Connections',
    route: '/passport',
    image: '/passport.jpg',
    purpose: 'Luxury member identity, XP, badges, completed experiences, sensory profile, mentor sessions, events, and travel-connected memories.',
    connected: 'All Craft Experiences / DayOne360 / Leaderboard',
    access: 'Member',
    status: 'Core Layer',
  },
  {
    title: 'DayOne360 Travel',
    route: '/dayone360',
    image: '/background-lounge-airy.jpg',
    purpose: 'Travel concierge, craft tourism, VIP trips, relocation support, destination experiences, and member travel perks.',
    connected: 'Passport / Events / Member Network',
    access: 'Member + Admin',
    status: 'Extension Live',
  },
  {
    title: 'Member Network',
    route: '/passport-networking',
    image: '/passport.jpg',
    purpose: 'Private member discovery, venue relationships, community connections, and shared experience memory.',
    connected: 'Passport / DayOne360 / Events',
    access: 'Passport Member',
    status: 'Network Ready',
  },
  {
    title: 'Leaderboard',
    route: '/leaderboard',
    image: '/passport.jpg',
    purpose: 'XP rank, badges, achievement recognition, return-visit motivation, and member progression.',
    connected: 'Passport / SmokeCraft / XP',
    access: 'Guest + Member',
    status: 'XP Live',
  },
  {
    title: 'Mentor Console',
    route: '/mentor-login',
    image: '/smokecraft.jpg',
    purpose: 'Human mentor workflow for guided sessions, notes, recommendations, and guest confidence.',
    connected: 'SmokeCraft / Passport / Sensory Profile',
    access: 'Human Mentor',
    status: 'Login Required',
  },
  {
    title: 'Staff Terminal',
    route: '/staff-login',
    image: '/background-lounge-airy.jpg',
    purpose: 'Professional service lane for POS, guest support, venue operations, and active specials.',
    connected: 'POS 3 / E.A.T. / Inventory',
    access: 'Staff',
    status: 'Login Required',
  },
  {
    title: 'Founder Command',
    route: '/founder-command',
    image: '/crafthub-gold.jpg',
    purpose: 'Top-level operating authority for system policy, access, demos, diagnostics, and venue intelligence.',
    connected: 'All CRAFTHUB 360 systems',
    access: 'Founder',
    status: 'Restricted',
  },
  {
    title: 'Developer Diagnostics',
    route: '/dev-diagnostics',
    image: '/background-lounge-airy.jpg',
    purpose: 'Technical command panel for logs, system health, integration checks, and deployment readiness.',
    connected: 'Health / API / POS / E.A.T.',
    access: 'Developer',
    status: 'Blocked in Demo',
  },
  {
    title: 'Safe Preview / Demo Mode',
    route: '/demo',
    image: '/background-lounge-airy.jpg',
    purpose: 'Safe preview without payments, inventory changes, audit records, real server calls, or role changes.',
    connected: 'Guest Routes / Craft Screens / Passport',
    access: 'Demo User',
    status: 'Safe Preview',
  },
  {
    title: 'Events',
    route: '/passport/events',
    image: '/background-lounge-airy.jpg',
    purpose: 'Tonight’s experiences, tasting events, member moments, venue programming, and ticketed flow.',
    connected: 'E.A.T. / Passport / Ticket Ticker',
    access: 'Guest + Staff',
    status: 'Calendar Live',
  },
  {
    title: 'Sensory Profile',
    route: '/passport/profile',
    image: '/passport.jpg',
    purpose: 'Preference intelligence across flavor, aroma, strength, drink, cigar, food pairing, ratings, and mentor notes.',
    connected: 'Passport / Mentor / CraftHub',
    access: 'Passport Member',
    status: 'Learning',
  },
]

const passportStatus = [
  ['Member Level', 'Reserve Gold'],
  ['XP', '12,840'],
  ['Badges', '18 earned'],
  ['Completed Experiences', '42'],
  ['Favorite Craft', 'SmokeCraft'],
  ['Sensory Profile', '86% complete'],
  ['Leaderboard Rank', '#7 Grand Lounge'],
  ['Recent Achievement', 'Wrapper Mastery'],
  ['Next Journey', 'Wine + Maduro Flight'],
]

const eatStatus = [
  ['Kitchen', 'Specials Ready'],
  ['Bar', 'Pairings Active'],
  ['Humidor', 'Featured Cigar Loaded'],
  ['Events', 'Tonight’s Experiences Live'],
  ['Specials', 'Member Offers Published'],
  ['Ticket Ticker', 'Broadcasting'],
  ['Inventory Alerts', '2 watch items'],
  ['Operational Alerts', '3 active signals'],
]

const sensoryProfile = [
  ['Flavor', 'Cocoa, cedar, dark fruit'],
  ['Aroma', 'Toasted oak, spice'],
  ['Strength', 'Medium-full'],
  ['Sweet', '68%'],
  ['Smoky', '74%'],
  ['Spicy', '41%'],
  ['Earthy', '63%'],
  ['Drink', 'Bourbon forward'],
  ['Cigar', 'Maduro toro'],
  ['Food Pairing', 'Charred steak, cacao'],
  ['Recommended Next', 'SmokeCraft Pairing Mastery'],
]

const journey = [
  'Enter CRAFTHUB 360',
  'Choose CraftHub',
  'Select Experience',
  'Receive Guidance',
  'Save Preferences',
  'Earn XP',
  'Update Passport',
  'Get Recommendation',
  'Return Home',
]

const roles = [
  ['Guest', 'Home, CraftHub, public journeys'],
  ['Passport Member', 'XP, badges, profile, events, leaderboard'],
  ['Staff', 'POS 3, service, venue operations'],
  ['Human Mentor', 'Guided sessions, notes, recommendations'],
  ['Admin', 'Venue, users, events, E.A.T. management'],
  ['Founder', 'Supersedes normal access; full command'],
  ['Developer', 'Diagnostics, logs, health checks'],
  ['Demo', 'Safe preview only; protected systems blocked'],
]

const demoAllows = ['Boot', 'Home', 'SmokeCraft', 'Leaderboard', 'Passport', 'DayOne360 Travel', 'CraftHub', 'WineCraft', 'PourCraft', 'BeerCraft']
const demoBlocks = ['Founder Command', 'Admin Command', 'E.A.T.', 'POS 3', 'Developer Diagnostics', 'Login/setup/management routes']

const ultraCommandSections = [
  'System Overview',
  'Connected Venues',
  'Remote Software Control',
  'NOVEE Vault',
  'Licenses',
  'Modules',
  'E.A.T. Network',
  'POS 3 Network',
  'CraftHub Network',
  'Passport Network',
  'AMBI Intelligence',
  'Analytics',
  'Deployments',
  'Security',
  'Audit Logs',
  'User Management',
  'Role Management',
  'Legal / Privacy',
  'Assets / Media Library',
  'Support / Tickets',
  'Developer Diagnostics',
  'Founder Command',
]

const ultraActions = [
  'View all connected venues',
  'Open a specific venue mirror',
  'Activate or deactivate venue modules',
  'Push remote software updates',
  'Push UI/content updates',
  'Push E.A.T. settings',
  'Push POS 3 settings',
  'Push CraftHub content',
  'Push ticket ticker templates',
  'Push legal/privacy updates',
  'Push demo mode settings',
  'Push role access updates',
  'View system health by venue',
  'View database/API/deployment status',
  'View audit logs',
  'Manage venue licenses',
  'Manage special access codes',
  'Manage users, staff, mentors, admins, and developers',
  'Manage assets and documents',
  'Manage system-wide analytics',
  'Manage AMBI environment logic',
  'Manage the NOVEE Vault',
]

const vaultSections = [
  ['Identity Vault', 'User profiles, management profiles, staff profiles, mentor profiles, special access codes'],
  ['Venue Vault', 'Venue accounts, venue licenses, settings, module access, tenant configuration'],
  ['Experience Vault', 'Experience history, craft education content, events, specials, product/menu data'],
  ['Passport Vault', 'Passport profiles, sensory profiles, completed experiences, badges, XP, visits'],
  ['E.A.T. Vault', 'Kitchen, bar, humidor, events, ticker templates, operational configuration'],
  ['POS Vault', 'POS 3 configuration, orders, reports, inventory signals, membership rewards logic'],
  ['Asset Vault', 'Images, media, documents, release assets, venue-branded content'],
  ['Legal Vault', 'Legal/privacy files, privacy acceptances, disclaimers, certification records'],
  ['Deployment Vault', 'Remote deployment records, release notes, version history, rollback records'],
  ['Audit Vault', 'Audit logs, bug reports, support tickets, system configuration changes'],
]

const remoteControls = [
  ['Deployment status', 'Production channels monitored'],
  ['Current software version', 'CRAFTHUB 360 1.0.0'],
  ['Pending updates', '4 venue updates queued'],
  ['Venue update queue', 'Tenant-safe rollout lanes'],
  ['Last push date/time', 'Today 16:40 ET'],
  ['Failed updates', '1 retry scheduled'],
  ['Rollback option', 'Available per venueId'],
  ['Maintenance mode', 'Per-tenant lockout ready'],
  ['Emergency lockout', 'Founder-only action'],
  ['Module release manager', 'CraftHub / E.A.T. / POS / Passport'],
  ['Content push manager', 'Craft education, specials, ticker'],
  ['Legal update push', 'Template + acceptance flow'],
  ['Ticker update push', 'Master template to local venue'],
  ['Role update push', 'Permission matrix staged'],
]

const remotePushActions = [
  'Push UI update',
  'Push module update',
  'Push content update',
  'Push CraftHub update',
  'Push E.A.T. update',
  'Push POS 3 update',
  'Push ticket ticker update',
  'Push DayOne360 placement update',
  'Push privacy/legal update',
  'Push demo mode update',
  'Push access control update',
  'Put venue into maintenance mode',
  'Deactivate module',
  'Reactivate module',
]

const connectedVenues = [
  {
    name: 'The Reserve Lounge',
    venueId: 'venue_reserve_atl_001',
    location: 'Atlanta, GA',
    license: 'Enterprise Active',
    modules: 'CraftHub, E.A.T., POS 3, Passport',
    version: '1.0.0',
    sync: '3 min ago',
    health: 'Healthy',
    alerts: '2',
  },
  {
    name: 'Cigar Country House',
    venueId: 'venue_dr_craft_014',
    location: 'Santiago, DR',
    license: 'Travel Pilot',
    modules: 'SmokeCraft, Passport, DayOne360',
    version: '0.9.8',
    sync: '18 min ago',
    health: 'Watch',
    alerts: '4',
  },
  {
    name: 'Cellar & Ember Club',
    venueId: 'venue_cellar_022',
    location: 'Miami, FL',
    license: 'Manager Hub Active',
    modules: 'WineCraft, PourCraft, E.A.T., POS 3',
    version: '1.0.0',
    sync: '8 min ago',
    health: 'Healthy',
    alerts: '1',
  },
]

const venueMirrorTools = [
  'Venue Overview',
  'CraftHub',
  'E.A.T. Command Center',
  'POS 3',
  'SmokeCraft 360',
  'PourCraft',
  'WineCraft',
  'BeerCraft',
  'Kitchen / Food Experiences',
  'Events',
  'Ticket Ticker',
  'Staff Terminal',
  'Mentor Console',
  'Passport Members',
  'Sensory Profiles',
  'Leaderboard',
  'DayOne360 Travel',
  'Reports',
  'Venue Settings',
]

const venueManagerCan = [
  'Manage local specials',
  'Manage local events',
  'Manage local ticket ticker',
  'View staff activity',
  'View guest experience flow',
  'View Passport engagement',
  'View sensory profile insights',
  'View E.A.T. alerts',
  'View POS 3 reports',
  'View inventory signals',
  'Manage local menu/products',
  'Open CraftHub experiences',
  'Review local analytics',
]

const venueManagerCannot = [
  'See other venues',
  'Access global NOVEE Vault',
  'Control global deployments',
  'Access founder-only controls',
  'Access developer diagnostics unless allowed',
  'Manage system-wide licenses',
  'See global revenue data',
  'Change master legal/privacy templates unless allowed',
  'Access private founder data',
]

const dataEntities = [
  'User',
  'Role',
  'Venue',
  'VenueLicense',
  'VenueModule',
  'RemoteDeployment',
  'SystemVersion',
  'AuditLog',
  'PassportProfile',
  'SensoryProfile',
  'Experience',
  'ExperienceCompletion',
  'Event',
  'Special',
  'TicketTickerItem',
  'EATStatus',
  'POSRecord',
  'InventorySignal',
  'MentorSession',
  'StaffActivity',
  'Asset',
  'LegalDocument',
  'PrivacyAcceptance',
  'SupportTicket',
  'DemoState',
  'CertificationRecord',
]

const eatVenueBrain = [
  'Kitchen workflow',
  'Bar workflow',
  'Humidor workflow',
  'Food specials',
  'Drink specials',
  'Cigar specials',
  'Event announcements',
  'Guest requests',
  'Staff alerts',
  'Inventory warnings',
  'POS 3 signals',
  'Craft screen prompts',
  'Ticker/tapper content',
]

const posVenueSignals = [
  'Food orders',
  'Drink orders',
  'Cigar orders',
  'Specials',
  'Guest tabs',
  'Membership discounts',
  'Passport rewards',
  'Staff checkout',
  'Inventory',
  'Reports',
]

export function Section({ eyebrow, title, children, className = '' }) {
  return (
    <section className={`relative z-10 mx-auto w-full max-w-7xl ${className}`}>
      <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">{eyebrow}</p>
          <h2 className="mt-1 font-headline-xl text-2xl tracking-wide text-on-surface md:text-4xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

export function TouchButton({ children, onClick, variant = 'outline', className = '' }) {
  const filled = variant === 'filled'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`haptic-pulse inline-flex min-h-[52px] items-center justify-center rounded-md px-5 text-sm font-black uppercase tracking-[0.16em] transition-all ${
        filled
          ? 'gold-foil text-[#201405] shadow-[0_0_28px_rgba(233,193,118,0.22)]'
          : 'border border-primary/40 bg-black/25 text-primary hover:border-primary/60 hover:bg-primary/10'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function StatPill({ label, value }) {
  return (
    <div className="min-h-[82px] rounded-md border border-primary/20 bg-black/30 p-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/70">{label}</p>
      <p className="mt-2 text-lg font-bold text-[#ead6a6]">{value}</p>
    </div>
  )
}

export function CommandHubHeader({ navigate, isDemoMode, roleLabel }) {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/15 bg-[#0e0c0a]/90 shadow-[0_14px_44px_rgba(0,0,0,0.52)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[92px] max-w-container-max-width items-center justify-between gap-4 px-gutter">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-md border border-primary/20 bg-black/20 text-primary">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <button type="button" onClick={() => navigate('/home')} aria-label="Home" className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-md border border-primary/20 bg-black/20 text-primary">
            <span className="material-symbols-outlined text-2xl">home</span>
          </button>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-primary/70">Command Hub</p>
            <h1 className="truncate font-display-lg text-2xl uppercase tracking-[0.18em] text-primary md:text-4xl">CRAFTHUB 360</h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Console Active</div>
          <div className="rounded-md border border-primary/25 bg-primary/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-primary">{isDemoMode ? 'Demo User' : roleLabel}</div>
          {isDemoMode && <div className="rounded-md border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-100">Demo Mode Active</div>}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/passport')} aria-label="Passport" className="hidden min-h-[52px] items-center gap-2 rounded-md border border-primary/25 bg-black/25 px-4 text-sm font-black uppercase tracking-[0.14em] text-primary md:flex">
            <span className="material-symbols-outlined">id_card</span>
            Passport
          </button>
          <button type="button" disabled aria-label="Notifications" title="Notifications center — coming soon" className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-md border border-primary/20 bg-black/20 text-primary opacity-40 cursor-not-allowed">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" onClick={() => navigate('/system-overview')} aria-label="Settings" title="System settings and overview" className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-md border border-primary/20 bg-black/20 text-primary">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button type="button" onClick={() => navigate('/passport')} aria-label="User Passport" className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-surface-container-high">
            <img src={MEMBER_AVATAR} alt="Member Passport" className="h-full w-full object-cover" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function SystemOverviewPanel({ navigate, isDemoMode, onDemo }) {
  return (
    <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="glass-morphism relative min-h-[460px] overflow-hidden rounded-lg border border-primary/20 p-6 md:p-10">
        <img src="/background-lounge-airy.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0905] via-[#0d0905]/85 to-[#0d0905]/45" />
        <div className="relative flex h-full max-w-4xl flex-col justify-end">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-primary/75">Private Club Operating System</p>
          <h2 className="mt-3 font-display-lg text-5xl uppercase tracking-[0.12em] text-primary md:text-7xl">CRAFTHUB 360</h2>
          <p className="mt-2 font-headline-xl text-2xl text-on-surface md:text-4xl">CraftHub venue/table operating experience</p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">
            CraftHub 360 connects guest table sessions, staff handoff, POS 3 transactions, E.A.T. manager operations, inventory, events, and venue service flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TouchButton onClick={() => navigate('/ultra-command-center')} variant="filled">Open Ultra Command</TouchButton>
            <TouchButton onClick={() => navigate('/venue-mirror')}>Open Manager Hub</TouchButton>
            <TouchButton onClick={onDemo}>{isDemoMode ? 'Demo Active' : 'Enter Demo Mode'}</TouchButton>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {summaryTiles.map(([label, value, detail]) => (
          <div key={label} className="rounded-lg border border-primary/20 bg-black/30 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/70">{label}</p>
                <p className="mt-2 text-2xl font-bold text-on-surface">{value}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{detail}</p>
              </div>
              <span className="status-dot mt-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function TwoLayerArchitecturePanel({ navigate }) {
  return (
    <Section eyebrow="Two-Layer Architecture" title="CraftHub 360 Venue Flow">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-morphism relative overflow-hidden rounded-lg p-6 md:p-8">
          <img src="/crafthub-gold.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">Layer 1 · Mothership</p>
            <h3 className="mt-2 font-headline-xl text-4xl text-primary">CRAFTHUB 360 E.A.T. Command Hub</h3>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Founder, admin, and developer master control for software, venues, licenses, modules, deployments, vault data, diagnostics, users, roles, security, analytics, and remote updates.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Founder cockpit', 'Secure vault', 'Mission control', 'Enterprise deployment control'].map((item) => (
                <div key={item} className="min-h-[70px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-semibold text-[#ead6a6]">{item}</div>
              ))}
            </div>
            <div className="mt-6">
              <TouchButton onClick={() => navigate('/ultra-command-center')} variant="filled">Open E.A.T. Command Hub</TouchButton>
            </div>
          </div>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-lg p-6 md:p-8">
          <img src="/background-lounge-airy.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">Layer 2 · Establishment Tenant</p>
            <h3 className="mt-2 font-headline-xl text-4xl text-on-surface">E.A.T. Manager Command Hub</h3>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Establishment-level management interface for licensed venues with E.A.T., POS 3, CraftHub, Passport, staff workflow, local specials, and local analytics scoped by venueId.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Tenant-safe data', 'Local venue tools', 'E.A.T. + POS 3 installed', 'Mirrors CRAFTHUB 360 visually'].map((item) => (
                <div key={item} className="min-h-[70px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-semibold text-[#ead6a6]">{item}</div>
              ))}
            </div>
            <div className="mt-6">
              <TouchButton onClick={() => navigate('/venue-mirror')}>Open Manager Hub</TouchButton>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export function UltraCommandCenterPanel({ navigate }) {
  return (
    <Section eyebrow="Layer 1 · E.A.T. Command Hub" title="Founder/master software control system">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-morphism rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Mothership Control</p>
          <h3 className="mt-2 font-headline-xl text-3xl text-primary">John Collins / NOVEE ownership command cockpit</h3>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">
            E.A.T. Command Hub controls global software, tenant licensing, deployments, vault data, security, AMBI intelligence, analytics, support, and founder-only systems.
          </p>
          <div className="mt-6">
            <TouchButton onClick={() => navigate('/ultra-command-center')} variant="filled">Open Ultra Command</TouchButton>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ultraCommandSections.map((item) => (
            <div key={item} className="min-h-[80px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-bold leading-6 text-on-surface-variant">{item}</div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-primary/20 bg-black/30 p-5">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">Founder/Admin/Developer actions</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ultraActions.map((item) => (
            <div key={item} className="rounded-md border border-primary/15 bg-[#15110d]/85 p-4 text-sm leading-6 text-[#ead6a6]">{item}</div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function NoveeVaultPanel({ navigate }) {
  return (
    <Section eyebrow="NOVEE Vault" title="Protected system data organized by domain">
      <div className="glass-morphism rounded-lg p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Secure vault layer</p>
            <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Venue, identity, experience, legal, deployment, and audit records</h3>
            <p className="mt-4 max-w-4xl text-base leading-7 text-on-surface-variant">The Vault is the premium system of record for CRAFTHUB 360. It separates global founder data from venue-scoped tenant records and organizes sensitive operating assets by function.</p>
          </div>
          <TouchButton onClick={() => navigate('/novee-vault')}>Open Vault</TouchButton>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {vaultSections.map(([title, detail]) => (
            <div key={title} className="min-h-[148px] rounded-md border border-primary/20 bg-black/30 p-4">
              <p className="font-bold text-primary">{title}</p>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function RemoteSoftwareControlPanel({ navigate }) {
  return (
    <Section eyebrow="Remote Software Control" title="Deployment, content, legal, ticker, and access push control">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="glass-panel rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Deployment control</p>
          <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Serious software release management</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {remoteControls.map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
          </div>
          <div className="mt-6">
            <TouchButton onClick={() => navigate('/remote-software-control')} variant="filled">Open Remote Control</TouchButton>
          </div>
        </div>
        <div className="glass-morphism rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Remote push actions</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {remotePushActions.map((item) => (
              <button
                key={item}
                type="button"
                disabled
                title="Remote push control is not yet available — open Remote Control for status"
                className="min-h-[64px] rounded-md border border-primary/20 bg-black/25 px-4 text-left text-sm font-bold leading-6 text-[#ead6a6] opacity-40 cursor-not-allowed"
              >{item}</button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function ConnectedVenuesPanel({ navigate }) {
  return (
    <Section eyebrow="Connected Venues" title="Multi-tenant venue control by venueId">
      <div className="grid gap-5 xl:grid-cols-3">
        {connectedVenues.map((venue) => (
          <article key={venue.venueId} className="glass-morphism rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">{venue.venueId}</p>
                <h3 className="mt-2 font-headline-xl text-2xl text-on-surface">{venue.name}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{venue.location}</p>
              </div>
              <span className="status-dot mt-2" />
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ['License', venue.license],
                ['Active Modules', venue.modules],
                ['E.A.T. Status', 'Online'],
                ['POS 3 Status', 'Licensed'],
                ['CraftHub Status', 'Live'],
                ['Passport Status', 'Synced'],
                ['Software Version', venue.version],
                ['Last Sync', venue.sync],
                ['System Health', venue.health],
                ['Alerts', venue.alerts],
              ].map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
            </div>
            <div className="mt-5">
              <TouchButton onClick={() => navigate('/venue-mirror')} variant="filled">Open Manager Hub</TouchButton>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

export function VenueMirrorCommandHubPanel({ navigate }) {
  return (
    <Section eyebrow="Layer 2 · E.A.T. Manager Command Hub" title="Establishment-level operating shell">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-morphism rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Tenant interface</p>
          <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">A local mirror of CRAFTHUB 360 scoped to one establishment</h3>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">Manager Hub mimics the premium CRAFTHUB 360 experience, but only exposes local tools and local data for the licensed establishment. Every operational record is scoped by venueId.</p>
          <div className="mt-6">
            <TouchButton onClick={() => navigate('/venue-mirror')} variant="filled">Open Manager Hub</TouchButton>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {venueMirrorTools.map((item) => (
            <div key={item} className="min-h-[72px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-bold leading-6 text-[#ead6a6]">{item}</div>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-primary/20 bg-black/30 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">Venue managers can</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {venueManagerCan.map((item) => <div key={item} className="rounded-md border border-primary/15 bg-primary/10 p-4 text-sm leading-6 text-on-surface-variant">{item}</div>)}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200/20 bg-black/30 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100/75">Venue managers cannot</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {venueManagerCannot.map((item) => <div key={item} className="rounded-md border border-amber-200/15 bg-amber-200/10 p-4 text-sm leading-6 text-on-surface-variant">{item}</div>)}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function VenueOperationsArchitecturePanel() {
  return (
    <Section eyebrow="Manager Hub Internals" title="E.A.T., POS 3, CraftHub, and Passport inside the venue">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">E.A.T. inside Manager Hub</p>
          <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Operational brain of the establishment</h3>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">E.A.T. connects kitchen, bar, humidor, events, specials, ticket ticker, guest requests, inventory signals, POS 3, craft screens, and staff alerts.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {eatVenueBrain.map((item) => <div key={item} className="rounded-md border border-primary/20 bg-black/25 p-4 text-sm font-semibold text-[#ead6a6]">{item}</div>)}
          </div>
        </div>
        <div className="glass-morphism rounded-lg p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">POS 3 inside Manager Hub</p>
          <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Touchscreen checkout and rewards layer</h3>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">POS 3 supports food, drinks, cigars, specials, guest tabs, membership discounts, Passport rewards, staff checkout, inventory, reports, and clean touch-first service flow.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {posVenueSignals.map((item) => <div key={item} className="rounded-md border border-primary/20 bg-black/25 p-4 text-sm font-semibold text-[#ead6a6]">{item}</div>)}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function TenantDataModelPanel() {
  return (
    <Section eyebrow="Multi-Tenant Data Model" title="Venue data stays separated by venueId">
      <div className="glass-morphism rounded-lg p-6 md:p-7">
        <p className="max-w-4xl text-base leading-7 text-on-surface-variant">CRAFTHUB 360 is ready for multi-tenant architecture. Global founder data, vault records, and deployment controls stay separate from venue-scoped operational data. Manager Hub reads and writes only the records allowed for its venueId.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {dataEntities.map((entity) => (
            <div key={entity} className="min-h-[66px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-bold text-[#ead6a6]">{entity}</div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function EcosystemMap() {
  return (
    <Section eyebrow="Ecosystem Map" title="One connected hospitality operating system">
      <div className="floorplan-bg rounded-lg border border-primary/20 bg-black/30 p-5 md:p-7">
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-6 text-center shadow-[0_0_34px_rgba(233,193,118,0.1)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary/75">Center Node</p>
              <h3 className="mt-3 font-display-lg text-5xl uppercase tracking-[0.14em] text-primary">CRAFTHUB 360</h3>
              <p className="mt-4 text-sm leading-6 text-on-surface-variant">Parent shell for guest journeys, staff workflow, venue intelligence, membership, and command access.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ecosystem.map(([node, branches]) => (
              <div key={node} className="rounded-lg border border-primary/20 bg-[#15110d]/85 p-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">{node}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <span key={branch} className="rounded-md border border-primary/15 bg-black/30 px-3 py-2 text-xs font-semibold text-on-surface-variant">{branch}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function CommandModuleCard({ module, navigate }) {
  return (
    <article className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-primary/20 bg-black/30 shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition-all hover:border-primary/50 hover:shadow-[0_0_34px_rgba(233,193,118,0.12)]">
      <div className="relative h-36 overflow-hidden">
        <img src={module.image} alt="" className="h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b07] via-[#0f0b07]/40 to-transparent" />
        <div className="absolute left-4 top-4 rounded-md border border-primary/25 bg-black/45 px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.16em] text-primary">{module.status}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-headline-xl text-2xl text-primary">{module.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-on-surface-variant">{module.purpose}</p>
        <div className="mt-4 rounded-md border border-primary/15 bg-primary/10 p-3">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/70">Connected</p>
          <p className="mt-1 text-sm leading-6 text-[#ead6a6]">{module.connected}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-md border border-primary/20 bg-black/25 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">{module.access}</span>
          <TouchButton onClick={() => navigate(module.route)} className="min-w-[138px]">Open</TouchButton>
        </div>
      </div>
    </article>
  )
}

export function CommandModuleGrid({ navigate }) {
  return (
    <Section eyebrow="Command Modules" title="First-class system tiles">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {commandModules.map((module) => (
          <CommandModuleCard key={module.title} module={module} navigate={navigate} />
        ))}
      </div>
    </Section>
  )
}

export function PassportStatusPanel({ navigate }) {
  return (
    <div className="glass-morphism rounded-lg p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">360 Passport Connections</p>
      <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Embedded member identity layer</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {passportStatus.map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
      </div>
      <div className="mt-6">
        <TouchButton onClick={() => navigate('/passport')} variant="filled">Open Passport</TouchButton>
      </div>
    </div>
  )
}

export function EATOperationsPanel({ navigate }) {
  return (
    <div className="glass-panel rounded-lg p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">E.A.T. Command Center</p>
      <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Venue operations brain</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {eatStatus.map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
      </div>
      <div className="mt-6">
        <TouchButton onClick={() => navigate('/eat-command')}>Open E.A.T.</TouchButton>
      </div>
    </div>
  )
}

export function SensoryProfilePanel({ navigate }) {
  return (
    <div className="glass-morphism rounded-lg p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Sensory Profile Engine</p>
      <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Personalized recommendation intelligence</h3>
      <p className="mt-4 text-base leading-7 text-on-surface-variant">CRAFTHUB 360 translates flavor, aroma, strength, food, cigar, wine, beer, cocktail, ratings, and mentor notes into better next visits.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sensoryProfile.map(([label, value]) => <StatPill key={label} label={label} value={value} />)}
      </div>
      <div className="mt-6">
        <TouchButton onClick={() => navigate('/passport/profile')}>View Sensory Profile</TouchButton>
      </div>
    </div>
  )
}

export function GuestJourneyStrip() {
  return (
    <Section eyebrow="Guest Journey" title="From entry to recommendation">
      <div className="overflow-hidden rounded-lg border border-primary/20 bg-black/30 p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          {journey.map((step, index) => (
            <div key={step} className="relative min-h-[106px] rounded-md border border-primary/20 bg-[#15110d]/85 p-4">
              {index < journey.length - 1 && <span className="material-symbols-outlined absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-primary/55 xl:block">arrow_forward</span>}
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/65">Step {index + 1}</p>
              <p className="mt-3 text-sm font-bold leading-6 text-on-surface">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function RoleAccessPanel() {
  return (
    <div className="glass-panel rounded-lg p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Role-Based Access</p>
      <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">Controlled system lanes</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roles.map(([role, access]) => (
          <div key={role} className="rounded-md border border-primary/15 bg-black/25 p-4">
            <p className="font-bold text-primary">{role}</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{access}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DemoModePanel({ isDemoMode, onDemo }) {
  return (
    <div className="glass-morphism rounded-lg p-6 md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-primary/70">Safe Preview / Demo Mode</p>
      <h3 className="mt-2 font-headline-xl text-3xl text-on-surface">{isDemoMode ? 'Demo Mode Active' : 'Demo Mode Ready'}</h3>
      <p className="mt-4 text-base leading-7 text-on-surface-variant">
        Safe preview only. No real server calls, no real audit records, no payments, no inventory changes, no role changes.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ead6a6]">Allow demo access to</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoAllows.map((item) => <span key={item} className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-on-surface-variant">{item}</span>)}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ead6a6]">Block</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoBlocks.map((item) => <span key={item} className="rounded-md border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-semibold text-on-surface-variant">{item}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <TouchButton onClick={onDemo} variant="filled">{isDemoMode ? 'Demo Mode Active' : 'Enter Safe Preview'}</TouchButton>
      </div>
    </div>
  )
}

export function DayOneTravelPanel({ navigate }) {
  return (
    <Section eyebrow="DayOne360 Travel" title="Luxury lifestyle extension">
      <div className="glass-morphism relative overflow-hidden rounded-lg p-6 md:p-8">
        <img src="/background-lounge-airy.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="relative grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary/70">Venue-to-travel connection</p>
            <h3 className="mt-2 font-headline-xl text-4xl text-on-surface">DayOne360 connects membership memory to destination experiences.</h3>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">Travel concierge, craft tourism, VIP trips, relocation support, destination experiences, member travel perks, Dominican Republic workflows, and venue-to-travel connections stay inside the CRAFTHUB 360 journey.</p>
            <div className="mt-6">
              <TouchButton onClick={() => navigate('/dayone360')} variant="filled">Explore DayOne360</TouchButton>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {['Travel concierge', 'Craft tourism', 'VIP trips', 'Relocation support', 'Destination experiences', 'Member travel perks', 'Dominican Republic workflows', 'Venue-to-travel connections'].map((item) => (
              <div key={item} className="min-h-[96px] rounded-md border border-primary/20 bg-black/30 p-4 text-sm font-semibold leading-6 text-[#ead6a6]">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

export function CommandHub({ navigate, isDemoMode, onDemo, roleLabel }) {
  return (
    <div className="min-h-screen overflow-x-hidden pb-28 text-on-surface md:pb-12">
      <CommandHubHeader navigate={navigate} isDemoMode={isDemoMode} roleLabel={roleLabel} />
      <main className="relative flex flex-col gap-14 px-gutter py-10 md:gap-16">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-start justify-center pt-28">
          <img src="/crafthub-gold.jpg" alt="" className="w-[70%] max-w-[640px] opacity-[0.06]" />
        </div>
        <SystemOverviewPanel navigate={navigate} isDemoMode={isDemoMode} onDemo={onDemo} />
        <TwoLayerArchitecturePanel navigate={navigate} />
        <UltraCommandCenterPanel navigate={navigate} />
        <NoveeVaultPanel navigate={navigate} />
        <RemoteSoftwareControlPanel navigate={navigate} />
        <ConnectedVenuesPanel navigate={navigate} />
        <VenueMirrorCommandHubPanel navigate={navigate} />
        <VenueOperationsArchitecturePanel />
        <Section eyebrow="Ticket Tapper" title="Live from E.A.T. Command Center">
          <div className="overflow-hidden rounded-lg border border-primary/25 bg-black/30 shadow-[0_0_34px_rgba(201,168,76,0.08)]">
            <TicketTicker items={tickerItems} />
          </div>
        </Section>
        <EcosystemMap />
        <CommandModuleGrid navigate={navigate} />
        <Section eyebrow="Intelligence Panels" title="Passport, operations, and sensory memory">
          <div className="grid gap-6 xl:grid-cols-2">
            <PassportStatusPanel navigate={navigate} />
            <EATOperationsPanel navigate={navigate} />
          </div>
          <div className="mt-6">
            <SensoryProfilePanel navigate={navigate} />
          </div>
        </Section>
        <GuestJourneyStrip />
        <TenantDataModelPanel />
        <Section eyebrow="Access + Demo Controls" title="Professional role governance">
          <div className="grid gap-6 xl:grid-cols-2">
            <RoleAccessPanel />
            <DemoModePanel isDemoMode={isDemoMode} onDemo={onDemo} />
          </div>
        </Section>
        <DayOneTravelPanel navigate={navigate} />
      </main>

      <nav className="fixed bottom-0 z-50 w-full border-t border-primary/20 bg-surface-container-low/95 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:hidden">
        <div className="mx-auto grid h-[96px] max-w-4xl grid-cols-5 items-center">
          {[
            ['Home', '/home', 'chair'],
            ['Craft', '/crafthub', 'dashboard'],
            ['Smoke', '/smokecraft', 'local_fire_department'],
            ['Passport', '/passport', 'id_card'],
            ['Demo', null, 'visibility'],
          ].map(([label, route, icon]) => (
            <button
              key={label}
              type="button"
              onClick={() => (route ? navigate(route) : onDemo())}
              className="flex min-h-[76px] flex-col items-center justify-center gap-1 px-1 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-2xl">{icon}</span>
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
