/** POS 3 credential status. Raw credentials are never returned. */
const PROVIDER_ENV_KEYS=Object.freeze({
 prototype:[],clover:['CLOVER_API_KEY','CLOVER_MERCHANT_ID'],toast:['TOAST_CLIENT_ID','TOAST_CLIENT_SECRET','TOAST_LOCATION_GUID'],square:['SQUARE_ACCESS_TOKEN','SQUARE_LOCATION_ID'],shopify:['SHOPIFY_STORE_URL','SHOPIFY_ACCESS_TOKEN'],lightspeed:['LIGHTSPEED_CLIENT_ID','LIGHTSPEED_CLIENT_SECRET','LIGHTSPEED_BUSINESS_ID'],epos_now:['EPOS_NOW_API_KEY','EPOS_NOW_API_SECRET'],ncr:['NCR_API_KEY','NCR_ENTERPRISE_UNIT','NCR_SITE_ID'],micros:['MICROS_API_KEY','MICROS_PROPERTY_ID','MICROS_RVC_SEQ']
})
export function getCredentialStatus(providerKey){
 const requiredKeys=PROVIDER_ENV_KEYS[providerKey]||[]
 if(providerKey==='prototype')return{providerKey,configured:true,mode:'prototype',missingKeys:[]}
 const missingKeys=requiredKeys.filter(k=>!process.env[k])
 return{providerKey,configured:missingKeys.length===0,mode:missingKeys.length===0?'live':'prototype',missingKeys}
}
export const getAllCredentialStatuses=()=>Object.keys(PROVIDER_ENV_KEYS).map(getCredentialStatus)
export const isProviderReady=providerKey=>providerKey==='prototype'||getCredentialStatus(providerKey).configured
