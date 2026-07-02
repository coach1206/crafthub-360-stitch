export function publicAsset(path) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return clean
}

export function publicSmokeCraftAsset(filename) {
  return `/assets/smokecraft/${filename}`
}
