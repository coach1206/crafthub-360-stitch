/**
 * Package 3 — seeds verified foundational educational content into
 * golden_box_component_catalog (extended, migration 079),
 * smokecraft_flavor_notes, and smokecraft_component_compatibility.
 * Every record has real, substantive educational text — not a
 * one-line placeholder. No supplier/brand/medical claims. Idempotent
 * (ON CONFLICT DO NOTHING on the natural unique keys).
 *
 * Run: DATABASE_URL=... node server/db/seeds/seedSmokecraftEducationalContent.mjs
 */
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// ── Seed genetics (closure pass) — keys match SeedSoil.jsx's existing
// approved hotspot vocabulary exactly, so a future screen rebuild wires
// directly into this content without a second vocabulary. ────────────
const GENETICS = [
  { key: 'criollo', name: 'Criollo', why: 'One of the oldest cultivated cigar-tobacco varieties, historically foundational to Cuban-seed lineage.', flavor: 'Often associated with a balanced, aromatic profile — but the specific taste of any given plant depends heavily on where and how it is grown, not the seed alone.', strength: 'Typically mild-to-medium, though this varies significantly by growing region and processing.', quality: 'Valued historically for disease resistance and consistent leaf structure.', decision: 'A useful starting point for understanding classic cigar lineage, not a guarantee of a specific taste.' },
  { key: 'corojo', name: 'Corojo', why: 'Developed in Cuba\'s Vuelta Abajo region, historically prized as a wrapper-leaf variety.', flavor: 'Associated with a spicier character in many regional expressions, though this is not universal or guaranteed.', quality: 'Became less common in pure form after disease pressures in the mid-20th century; many modern "Corojo" leaves are hybridized descendants.', decision: 'Useful for understanding wrapper-leaf history; modern usage of the name varies by grower.' },
  { key: 'habano', name: 'Habano', why: 'A broad family of seed varieties tracing lineage to Cuban tobacco, now grown in many countries.', flavor: 'No single flavor profile — "Habano seed" grown in Nicaragua, Ecuador, or elsewhere can taste quite different due to soil and climate.', quality: 'Widely used for both wrapper and filler depending on growing conditions and selection.', decision: 'A reminder that seed variety is only one of many factors shaping the final leaf — never assume by name alone.' },
  { key: 'connecticut-broadleaf', name: 'Connecticut Broadleaf', why: 'A thick, dark leaf variety grown in the Connecticut River Valley (USA), traditionally shade- or sun-grown for wrapper and binder use.', flavor: 'Associated with a richer, often sweeter character in Maduro-style wrappers, though processing (fermentation) drives much of this.', quality: 'Thicker and more robust than Connecticut Shade, better suited to darker wrapper styles.', decision: 'Consider alongside the intended processing method (e.g. extended fermentation) rather than in isolation.' },
  { key: 'connecticut-shade', name: 'Connecticut Shade', why: 'A lighter, thinner leaf variety, traditionally grown under cheesecloth tents ("shade-grown") in the Connecticut River Valley.', flavor: 'Associated with a milder, more delicate character, prized for a smooth wrapper — but not a guarantee across every grower.', quality: 'Prized for its light color, thin structure, and elasticity, common on milder cigars.', decision: 'A common reference point for "mild wrapper" — useful for comparison, not an absolute rule.' },
]

// ── Origins / countries / regions (closure pass) ─────────────────────
const ORIGINS = [
  { type: 'country', key: 'dominican-republic', name: 'Dominican Republic', why: 'One of the largest cigar-tobacco-producing countries, home to the Cibao Valley among other growing areas.', flavor: 'Often associated with balanced, refined profiles, but individual farms and processing vary widely.', decision: 'Country of origin is a starting point for understanding a blend\'s heritage, never a full prediction of taste.' },
  { type: 'country', key: 'nicaragua', name: 'Nicaragua', why: 'A major producer known for volcanic-soil growing regions like Estelí and Jalapa.', flavor: 'Frequently associated with fuller-bodied, spicier profiles, especially from Estelí-grown ligero, though this varies by farm.', decision: 'Consider alongside the specific region and soil type, not country alone.' },
  { type: 'country', key: 'honduras', name: 'Honduras', why: 'A significant producer, particularly the Copán and Jamastran valleys.', flavor: 'Often associated with earthy, robust profiles, though individual blends vary considerably.', decision: 'One of several Central American origins worth comparing side by side rather than in isolation.' },
  { type: 'country', key: 'ecuador', name: 'Ecuador', why: 'Known especially for shade-grown wrapper leaf, grown under natural cloud cover rather than cheesecloth.', flavor: 'Ecuadorian wrapper (including Connecticut-seed grown there) is often associated with a silky texture and mild-to-medium character.', decision: 'A useful example of how the same seed variety can express differently depending on where it is grown.' },
  { type: 'country', key: 'united-states', name: 'United States', why: 'Primarily represented in premium cigars by the Connecticut River Valley (Broadleaf and Shade wrapper) and some Pennsylvania broadleaf.', flavor: 'Connecticut-grown wrapper is broadly associated with mild-to-medium character (Shade) or richer, sweeter notes (Broadleaf).', decision: 'A useful reference for wrapper-focused comparison rather than filler-driven strength.' },
  { type: 'region', key: 'connecticut-river-valley', name: 'Connecticut River Valley', why: 'A specific growing region within the United States, historically significant for both Shade and Broadleaf wrapper tobacco.', flavor: 'Associated with the mild Shade and richer Broadleaf wrapper traditions described above.', decision: 'A concrete example of how "region" is a more specific and useful unit of analysis than "country" alone.' },
]

// ── Soil types (closure pass) — keys match SeedSoil.jsx's existing
// approved hotspot vocabulary (Sandy Loam, Clay Loam, Volcanic, Limestone). ─
const SOILS = [
  { key: 'sandy-loam', name: 'Sandy Loam', why: 'A well-draining soil mix combining sand with organic loam, common in many tobacco-growing regions.', quality: 'Good drainage reduces root disease risk; moderate nutrient retention supports steady growth.', decision: 'Often favored for balanced growth rather than any single extreme characteristic.' },
  { key: 'clay-loam', name: 'Clay Loam', why: 'A denser soil mix with higher water and nutrient retention than sandy loam.', quality: 'Retains moisture and nutrients longer, which can support thicker leaf growth if drainage is managed well.', decision: 'Requires careful water management — clay-heavy soils can risk waterlogging without good drainage infrastructure.' },
  { key: 'volcanic', name: 'Volcanic Soil', why: 'Mineral-rich soil formed from volcanic activity, found in growing regions like parts of Nicaragua.', quality: 'Often associated with high mineral content that growers believe contributes to distinctive character, though the science of exactly how minerals translate to smoke flavor is not fully settled.', decision: 'A commonly cited factor in "terroir" discussions — worth learning about, not treating as a guaranteed flavor formula.' },
  { key: 'limestone', name: 'Limestone Soil', why: 'Calcium-carbonate-rich soil found in some growing regions, generally alkaline.', quality: 'Alkaline soil chemistry affects nutrient availability to the plant differently than acidic soils.', decision: 'One of many soil-chemistry factors growers balance — not a standalone predictor of quality.' },
]

// ── Terroir factors (closure pass) ────────────────────────────────────
const TERROIR = [
  { key: 'climate', name: 'Climate', why: 'The overall long-term weather pattern of a growing region — temperature, humidity, and rainfall together.', construction: 'Consistent, warm, humid climates support the kind of leaf growth cigar tobacco needs.', decision: 'Climate sets the broad conditions; day-to-day weather and farming practice still shape the individual harvest.' },
  { key: 'elevation', name: 'Elevation', why: 'The height of a growing region above sea level, which affects temperature and sun exposure.', construction: 'Higher elevations often mean cooler temperatures and different sun intensity, which can slow growth and affect leaf density.', decision: 'Consider alongside soil and rainfall — elevation alone does not determine outcome.' },
  { key: 'rainfall', name: 'Rainfall', why: 'The amount and timing of precipitation during the growing season.', construction: 'Tobacco needs consistent moisture during growth but drier conditions approaching harvest; too much rain can dilute leaf oils.', decision: 'Growers manage rainfall\'s effects through irrigation and timing, not just hope for good weather.' },
  { key: 'sun-exposure', name: 'Sun Exposure', why: 'How much direct sunlight a plant receives — either full sun-grown or shade-grown under cloth or natural cover.', flavor: 'Shade-grown wrapper (like Connecticut Shade) tends toward a milder, thinner leaf; sun-grown leaf tends to be thicker and more robust.', decision: 'A major factor distinguishing wrapper styles, worth learning alongside seed variety.' },
  { key: 'drainage', name: 'Drainage', why: 'How well a field\'s soil allows excess water to flow away rather than pool around roots.', construction: 'Poor drainage risks root disease; good drainage supports healthy, consistent growth.', decision: 'Often more about farming infrastructure (field design, soil amendment) than an unchangeable property of a region.' },
  { key: 'growing-season', name: 'Growing Season', why: 'The length of time between planting and harvest suitable for the local climate.', construction: 'A longer growing season can allow leaves more time to mature, but growers must balance this against weather risk.', decision: 'Interacts closely with climate and elevation rather than standing alone.' },
]

// ── Plant anatomy (Step 5/10) — NOT selectable in a blend ────────────
const ANATOMY = [
  { key: 'flower', name: 'Flower', why: 'The tobacco flower produces seed for the next generation of plants; commercial growers usually top (remove) it early.', quality: 'Topping the flower redirects the plant\'s energy into leaf growth, producing thicker, more flavorful leaves for smoking.', construction: 'Not directly relevant to a finished cigar\'s construction — its role ends before harvest.' },
  { key: 'seed-pod', name: 'Seed Pod', why: 'Forms after the flower is pollinated and holds the tiny seeds used to grow the next crop.', quality: 'Growers who want new plants (rather than more leaf) let a few flowers go to seed instead of topping them.', construction: 'Not present in the finished leaf or cigar.' },
  { key: 'stem', name: 'Stem (Stalk)', why: 'The plant\'s main structural support, carrying water and nutrients up from the roots to every leaf.', quality: 'Leaf position on the stalk (priming) is one of the biggest quality/flavor factors in tobacco — lower leaves are milder, upper leaves are stronger.', construction: 'The central leaf stem (midrib) must be removed before rolling — it is too thick and woody to smoke well.' },
  { key: 'leaf-blade', name: 'Leaf Blade', why: 'The broad, flat part of the leaf — this is the actual tobacco that gets cured, fermented, and rolled into cigars.', quality: 'Blade thickness, oil content, and elasticity determine whether a leaf is suited to wrapper, binder, or filler use.', flavor: 'Where sugars, oils, and flavor compounds concentrate during growth and fermentation.', construction: 'Wrapper leaves need a thin, elastic, blemish-free blade; filler leaves can be thicker and less cosmetically perfect.' },
  { key: 'midrib', name: 'Midrib', why: 'The thick central vein running down the middle of the leaf, structurally supporting the blade.', quality: 'A thinner midrib is prized in wrapper leaf since it is easier to work with and burns more evenly.', construction: 'Always removed (destemmed) before rolling — an unremoved midrib would create a hard lump and burn unevenly.' },
  { key: 'veins', name: 'Veins', why: 'The branching network carrying water and nutrients through the leaf blade, radiating from the midrib.', quality: 'Fine, tight vein structure is associated with a more supple, higher-quality wrapper leaf.', burn: 'Prominent veins can affect how evenly a wrapper leaf burns and how visible its texture is on the finished cigar.' },
  { key: 'roots', name: 'Roots', why: 'Anchor the plant and draw water and nutrients from the soil, especially minerals that influence flavor.', quality: 'Root health directly affects how much nutrition reaches the leaves, which shapes strength and flavor development.', flavor: 'Soil minerals absorbed through the roots are part of what growers mean by "terroir" — a sense of place in the smoke.' },
]

// ── Leaf primings (Step 5) — selectable ────────────────────────────
const PRIMINGS = [
  { key: 'volado', name: 'Volado', origin: 'Lowest leaves on the plant', why: 'The lowest priming, closest to the ground, exposed to the least sun.', flavor: 'Mild flavor, burns easily and evenly.', strength: 'Lightest strength of any priming — often used to aid combustion in a blend rather than for flavor alone.', quality: 'Prized more for its clean, reliable burn than for bold flavor.' },
  { key: 'seco', name: 'Seco', origin: 'Lower-middle leaves', why: 'Sits above volado on the stalk, getting moderate sun exposure.', flavor: 'Mild-to-medium flavor, often described as smooth and aromatic.', strength: 'Mild-medium strength; a common backbone for a balanced filler blend.', quality: 'Valued for aroma and easy burn alongside moderate flavor contribution.' },
  { key: 'viso', name: 'Viso', origin: 'Upper-middle leaves', why: 'Grows higher on the plant, receiving more direct sun than seco.', flavor: 'Fuller flavor with more spice and complexity than seco.', strength: 'Medium-to-strong; adds body and character to a blend.', quality: 'A common flavor "engine" in many filler blends, balancing volado\'s mildness.' },
  { key: 'ligero', name: 'Ligero', origin: 'Topmost leaves', why: 'Grows at the very top of the plant, absorbing the most direct sunlight.', flavor: 'The boldest, spiciest, most concentrated flavor of any priming.', strength: 'Highest strength — used carefully, since too much ligero can overpower a blend.', quality: 'Thick, oily leaves that take longer to ferment properly; a defining component of full-bodied cigars.' },
]

// ── Wrapper / binder / filler roles (Step 5) — selectable ──────────
const ROLES = [
  { type: 'wrapper', key: 'wrapper-role', name: 'Wrapper (role)', why: 'The outermost leaf, wrapped around the cigar — the first thing you see and the leaf with the single biggest flavor contribution per surface area.', flavor: 'Contributes a disproportionate share of a cigar\'s flavor and aroma since it sits directly against the palate and burns continuously along the length of the smoke.', quality: 'Must be cosmetically near-flawless, elastic enough to roll without tearing, and have consistent color and oil content.', construction: 'Applied last in rolling; poor wrapper tension causes an uneven burn or unraveling.' },
  { type: 'binder', key: 'binder-role', name: 'Binder (role)', why: 'The leaf that holds the bunched filler tobacco together inside the wrapper — structural, not primarily decorative.', flavor: 'Contributes flavor, but more subtly than wrapper or filler since it is sandwiched between them.', construction: 'Needs elasticity and tensile strength to hold the bunch tight without tearing; a weak binder causes a soft, poorly-drawing cigar.', quality: 'Cosmetic flaws matter far less here than in wrapper leaf, since binder is hidden.' },
  { type: 'filler', key: 'filler-role', name: 'Filler (role)', why: 'The blended tobacco at the core of the cigar — usually a mix of leaves from different primings (and sometimes different farms) chosen to balance strength and flavor.', flavor: 'The primary driver of a cigar\'s overall strength and flavor evolution from first third to final third.', construction: 'How tightly and evenly the filler is bunched controls draw resistance and burn quality more than any other single factor.', decision: 'Blenders balance mild, medium, and strong filler leaves (often volado/seco/viso/ligero) to create a flavor progression across the smoke.' },
  { type: 'filler', key: 'long-filler', name: 'Long Filler', why: 'Whole tobacco leaves, folded (not cut) and bunched running the full length of the cigar.', quality: 'The standard for premium, hand-rolled cigars — allows a slow, even burn and full flavor development.', construction: 'Requires more rolling skill than short filler; properly bunched long filler is central to a good draw.' },
  { type: 'filler', key: 'short-filler', name: 'Short Filler', why: 'Chopped tobacco scraps and smaller pieces, rather than whole leaves.', quality: 'More common in machine-made or lower-cost cigars; can burn hotter and faster than long filler.', construction: 'Easier and cheaper to produce consistently, but generally offers a less nuanced flavor progression than long filler.' },
]

// ── Processing methods (Step 5) — selectable ────────────────────────
const PROCESSING = [
  { type: 'curing_method', key: 'air-cured', name: 'Air Curing', why: 'Harvested leaves are hung in a curing barn and slowly dried by ambient air over several weeks.', flavor: 'Preserves more of the leaf\'s natural sugars than heat-based methods, generally producing a milder, more aromatic result.', quality: 'The most common curing method for premium cigar tobacco; success depends heavily on barn humidity and airflow control.' },
  { type: 'fermentation_method', key: 'pilon-fermentation', name: 'Pilón Fermentation', why: 'Cured leaves are stacked in large piles (pilónes) where natural heat and moisture trigger fermentation, breaking down ammonia compounds and sugars.', flavor: 'Removes harshness and unlocks the deeper, more complex flavors tobacco is prized for — an unfermented leaf tastes sharp and unpleasant.', strength: 'Can moderate or round out a leaf\'s raw strength, depending on the number of fermentation cycles.', quality: 'Leaves are periodically unstacked, inspected, and restacked to control temperature — overheating (going "off") ruins the batch.' },
  { type: 'aging_method', key: 'leaf-aging', name: 'Leaf Aging', why: 'After fermentation, leaves (or finished cigars) rest for months to years, letting flavors mellow and integrate.', flavor: 'Rough edges from fermentation soften over time; aged tobacco is generally smoother and more harmonious.', quality: 'Longer aging is not automatically better — it is a deliberate tradeoff between raw intensity and refined balance.' },
]

// ── Vitola / construction (Step 5/12) — some selectable, some not ──
const CONSTRUCTION = [
  { type: 'vitola', key: 'robusto', name: 'Robusto', why: 'A short, thick vitola (roughly 5 inches, 50 ring gauge) popular for a fuller-flavored smoke in less time.', flavor: 'The thicker ring gauge means more filler tobacco per puff, often reading as fuller-bodied than a slimmer vitola of the same blend.', construction: 'Its shorter length concentrates the flavor progression into a shorter smoking time.' },
  { type: 'vitola', key: 'corona', name: 'Corona', why: 'A classic, medium-length, moderate ring gauge vitola (roughly 5.5–6 inches, 42–44 ring gauge) — one of the oldest standard shapes.', flavor: 'A balanced ratio of wrapper to filler, often considered a benchmark for judging a blend\'s "true" character.', construction: 'Its proportions are a traditional reference point for comparing other vitolas.' },
  { type: 'vitola', key: 'toro', name: 'Toro', why: 'A larger, thicker vitola (roughly 6 inches, 50–52 ring gauge) offering a longer smoking time than robusto at a similar ring gauge.', flavor: 'Similar fullness to robusto but with more time for the flavor to evolve through distinct thirds.', construction: 'Popular for showcasing a blend\'s full flavor progression without an extremely long smoking time.' },
  { type: 'ring_gauge', key: 'ring-gauge-explainer', name: 'Ring Gauge', why: 'A cigar\'s diameter, measured in 64ths of an inch (e.g. 50 ring gauge = 50/64 inch diameter).', flavor: 'A thicker ring gauge holds more filler tobacco per inch, which can slow the burn and deepen the smoke\'s body.', construction: 'Affects draw resistance and how long the cigar takes to smoke — thicker is not automatically better, it changes the experience.', decision: 'Choose ring gauge based on how much time and how full-bodied a smoke you want, not as a marker of quality alone.' },
  { type: 'length', key: 'length-explainer', name: 'Length', why: 'The cigar\'s length in inches, independent of ring gauge.', construction: 'Longer cigars generally take longer to smoke and can show more of a blend\'s flavor progression from first to final third.', decision: 'Balance length against ring gauge — a long, thin cigar smokes very differently from a short, thick one even with the same blend.' },
  { type: 'construction_characteristic', key: 'draw', name: 'Draw', why: 'How much resistance the smoker feels pulling air through the cigar.', construction: 'Too tight a draw (over-bunched filler) makes a cigar hard to smoke; too loose (under-bunched) burns hot and fast with weak flavor delivery.', decision: 'A good draw is a construction goal independent of the blend itself — even a great blend smokes poorly with bad construction.' },
  { type: 'construction_characteristic', key: 'burn', name: 'Burn Quality', why: 'How evenly a cigar burns down its length, ideally in a straight, level line (an even "burn line").', construction: 'Uneven burn can result from inconsistent filler density, wrapper tension problems, or leaves that weren\'t properly cured/fermented.', decision: 'A cigar that burns unevenly may need to be relit or touched up, and can taste harsher on the side burning hot.' },
  { type: 'construction_characteristic', key: 'combustion', name: 'Combustion', why: 'The overall burning process converting tobacco into smoke, encompassing both draw and burn quality together.', construction: 'Good combustion depends on properly cured, fermented, and aged tobacco packed at the right density — it is where blend and construction meet.' },
  { type: 'construction_characteristic', key: 'balance', name: 'Balance', why: 'How well a blend\'s strength, body, and flavor elements work together rather than any one element overwhelming the rest.', decision: 'A "balanced" blend does not mean bland — it means no single component (like too much ligero) dominates unintentionally.' },
]

// ── Sensory categories (Step 5) — not independently selectable, informational ──
const SENSORY = [
  { key: 'strength', name: 'Strength', why: 'The physical, nicotine-driven intensity of a cigar — often confused with "body" or "flavor intensity," but a distinct property.', decision: 'A cigar can be high in flavor but low in strength, or vice versa — consider your tolerance separately from how much flavor you want.' },
  { key: 'body', name: 'Body', why: 'The weight and richness of the smoke on the palate — often described as light, medium, or full.', decision: 'Body is about texture and richness, not nicotine strength — a full-bodied cigar is not necessarily a strong one.' },
  { key: 'aroma', name: 'Aroma', why: 'The scent of the smoke, both from the foot (unlit end) before lighting and in the air once burning.', decision: 'Cold aroma (before lighting) can hint at a blend\'s character but does not fully predict how it will taste once lit.' },
  { key: 'finish', name: 'Finish', why: 'The flavor and sensation that lingers after each puff, once the smoke has cleared the palate.', decision: 'A long, evolving finish is often considered a mark of a well-aged, well-balanced blend.' },
  { key: 'complexity', name: 'Complexity', why: 'How many distinct, identifiable flavor notes a cigar presents, and how they interact.', decision: 'More complexity is not automatically better — some excellent cigars are prized for doing one or two things extremely well.' },
  { key: 'progression', name: 'Flavor Progression', why: 'How a cigar\'s flavor, strength, and body change from the first third through the final third.', decision: 'Blenders often deliberately build in progression (e.g. milder start, stronger finish) using different leaf primings by section.' },
]

// ── Package 5: construction steps (bunching → wrapper application →
// cap/foot) and additional processing stages (sorting/grading, final
// resting/box aging). Informational only (selectable: false) — these
// describe technique, not a chooseable blend component.
const CONSTRUCTION_STEPS = [
  { type: 'construction_step', key: 'bunching-entubado', name: 'Entubado Bunching', why: 'Each filler leaf is rolled individually into a small tube shape, then the tubes are bundled together — an open, airy structure.', construction: 'Preserves distinct air channels through the bunch, generally producing an easier, more consistent draw when done well.', decision: 'Considered a skill-intensive method associated with premium, hand-rolled construction.' },
  { type: 'construction_step', key: 'bunching-accordion', name: 'Accordion (Book) Fold Bunching', why: 'Filler leaves are folded back and forth like an accordion or book pages rather than rolled into tubes.', construction: 'Can be faster to produce than entubado; draw consistency depends heavily on how evenly the folds are layered.', decision: 'A common traditional method, especially where entubado is not practiced.' },
  { type: 'construction_step', key: 'bunching-book', name: 'Book Bunching', why: 'Filler leaves are stacked flat like the pages of a book rather than rolled or accordion-folded.', construction: 'Simple and fast, but can be prone to tighter, less even airflow if leaves are stacked too densely.', decision: 'Often associated with faster production; quality depends on the roller\'s density control.' },
  { type: 'construction_step', key: 'bunching-lieberman', name: 'Lieberman-Assisted Bunching', why: 'A mechanical bunching device assists a roller in forming a consistent bunch shape and density before the mold.', construction: 'Improves consistency between cigars compared to bunching entirely by hand, while the roller still selects and arranges the leaves.', decision: 'Common in shops balancing hand-rolled character with production consistency.' },
  { type: 'construction_step', key: 'binder-application', name: 'Binder Application', why: 'The binder leaf is wrapped around the bunched filler and held under tension to compress it into a stable shape.', construction: 'Binder tension and vein orientation affect how securely the bunch holds together and how the finished cigar will draw and burn.', decision: 'A weak or misapplied binder is a common root cause of a soft, underfilled-feeling cigar even with good filler.' },
  { type: 'construction_step', key: 'molding-pressing', name: 'Molding and Pressing', why: 'The bound bunch rests in a wooden mold (round or box-press shape) under pressure for a period of time to set its final shape.', construction: 'Time and pressure in the mold affect density consistency and whether the cigar holds a round or box-pressed profile.', decision: 'Rollers periodically rotate cigars within the mold to keep density even on all sides — an inconsistently rotated mold can produce lopsided cigars.' },
  { type: 'construction_step', key: 'wrapper-application', name: 'Wrapper Application', why: 'The wrapper leaf is applied in a spiral around the molded bunch, under careful tension, from foot to head (or head to foot depending on style).', construction: 'Overlap, tension, and vein alignment all affect burn evenness and the finished cigar\'s appearance.', decision: 'The most skill-sensitive step in rolling — a torn or over-stretched wrapper is difficult to recover from once applied.' },
  { type: 'construction_step', key: 'cap-construction', name: 'Cap Construction', why: 'A small piece (or pieces) of wrapper leaf is applied and shaped at the head of the cigar to seal the wrapper end.', construction: 'Flag caps use a single extended piece of wrapper; triple caps use several small round pieces layered for extra security; a pigtail twists to a point.', decision: 'Cap style affects both appearance and how securely the wrapper is sealed at the point the smoker will eventually cut.' },
  { type: 'construction_step', key: 'foot-finishing', name: 'Foot Finishing', why: 'The unlit end (foot) of the cigar is finished either open (exposed filler/binder), closed (fully wrapped), or shaggy (wrapper left loose/frayed).', flavor: 'An open foot exposes filler tobacco directly to the flame at first light, which some smokers feel gives a more immediate, complex first-light flavor.', decision: 'Foot style is a presentation and first-light choice, not a construction-quality indicator by itself.' },
  { type: 'construction_step', key: 'quality-control-draw-test', name: 'Quality Control and Draw Testing', why: 'Finished (or resting) cigars are checked for draw resistance, weight, ring gauge, length, and visible construction defects before being approved.', construction: 'A proper draw test checks that air pulls through with moderate, even resistance — not too tight, not too loose.', decision: 'Cigars failing inspection are typically reworked (if possible) or rejected rather than shipped — honest quality control, not automatic acceptance.' },
]

const MORE_PROCESSING = [
  { type: 'processing_method', key: 'leaf-sorting-grading', name: 'Leaf Sorting and Grading', why: 'After curing and fermentation, leaves are sorted by color, size, texture, elasticity, and visible damage into grades suited to different roles (wrapper, binder, filler).', quality: 'Sorting standards vary by grower and region — there is no single universal grading scale across the industry.', decision: 'A leaf graded unsuitable for wrapper (due to blemishes) may still be excellent binder or filler material — grading is about fit for role, not overall quality alone.' },
  { type: 'processing_method', key: 'final-resting-box-aging', name: 'Final Resting and Box Aging', why: 'After rolling, finished cigars rest — first individually to equalize moisture, then often boxed for further aging before release.', flavor: 'Resting lets the different leaves (wrapper, binder, filler) that were just combined "marry" into a more integrated flavor rather than tasting disjointed.', decision: 'Longer box aging is not automatically better — it is a deliberate tradeoff, and some blends are intended to be enjoyed relatively fresh.' },
]

// ── Package 6: cigar anatomy (the finished cigar's parts — distinct
// from plant anatomy) and burn/draw troubleshooting. Informational only.
const CIGAR_ANATOMY = [
  { type: 'cigar_anatomy', key: 'head', name: 'Head', why: 'The end you cut and light from — typically rounded and finished with a cap.', construction: 'Cap security here determines whether the wrapper stays intact once cut.', decision: 'Inspect the head for a clean, tight cap before cutting.' },
  { type: 'cigar_anatomy', key: 'cap', name: 'Cap', why: 'A small piece (or pieces) of wrapper leaf applied at the head to seal the wrapper\'s spiral seam.', construction: 'A well-applied cap holds through cutting and smoking; a loose cap can unravel.', decision: 'Cut style should account for cap style — round caps suit most standard cuts.' },
  { type: 'cigar_anatomy', key: 'shoulder', name: 'Shoulder', why: 'The tapered transition area just below the cap on some vitolas (especially figurados), where the cigar narrows toward the head.', construction: 'Present on tapered shapes like torpedo or belicoso; parejo shapes have little to no shoulder.', decision: 'Shoulder shape affects where and how you cut a tapered cigar.' },
  { type: 'cigar_anatomy', key: 'body', name: 'Body (Barrel)', why: 'The main cylindrical length of the cigar, containing the bunched filler wrapped in binder and wrapper.', construction: 'Should feel evenly firm along its length, without visible soft or hard spots.', decision: 'Run a gentle hand along the body before lighting to check for construction consistency.' },
  { type: 'cigar_anatomy', key: 'foot', name: 'Foot', why: 'The end opposite the head — where the cigar is lit.', flavor: 'The first flavors and aromas you experience often come from the foot at first light.', decision: 'Toast the foot evenly before drawing to establish a good burn line.' },
]
const BURN_TROUBLESHOOTING = [
  { type: 'burn_troubleshooting', key: 'canoeing', name: 'Canoeing', why: 'One side of the cigar burns faster than the other, creating a lopsided, canoe-shaped burn line.', construction: 'Often caused by uneven filler density or an unevenly toasted foot.', decision: 'Gently rotate the cigar toward the slower-burning side, or lightly touch up the fast side with a flame; if it persists, construction is the likely cause, not correctable by technique alone.' },
  { type: 'burn_troubleshooting', key: 'tunneling', name: 'Tunneling', why: 'The filler burns faster than the wrapper and binder, leaving an unburned wrapper "tunnel" around a hollow core.', construction: 'Usually linked to underfilled or loosely bunched filler.', decision: 'Slightly more frequent, gentle puffing can help; severe tunneling is a construction issue and may not fully correct.' },
  { type: 'burn_troubleshooting', key: 'uneven-burn', name: 'Uneven Burn (general)', why: 'The burn line is not level around the circumference, without full canoeing.', construction: 'Can stem from wrapper tension issues, filler density variation, or airflow in the room.', decision: 'Minor unevenness often self-corrects; persistent unevenness is worth a gentle touch-up.' },
  { type: 'burn_troubleshooting', key: 'tight-draw', name: 'Tight (Plugged) Draw', why: 'Excessive resistance pulling air through the cigar, making it hard to draw smoke.', construction: 'Usually over-bunched filler, a plugged section, or (rarely) a foreign object in the tobacco.', decision: 'A draw tool can sometimes help; if resistance is extreme, the cigar may be a genuine construction defect, not a technique problem.' },
  { type: 'burn_troubleshooting', key: 'loose-draw', name: 'Loose (Airy) Draw', why: 'Very little resistance, letting air (and smoke) rush through too easily.', flavor: 'Tends to run hot and fast, often muting flavor development and increasing harshness.', decision: 'Slower, gentler puffing can partially compensate, but a genuinely loose-rolled cigar cannot be fully fixed by technique.' },
]

// ── Package 6 closure: smoking technique. Informational only; the
// tactile cadence exercise itself is a dedicated table
// (smokecraft_cadence_sessions, migration 083), not catalog content.
const SMOKING_TECHNIQUE = [
  { type: 'smoking_technique', key: 'puff-cadence', name: 'Puff Cadence', why: 'The pace of puffing — cigars are meant to be smoked slowly, roughly one puff per 45-60 seconds, not continuously.', construction: 'A relaxed cadence keeps the cigar cool, preventing the harsh, bitter taste that comes from overheating the tobacco.', decision: 'If a cigar starts tasting hot or bitter, that is a signal to slow down, not to keep smoking through it.' },
  { type: 'smoking_technique', key: 'resting-the-cigar', name: 'Resting the Cigar', why: 'Letting a cigar sit unsmoked between puffs, rather than holding it continuously in the mouth.', construction: 'A cigar that goes out between rests is normal — a gentle relight is expected, not a failure.', decision: 'Resting also gives you time to observe aroma, ash, and flavor changes rather than rushing through the smoke.' },
  { type: 'smoking_technique', key: 'ash-management', name: 'Ash Management', why: 'Deciding when to let ash fall naturally versus gently tapping it off.', construction: 'A firm, long-holding ash column is often (not always) a sign of good construction and even burn.', decision: 'Avoid knocking ash off aggressively — a gentle tap or letting it fall on its own reduces the risk of disturbing the burn line.' },
  { type: 'smoking_technique', key: 'retrohale', name: 'Retrohale', why: 'Exhaling a small amount of smoke through the nose (not inhaling into the lungs) to experience aroma compounds the palate alone cannot detect.', flavor: 'Often reveals spice, pepper, and aromatic notes not perceived by taste alone.', decision: 'An optional, advanced technique — never required, and never the same as inhaling.' },
  { type: 'smoking_technique', key: 'relighting', name: 'Relighting', why: 'Re-igniting a cigar that has gone out, which happens naturally with proper resting.', construction: 'Gently purge (blow through) the cigar first to clear stale smoke, then relight evenly around the foot.', decision: 'A cigar that has gone out is not ruined — it is a normal part of a properly paced smoke.' },
  { type: 'smoking_technique', key: 'when-to-stop', name: 'When to Stop', why: 'Recognizing when a cigar has reached the point of diminishing return, typically when it becomes hot, harsh, or bitter near the end.', decision: 'Stopping with an inch or two remaining is common and not wasteful — the final section often turns harsh regardless of technique.' },
]

async function upsertComponent(client, { type, key, name, ...fields }) {
  const { rows } = await client.query(
    `INSERT INTO golden_box_component_catalog
       (component_type, component_key, display_name, description, category,
        why_it_matters, quality_impact, flavor_impact, strength_impact,
        aroma_impact, burn_impact, construction_impact, decision_guidance,
        origin, selectable_in_blend, source_status, review_status, visibility, created_by)
     VALUES ($1,$2,$3,$4,$1,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'curated_platform_content','reviewed','published','package-3-seed')
     ON CONFLICT (component_type, component_key) DO NOTHING RETURNING id`,
    [type, key, name, fields.why || null, fields.why || null, fields.quality || null,
     fields.flavor || null, fields.strength || null, fields.aroma || null, fields.burn || null,
     fields.construction || null, fields.decision || null, fields.origin || null,
     fields.selectable !== false]
  )
  return rows[0]?.id
}

async function main() {
  const client = await pool.connect()
  try {
    let inserted = 0
    for (const a of ANATOMY) { const id = await upsertComponent(client, { type: 'plant_anatomy', selectable: false, ...a }); if (id) inserted++ }
    for (const p of PRIMINGS) { const id = await upsertComponent(client, { type: 'leaf_priming', ...p }); if (id) inserted++ }
    for (const r of ROLES) { const id = await upsertComponent(client, r); if (id) inserted++ }
    for (const p of PROCESSING) { const id = await upsertComponent(client, p); if (id) inserted++ }
    for (const c of CONSTRUCTION) { const id = await upsertComponent(client, c); if (id) inserted++ }
    for (const s of SENSORY) { const id = await upsertComponent(client, { type: 'sensory_category', selectable: false, ...s }); if (id) inserted++ }
    for (const g of GENETICS) { const id = await upsertComponent(client, { type: 'seed_genetics', ...g }); if (id) inserted++ }
    for (const o of ORIGINS) { const id = await upsertComponent(client, o); if (id) inserted++ }
    for (const s of SOILS) { const id = await upsertComponent(client, { type: 'soil', ...s }); if (id) inserted++ }
    for (const t of TERROIR) { const id = await upsertComponent(client, { type: 'terroir', selectable: true, ...t }); if (id) inserted++ }
    for (const c of CONSTRUCTION_STEPS) { const id = await upsertComponent(client, { selectable: false, ...c }); if (id) inserted++ }
    for (const p of MORE_PROCESSING) { const id = await upsertComponent(client, { selectable: false, ...p }); if (id) inserted++ }
    for (const a of CIGAR_ANATOMY) { const id = await upsertComponent(client, { selectable: false, ...a }); if (id) inserted++ }
    for (const b of BURN_TROUBLESHOOTING) { const id = await upsertComponent(client, { selectable: false, ...b }); if (id) inserted++ }
    for (const s of SMOKING_TECHNIQUE) { const id = await upsertComponent(client, { selectable: false, ...s }); if (id) inserted++ }
    console.log(`Seeded ${inserted} golden_box_component_catalog rows (idempotent).`)

    // Flavor taxonomy — 16 top-level groups with real definitions
    const FLAVOR_GROUPS = [
      ['earth', 'Earth', 'Damp soil, mushroom, forest-floor notes often from soil-grown filler tobacco.'],
      ['wood', 'Wood', 'Cedar, oak, or dry wood notes, common in aged or barrel-influenced tobacco.'],
      ['spice', 'Spice', 'Black pepper, cinnamon, or clove sensations, often from ligero-heavy blends.'],
      ['sweet', 'Sweet', 'Natural sugar-derived sweetness from well-fermented, well-aged tobacco.'],
      ['nut', 'Nut', 'Almond, hazelnut, or walnut notes, often in milder Connecticut-style wrappers.'],
      ['cream', 'Cream', 'A smooth, rounded mouthfeel sensation rather than a distinct taste.'],
      ['coffee', 'Coffee', 'Roasted, slightly bitter espresso-like notes common in fuller-bodied blends.'],
      ['cocoa', 'Cocoa', 'Dark chocolate or cacao notes, frequently paired with coffee and spice notes.'],
      ['leather', 'Leather', 'A rich, tannic note common in aged, darker wrapper leaves like Maduro.'],
      ['herbal', 'Herbal', 'Grassy or herbaceous notes, sometimes present in underfermented tobacco.'],
      ['floral', 'Floral', 'Delicate, perfumed notes found in some lighter, aromatic wrapper varieties.'],
      ['fruit', 'Fruit', 'Dried-fruit notes like raisin or fig, associated with well-aged tobacco.'],
      ['citrus', 'Citrus', 'Bright, zesty notes occasionally found in lighter-bodied blends.'],
      ['mineral', 'Mineral', 'Chalky or flinty notes often attributed to volcanic-soil-grown tobacco.'],
      ['roasted', 'Roasted', 'Toasted, charred notes distinct from coffee, closer to grilled or seared flavors.'],
      ['pepper', 'Pepper', 'A sharp, tingling sensation on the palate, distinct from the broader "spice" group.'],
    ]
    let flavorCount = 0
    for (const [slug, name, def] of FLAVOR_GROUPS) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_flavor_notes (slug, name, flavor_group, definition, common_learner_confusion)
         VALUES ($1,$2,$1,$3,'Flavor perception varies by individual — these notes describe common consensus, not an objective scale.')
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [slug, name, def]
      )
      if (rows[0]) flavorCount++
    }
    console.log(`Seeded ${flavorCount} smokecraft_flavor_notes rows.`)

    // A handful of real compatibility relationships between seeded components
    const idFor = async (type, key) => {
      const { rows } = await client.query(`SELECT id FROM golden_box_component_catalog WHERE component_type=$1 AND component_key=$2`, [type, key])
      return rows[0]?.id
    }
    const ligeroId = await idFor('leaf_priming', 'ligero')
    const volaJoId = await idFor('leaf_priming', 'volado')
    const wrapperId = await idFor('wrapper', 'wrapper-role')
    const shortFillerId = await idFor('filler', 'short-filler')
    const longFillerId = await idFor('filler', 'long-filler')

    const COMPAT = []
    if (ligeroId && volaJoId) COMPAT.push([ligeroId, volaJoId, 'balances', 'moderate', 'Volado\'s mild, easy-burning character can offset ligero\'s intensity and help combustion in a ligero-heavy blend.'])
    if (ligeroId && wrapperId) COMPAT.push([ligeroId, wrapperId, 'may_overpower', 'moderate', 'A high proportion of ligero filler can overwhelm a delicate, mild wrapper\'s own flavor contribution.'])
    if (longFillerId && shortFillerId) COMPAT.push([longFillerId, shortFillerId, 'contrasts', 'mild', 'Long and short filler are alternative construction choices, not typically blended together — mixing them can create an inconsistent burn.'])

    let compatCount = 0
    for (const [source, target, type, strength, explanation] of COMPAT) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_component_compatibility (source_component_id, target_component_id, relationship_type, strength, explanation, evidence_status)
         VALUES ($1,$2,$3,$4,$5,'curated_platform_content')
         ON CONFLICT DO NOTHING RETURNING id`,
        [source, target, type, strength, explanation]
      )
      if (rows[0]) compatCount++
    }
    console.log(`Seeded ${compatCount} smokecraft_component_compatibility rows.`)

    // A few real quiz questions tied to seeded components
    let quizCount = 0
    if (ligeroId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-ligero-position', 'Which leaf priming grows at the very top of the tobacco plant and delivers the boldest flavor?',
         JSON.stringify(['Volado', 'Seco', 'Viso', 'Ligero']), 'Ligero',
         'Ligero leaves grow highest on the plant, absorbing the most sun, which concentrates flavor and strength.', ligeroId]
      )
      if (rows[0]) quizCount++
    }

    // Package 4 — Seed and Soil knowledge checks, tied to real seeded
    // seed_genetics/soil components.
    const criolloId = await idFor('seed_genetics', 'criollo')
    const volcanicId = await idFor('soil', 'volcanic')
    if (criolloId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-criollo-origin', 'Which of these seed genetics is one of the oldest cigar tobacco varieties, historically associated with Cuban origin?',
         JSON.stringify(['Criollo', 'Connecticut Shade', 'Corojo', 'Habano']), 'Criollo',
         'Criollo is among the oldest cultivated cigar tobacco genetics, tracing back to early Cuban seed stock, prized for its balanced, traditional flavor profile.', criolloId]
      )
      if (rows[0]) quizCount++
    }
    if (volcanicId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-volcanic-soil', 'Volcanic soil is prized for cigar tobacco growing primarily because it is:',
         JSON.stringify(['Rich in minerals from volcanic ash', 'Always the sandiest soil type', 'The only soil type used in Cuba', 'Free of natural nutrients']), 'Rich in minerals from volcanic ash',
         'Volcanic soil is naturally mineral-rich from ash deposits, which many growers believe contributes distinctive earthy, mineral notes to the finished leaf.', volcanicId]
      )
      if (rows[0]) quizCount++
    }
    // Package 5 — Leaf-to-Cigar knowledge checks, tied to real seeded
    // wrapper/binder/filler and processing components.
    const wrapperRoleId = await idFor('wrapper', 'wrapper-role')
    const longFillerId2 = await idFor('filler', 'long-filler')
    const pilonId = await idFor('fermentation_method', 'pilon-fermentation')
    if (wrapperRoleId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-wrapper-flavor-share', 'Which leaf contributes the single biggest share of a cigar\'s flavor and aroma per surface area?',
         JSON.stringify(['Binder', 'Filler', 'Wrapper', 'Volado']), 'Wrapper',
         'The wrapper sits directly against the palate and burns continuously the full length of the smoke, giving it an outsized flavor contribution relative to its thin layer.', wrapperRoleId]
      )
      if (rows[0]) quizCount++
    }
    if (longFillerId2) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-long-vs-short-filler', 'What is the key structural difference between long filler and short filler?',
         JSON.stringify(['Long filler uses whole leaves folded to run the cigar\'s full length; short filler uses chopped scraps', 'Long filler is always stronger in strength', 'Short filler is only used in wrapper leaves', 'There is no real difference, only marketing']), 'Long filler uses whole leaves folded to run the cigar\'s full length; short filler uses chopped scraps',
         'Long filler leaves are whole and folded (not cut), running the full length of the cigar for a slower, more even burn; short filler is chopped scraps, more common in machine-made or lower-cost cigars.', longFillerId2]
      )
      if (rows[0]) quizCount++
    }
    if (pilonId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-pilon-fermentation-purpose', 'What is the main purpose of pilón fermentation?',
         JSON.stringify(['To dry the leaf completely', 'To break down ammonia compounds and unlock deeper flavor', 'To add wrapper color artificially', 'To increase nicotine content']), 'To break down ammonia compounds and unlock deeper flavor',
         'Stacking cured leaves in pilónes lets natural heat and moisture trigger fermentation, breaking down harsh ammonia compounds and developing the deeper, more complex flavors tobacco is prized for.', pilonId]
      )
      if (rows[0]) quizCount++
    }
    // Package 6 — Cigar Anatomy, Ring Gauge, and Burn Troubleshooting
    // knowledge checks, tied to real seeded components.
    const capId = await idFor('cigar_anatomy', 'cap')
    const ringGaugeId = await idFor('ring_gauge', 'ring-gauge-explainer')
    const tunnelingId = await idFor('burn_troubleshooting', 'tunneling')
    if (capId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-cap-purpose', 'What is the primary purpose of a cigar\'s cap?',
         JSON.stringify(['To add flavor', 'To seal the wrapper\'s spiral seam at the head', 'To measure ring gauge', 'To indicate strength']), 'To seal the wrapper\'s spiral seam at the head',
         'The cap is a small piece of wrapper leaf applied at the head to seal the wrapper\'s seam — without it, the wrapper could unravel once cut.', capId]
      )
      if (rows[0]) quizCount++
    }
    if (ringGaugeId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-ring-gauge-measurement', 'Ring gauge measures a cigar\'s:',
         JSON.stringify(['Length in inches', 'Diameter in 64ths of an inch', 'Strength rating', 'Burn time in minutes']), 'Diameter in 64ths of an inch',
         'Ring gauge is the cigar\'s diameter, measured in 64ths of an inch — a 50 ring gauge cigar is 50/64 inch across.', ringGaugeId]
      )
      if (rows[0]) quizCount++
    }
    if (tunnelingId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-tunneling-cause', 'Tunneling — where the wrapper burns slower than the filler, leaving a hollow core — is usually caused by:',
         JSON.stringify(['Underfilled or loosely bunched filler', 'Too much wrapper tension', 'Over-humidified storage', 'Cutting the cap too deep']), 'Underfilled or loosely bunched filler',
         'When filler is underfilled or loosely bunched, it burns faster than the surrounding wrapper and binder, leaving an unburned wrapper "tunnel" around a hollow core.', tunnelingId]
      )
      if (rows[0]) quizCount++
    }
    // Package 6 closure — Smoking Technique knowledge check.
    const retrohaleId = await idFor('smoking_technique', 'retrohale')
    if (retrohaleId) {
      const { rows } = await client.query(
        `INSERT INTO smokecraft_quiz_questions (question_key, question, answer_choices, correct_answer, explanation, difficulty, related_component_id)
         VALUES ($1,$2,$3,$4,$5,'beginner',$6) ON CONFLICT (question_key) DO NOTHING RETURNING id`,
        ['quiz-retrohale-technique', 'Retrohale involves:',
         JSON.stringify(['Inhaling cigar smoke into the lungs', 'Exhaling a small amount of smoke through the nose to sense aroma', 'Relighting the cigar through the nose', 'A device-measured burn test']), 'Exhaling a small amount of smoke through the nose to sense aroma',
         'Retrohale means gently exhaling smoke through the nose (never inhaling into the lungs) to pick up aroma compounds the palate alone cannot detect — it is optional and distinct from cigarette-style inhalation.', retrohaleId]
      )
      if (rows[0]) quizCount++
    }
    console.log(`Seeded ${quizCount} smokecraft_quiz_questions rows.`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
