#!/usr/bin/env node
// SmokeCraft 360 — Block 4: real integration connection-state check.
// Calls the actual server-side connectionStateService.getIntegrationStatuses()
// against the live database — genuine DB queries, not a static/import-only
// check — to get ground-truth PASS/FAIL evidence for POS360, E.A.T., Ticket
// Tapper, Management Sync, and every other declared downstream integration.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crafthub_smokecraft_final'
import { getIntegrationStatuses } from '../server/services/managementSync/connectionStateService.js'

const venueId = process.argv[2] || '1'

const result = await getIntegrationStatuses(venueId)
console.log(JSON.stringify(result, null, 2))
