// Shared image-upload validation for SmokeCraft (Passport Media Upload, Member
// Portrait upload, and any future SmokeCraft image field). Only PNG, JPG,
// JPEG, and WEBP are accepted everywhere in SmokeCraft.

export const ACCEPTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const ACCEPTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
export const ACCEPT_ATTRIBUTE = 'image/png,image/jpeg,image/jpg,image/webp'
export const REJECTED_IMAGE_MESSAGE = 'Please upload a PNG, JPG, JPEG, or WEBP image only.'

function extensionOf(filename) {
  const match = /\.([a-z0-9]+)$/i.exec(filename || '')
  return match ? match[1].toLowerCase() : ''
}

/** Returns true if the file is an allowed SmokeCraft image type, checking MIME first and falling back to extension. */
export function isAllowedSmokeCraftImage(file) {
  if (!file) return false
  if (file.type && ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) return true
  if (!file.type) return ACCEPTED_IMAGE_EXTENSIONS.includes(extensionOf(file.name))
  return false
}
