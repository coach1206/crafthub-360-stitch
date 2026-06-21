/**
 * POS 3 Integration Hub — default field mappings from generic external POS
 * record shapes (as produced by posProviderAdapters.js sample generators)
 * into POS3's normalized shapes. Used by posFieldMappingService.js and the
 * POSFieldMapper.jsx wizard step.
 */

export const DEFAULT_MENU_FIELD_MAPPING = {
  externalIdField: 'id',
  nameField: 'name',
  priceField: 'price',
  categoryField: 'category',
}

export const DEFAULT_ORDER_FIELD_MAPPING = {
  externalIdField: 'id',
  totalField: 'total',
  itemsField: 'items',
  statusField: 'status',
  createdAtField: 'createdAt',
}

export const DEFAULT_INVENTORY_FIELD_MAPPING = {
  skuField: 'sku',
  nameField: 'name',
  quantityField: 'quantityOnHand',
  parLevelField: 'parLevel',
}

export const DEFAULT_STAFF_FIELD_MAPPING = {
  externalIdField: 'id',
  nameField: 'name',
  roleField: 'role',
}

export function getDefaultFieldMappings() {
  return {
    menu: DEFAULT_MENU_FIELD_MAPPING,
    orders: DEFAULT_ORDER_FIELD_MAPPING,
    inventory: DEFAULT_INVENTORY_FIELD_MAPPING,
    staff: DEFAULT_STAFF_FIELD_MAPPING,
  }
}
