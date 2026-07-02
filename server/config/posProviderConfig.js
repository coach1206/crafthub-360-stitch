/**
 * POS Provider environment config contract for CraftHub 360 Stitch.
 *
 * Checks required env vars per provider without ever returning their values.
 * Only reports which vars are present (boolean) or missing (listed by name).
 */

const PROVIDER_ENV_REQUIREMENTS = {
  square: [
    'SQUARE_APP_ID',
    'SQUARE_APP_SECRET',
    'SQUARE_ENVIRONMENT',
    'SQUARE_WEBHOOK_SIGNATURE_KEY',
  ],
  toast: [
    'TOAST_CLIENT_ID',
    'TOAST_CLIENT_SECRET',
    'TOAST_ENVIRONMENT',
    'TOAST_PARTNER_STATUS',
  ],
  clover: [
    'CLOVER_APP_ID',
    'CLOVER_APP_SECRET',
    'CLOVER_ENVIRONMENT',
  ],
  lightspeed: [
    'LIGHTSPEED_CLIENT_ID',
    'LIGHTSPEED_CLIENT_SECRET',
    'LIGHTSPEED_ENVIRONMENT',
  ],
  shopify_pos: [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_APP_URL',
    'SHOPIFY_WEBHOOK_SECRET',
  ],
  manual_pos360: [], // No env vars required — always ready
};

const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_ENV_REQUIREMENTS);

/**
 * Return env config metadata for a provider.
 * Never returns actual env var values.
 *
 * @param {string} providerName
 * @returns {{ providerName: string, requiredVars: string[], presentVars: string[], missingVars: string[] } | null}
 */
export function getProviderConfig(providerName) {
  if (!SUPPORTED_PROVIDERS.includes(providerName)) {
    return null;
  }

  const required = PROVIDER_ENV_REQUIREMENTS[providerName];
  const presentVars = [];
  const missingVars = [];

  for (const varName of required) {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  }

  return {
    providerName,
    requiredVars: required,
    presentVars,    // list of var names that ARE set (not values)
    missingVars,    // list of var names that are NOT set
  };
}

/**
 * Return readiness status for a provider based on env var presence.
 *
 * @param {string} providerName
 * @returns {{ providerName: string, readinessStatus: string, missingVars: string[], manualModeAvailable: boolean }}
 */
export function getProviderReadiness(providerName) {
  if (!SUPPORTED_PROVIDERS.includes(providerName)) {
    return {
      providerName,
      readinessStatus: 'integration_required',
      missingVars: [],
      manualModeAvailable: true,
      message: `Unknown provider: ${providerName}`,
    };
  }

  if (providerName === 'manual_pos360') {
    return {
      providerName,
      readinessStatus: 'manual_mode',
      missingVars: [],
      manualModeAvailable: true,
      message: 'Manual POS360 requires no credentials — always ready.',
    };
  }

  const config = getProviderConfig(providerName);
  const allPresent = config.missingVars.length === 0;

  return {
    providerName,
    readinessStatus: allPresent ? 'oauth_required' : 'credentials_missing',
    missingVars: config.missingVars,
    manualModeAvailable: true,
    message: allPresent
      ? `All env vars present. OAuth not yet completed.`
      : `Missing env vars: ${config.missingVars.join(', ')}`,
  };
}

/**
 * Return readiness status for all supported providers.
 *
 * @returns {Array<{ providerName: string, readinessStatus: string, missingVars: string[], manualModeAvailable: boolean }>}
 */
export function listProviderReadiness() {
  return SUPPORTED_PROVIDERS.map((providerName) =>
    getProviderReadiness(providerName)
  );
}

export { SUPPORTED_PROVIDERS };
