// Novi module status service — Phase 6.
//
// Read-only accessor surface over src/modules/noviModuleRegistry.js. No
// function in this file writes to the registry, deploys anything, or
// contacts any device/vendor system — it only answers questions about the
// already-built Novi registry.

import { getNoviModule, listNoviModules, CONTROL_MODE } from '../modules/noviModuleRegistry.js'

export function getAllNoviModules() {
  return listNoviModules()
}

export function getNoviModuleById(moduleId) {
  return getNoviModule(moduleId)
}

export function getVendorAssignableModules() {
  return listNoviModules().filter(module => module.vendorAssignable === true)
}

export function getStandaloneModules() {
  return listNoviModules().filter(module => module.standaloneAllowed === true)
}

export function getNotReadyModules() {
  return listNoviModules().filter(module => module.controlMode === CONTROL_MODE.NOT_READY)
}

export function getModulesBySourceSystem(sourceSystem) {
  return listNoviModules().filter(module => module.sourceSystem === sourceSystem)
}

export default {
  getAllNoviModules,
  getNoviModuleById,
  getVendorAssignableModules,
  getStandaloneModules,
  getNotReadyModules,
  getModulesBySourceSystem,
}
