# SmokeCraft Cigar Format Photos

Required files (exact filenames, used directly by `src/pages/smokecraft/Format.jsx`):

```
robusto.jpg
toro.jpg
churchill.jpg
corona.jpg
gordo.jpg
torpedo-figurado.jpg
```

## Per-file requirements

**robusto.jpg**
Short, thick cigar. Horizontal. Full cigar visible. Band visible. Premium dark background. No glass. No hand. No lighter. No ashtray dominance.

**toro.jpg**
Longer balanced cigar. Horizontal. Full body visible. Premium dark background. No glass. No torch dominance.

**churchill.jpg**
Longest slim cigar. Horizontal. Full length visible. Premium dark background. No glass.

**corona.jpg**
Small slim cigar. Horizontal. Compact but clearly thinner. Premium dark background. No glass.

**gordo.jpg**
Thickest big ring gauge cigar. Horizontal. Body width should be obvious. Premium dark background. No glass.

**torpedo-figurado.jpg**
Tapered/pointed head cigar. Horizontal. Taper clearly visible. Premium dark background. No glass.

## Minimum requirements (all files)

- 1600x900 or larger.
- Cigar must be dominant subject.
- No whiskey glass.
- No lounge as main subject.
- No passport.
- No logo.
- No abstract smoke-only image.

## Behavior when missing

Until a file above is added, `Format.jsx` renders a premium "Required cigar photo missing" panel
naming the exact filename instead of substituting any other image.
