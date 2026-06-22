// Secure upload-link placeholders for the SmokeCraft Passport Media Upload
// card. No SMS or email provider is wired into this project yet, so these
// functions create the link/record shape and return a "pending delivery"
// status instead of pretending to send anything.

export function createUploadLink({ sessionId, userId, guestId, smokeCraftPassportId }) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  return {
    sessionId: sessionId || null,
    userId: userId || null,
    guestId: guestId || null,
    smokeCraftPassportId: smokeCraftPassportId || null,
    uploadType: 'mentor_participation',
    uploadLink: `/smokecraft/upload/${token}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    status: 'link_created_pending_delivery',
    uploadedImageUrl: null,
  }
}

// TODO: Wire to a real SMS provider (e.g. Twilio) when one exists for this project.
export function sendUploadLinkByText(phoneNumber, uploadLink) {
  return {
    delivered: false,
    method: 'sms',
    phoneNumber,
    uploadLink,
    message: 'Upload link created. Connect SMS provider to send this by text.',
  }
}

// TODO: Wire to a real email provider (e.g. SES, Postmark) when one exists for this project.
export function sendUploadLinkByEmail(email, uploadLink) {
  return {
    delivered: false,
    method: 'email',
    email,
    uploadLink,
    message: 'Upload link created. Connect email provider to send this by email.',
  }
}
