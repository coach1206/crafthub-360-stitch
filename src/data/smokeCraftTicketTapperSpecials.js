export const smokeCraftTicketTapperSpecialsSeed = {
  venueId: 'demo-venue-001',
  tableLabel: 'Table 12',

  settings: {
    ticketTapperEnabled: true,
    realTimeSpecialsEnabled: true,
    oneTapOrderingEnabled: true,
    inventoryGuardEnabled: true,
    moneyBridgeTrackingEnabled: true,
    localPreviewMode: true,
  },

  specials: [
    {
      id: 'special-smoked-wings-old-fashioned',
      title: 'Smoked Wings + Old Fashioned',
      subtitle: "Tonight's SmokeCraft Pairing",
      description: 'Smoked wings from Smokehouse Bites paired with a classic Old Fashioned.',
      specialType: 'partner_food_pairing',
      source: 'partner_network',

      createdBy: {
        staffId: 'staff-manager-demo',
        name: 'Demo Manager',
        role: 'manager',
      },

      promotedByRole: 'manager',

      status: 'active',
      priority: 1,

      startsAt: new Date().toISOString(),
      endsAt: null,

      inventory: {
        inventoryItemIds: ['smoked-wings', 'old-fashioned'],
        quantityAvailable: 12,
        quantitySold: 0,
        lowInventoryThreshold: 3,
        inventoryStatus: 'available',
        allowOversell: false,
      },

      pricing: {
        regularPrice: 28,
        specialPrice: 24,
        discountAmount: 4,
        discountPercent: 14.29,
      },

      items: [
        {
          id: 'smoked-wings',
          type: 'partner_food',
          name: 'Smoked Wings',
          partnerId: 'smokehouse-bites',
          source: 'partner_network',
          quantity: 1,
          unitPrice: 14,
          commissionEligible: true,
        },
        {
          id: 'old-fashioned',
          type: 'drink',
          name: 'Old Fashioned',
          partnerId: null,
          source: 'venue',
          quantity: 1,
          unitPrice: 10,
          commissionEligible: false,
        },
      ],

      media: {
        imageUrl: 'smokecraft/specials/smoked-wings-old-fashioned.png',
        badgeLabel: 'Tonight Only',
      },

      moneyBridge: {
        active: true,
        partnerIds: ['smokehouse-bites'],
        smokeCraftCommissionPercent: 10,
        venueReferralPercent: 5,
        settlementStatus: 'pending_preview',
      },

      callToAction: {
        label: 'Add Special',
        action: 'one_tap_add',
      },
    },

    {
      id: 'special-bartender-old-fashioned',
      title: "Bartender's Old Fashioned",
      subtitle: 'House Favorite',
      description: 'A smooth Old Fashioned selected by the bartender for tonight\'s guests.',
      specialType: 'drink_special',
      source: 'venue',

      createdBy: {
        staffId: 'staff-bartender-demo',
        name: 'Demo Bartender',
        role: 'bartender',
      },

      promotedByRole: 'bartender',

      status: 'active',
      priority: 2,

      startsAt: new Date().toISOString(),
      endsAt: null,

      inventory: {
        inventoryItemIds: ['old-fashioned'],
        quantityAvailable: 18,
        quantitySold: 0,
        lowInventoryThreshold: 4,
        inventoryStatus: 'available',
        allowOversell: false,
      },

      pricing: {
        regularPrice: 14,
        specialPrice: 11,
        discountAmount: 3,
        discountPercent: 21.43,
      },

      items: [
        {
          id: 'old-fashioned',
          type: 'drink',
          name: 'Old Fashioned',
          partnerId: null,
          source: 'venue',
          quantity: 1,
          unitPrice: 11,
          commissionEligible: false,
        },
      ],

      media: {
        imageUrl: 'smokecraft/specials/old-fashioned-special.png',
        badgeLabel: 'Bartender Pick',
      },

      moneyBridge: {
        active: false,
        partnerIds: [],
        smokeCraftCommissionPercent: 0,
        venueReferralPercent: 0,
        settlementStatus: 'not_partner_related',
      },

      callToAction: {
        label: 'Add Drink',
        action: 'one_tap_add',
      },
    },

    {
      id: 'special-chef-loaded-fries',
      title: 'Loaded Brisket Fries',
      subtitle: "Cook's Push Special",
      description: 'Crispy fries topped with brisket, cheese, jalapeños, and BBQ sauce.',
      specialType: 'partner_food_special',
      source: 'partner_network',

      createdBy: {
        staffId: 'staff-cook-demo',
        name: 'Demo Cook',
        role: 'cook',
      },

      promotedByRole: 'cook',

      status: 'active',
      priority: 3,

      startsAt: new Date().toISOString(),
      endsAt: null,

      inventory: {
        inventoryItemIds: ['loaded-brisket-fries'],
        quantityAvailable: 7,
        quantitySold: 0,
        lowInventoryThreshold: 3,
        inventoryStatus: 'available',
        allowOversell: false,
      },

      pricing: {
        regularPrice: 13,
        specialPrice: 10,
        discountAmount: 3,
        discountPercent: 23.08,
      },

      items: [
        {
          id: 'loaded-brisket-fries',
          type: 'partner_food',
          name: 'Loaded Brisket Fries',
          partnerId: 'smokehouse-bites',
          source: 'partner_network',
          quantity: 1,
          unitPrice: 10,
          commissionEligible: true,
        },
      ],

      media: {
        imageUrl: 'smokecraft/specials/loaded-fries-special.png',
        badgeLabel: 'Only 7 Left',
      },

      moneyBridge: {
        active: true,
        partnerIds: ['smokehouse-bites'],
        smokeCraftCommissionPercent: 10,
        venueReferralPercent: 5,
        settlementStatus: 'pending_preview',
      },

      callToAction: {
        label: 'Add Food',
        action: 'one_tap_add',
      },
    },
  ],
}
