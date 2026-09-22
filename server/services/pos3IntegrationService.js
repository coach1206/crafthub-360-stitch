import * as prototype from '../integrations/pos3/providers/prototypeProvider.js'
import * as clover from '../integrations/pos3/providers/cloverProvider.js'
import * as toast from '../integrations/pos3/providers/toastProvider.js'
import * as square from '../integrations/pos3/providers/squareProvider.js'
import * as shopify from '../integrations/pos3/providers/shopifyProvider.js'
import * as lightspeed from '../integrations/pos3/providers/lightspeedProvider.js'
import * as epos_now from '../integrations/pos3/providers/eposNowProvider.js'
import * as ncr from '../integrations/pos3/providers/ncrProvider.js'
import * as micros from '../integrations/pos3/providers/microsProvider.js'
import {POS3_PROVIDER_REGISTRY,isKnownProvider} from '../integrations/pos3/pos3ProviderRegistry.js'
import {getCredentialStatus} from '../integrations/pos3/pos3CredentialVault.js'
const ADAPTERS={prototype,clover,toast,square,shopify,lightspeed,epos_now,ncr,micros}
export const getProvider=key=>ADAPTERS[key]||null
export const listProviders=()=>POS3_PROVIDER_REGISTRY.map(meta=>({...meta,credentialStatus:getCredentialStatus(meta.key)}))
export function getProviderStatus(key){if(!isKnownProvider(key))return{success:false,message:`Unknown provider: ${key}`};const adapter=ADAPTERS[key];return{...adapter.getConnectionStatus(),credentialStatus:getCredentialStatus(key)}}
export async function testProviderConnection(key){if(!isKnownProvider(key))return{success:false,message:`Unknown provider: ${key}`};const adapter=ADAPTERS[key],creds=getCredentialStatus(key);if(key!=='prototype'&&!creds.configured)return{success:false,provider:key,mode:'not_configured',message:`Cannot test connection — missing credentials: ${creds.missingKeys.join(', ')}`};return adapter.validateCredentials()}
export async function fetchFromProvider(key,method,...args){const adapter=ADAPTERS[key];if(!adapter)return{success:false,message:`Unknown provider: ${key}`};if(typeof adapter[method]!=='function')return{success:false,message:`Method ${method} not found on provider ${key}`};try{return await Promise.resolve(adapter[method](...args))}catch(err){console.error(`[pos3Service] ${key}.${method}:`,err.message);return{success:false,provider:key,message:`Provider error: ${err.message}`}}}
