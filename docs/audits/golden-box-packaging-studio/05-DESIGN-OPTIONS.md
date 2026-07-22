# Design Options

Every option list below is enforced server-side by `buildConfig()`/`validateEnum()` in `packagingStudioService.js` — the database stores stable snake_case keys, never display labels. No option is auto-selected for a new design.

| Field | Approved keys |
|---|---|
| Wood type | `spanish_cedar`, `mahogany`, `walnut`, `oak`, `maple`, `cherry`, `black_lacquer`, `natural_unfinished` |
| Finish | `natural`, `matte`, `satin`, `gloss`, `high_gloss`, `distressed`, `smoked`, `lacquered` |
| Lid style | `hinged`, `lift_off`, `slide_top`, `book_style`, `magnetic_close` |
| Closure | `none`, `magnetic`, `brass_latch`, `champagne_gold_latch`, `wooden_clasp` |
| Interior lining | `natural_cedar`, `suede`, `velvet`, `leather`, `fabric`, `paper_wrap`, `unlined` |
| Tray configuration | `single_layer`, `double_layer`, `removable_tray`, `individual_channels`, `open_presentation_bed` |

Color fields (`exteriorColor`, `interiorAccentColor`, `textColor`, `hardwareColor`) accept only a strict 6-digit hex pattern (`^#[0-9a-fA-F]{6}$`) — no arbitrary CSS string is ever accepted, closing any script-injection-via-color-value path.

Text fields (`boxName`, `subtitle`, `engravedText`, `frontText`, `lidText`, `sideText`, `interiorLidText`, `blendName`, `dedication`, `designNotes`) are length-capped per field and reject any `<`/`>` character outright.
