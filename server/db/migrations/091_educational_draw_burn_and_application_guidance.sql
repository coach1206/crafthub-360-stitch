-- 091 — Touch/Haptic/Tactile pass: close the educational content-depth gap.
--
-- Finding: the mandate requires every clickable educational visual to explain
-- what it is, why it matters, how it affects flavor / strength-body /
-- construction / DRAW / BURN / quality, and how to apply it.
-- `EducationalDetailPanel` already renders a `performance_impact` row and
-- `contentService` already selects the column (added in 079), but NO seed ever
-- wrote it: performance_impact was 0/84 across the entire catalog — including,
-- glaringly, the five `burn_troubleshooting` rows and six `smoking_technique`
-- rows that exist specifically to teach draw and burn.
--
-- This migration authors that missing axis. It deliberately does NOT
-- blanket-fill all 84 rows: draw/burn is not honestly attributable to a seed
-- pod, a root, a rainfall pattern or a country of origin, and inventing an
-- effect there would be fabrication. Rows are filled only where the draw/burn
-- relationship is real and well established.
--
-- Also fills `decision_guidance` ("how the learner should apply this") for
-- leaf_priming (was 0/4) and plant_anatomy (was 0/7), the other explicitly
-- required axis that was empty for those categories.
--
-- Every UPDATE is guarded with `IS NULL` so it is idempotent and never
-- overwrites authored content. Content is hedged in the same honest voice as
-- the existing seeds — no supplier, brand, or medical claims.

-- ── Burn troubleshooting — the diagnostic set ────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'This is a draw fault, not a flavor fault. A tight draw means the bunch is too dense or a leaf is folded across the airway, so you work hard for little smoke and the cigar tends to burn hot and taste harsh. Try a slightly deeper cut first, then gently roll the cigar between your fingers to loosen the bunch; if it persists the cigar was rolled too tightly and no technique will fully fix it.'
 WHERE component_key = 'tight-draw' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The opposite draw fault: too little resistance means air rushes through, the cigar burns fast and hot, and flavor thins out because the smoke has little contact time with the leaf. Slow your puff cadence markedly — a loose bunch punishes frequent puffing more than a well-packed one does.'
 WHERE component_key = 'loose-draw' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'A burn fault where the outer leaf burns ahead of the core, leaving a trough. It usually signals uneven bunch density or an over-aggressive light. Rotate the cigar as you smoke and correct early with a touch-up flame at the lagging edge; left alone it worsens because the exposed filler keeps burning faster.'
 WHERE component_key = 'canoeing' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The inverse of canoeing: the filler core burns ahead of the wrapper and binder, hollowing out the cigar. Commonly traced to an incomplete initial light or filler that is drier than the surrounding leaf. Toast the foot evenly at lighting to prevent it, and touch up the outer edge if it appears.'
 WHERE component_key = 'tunneling' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'A burn line that wanders rather than staying roughly perpendicular. Causes range from humidity imbalance in the leaf to inconsistent bunch density to simple draughts in the room. Minor waves often self-correct within an inch; a persistent run is worth a light touch-up rather than repeated relighting, which builds bitterness.'
 WHERE component_key = 'uneven-burn' AND performance_impact IS NULL;

-- ── Construction characteristics — the vocabulary of draw and burn ───────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Draw is the measured resistance you feel when you pull air through the cigar, and it is the single construction property you notice most. Too tight and the cigar overheats and turns harsh; too loose and it burns fast and tastes thin. A well-judged draw is firm but yielding, and it is set at the bunching bench long before you ever light the cigar.'
 WHERE component_key = 'draw' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Burn quality is judged by whether the cigar holds a reasonably straight, perpendicular burn line with a firm ash and needs few or no touch-ups. It reflects even bunch density, consistent leaf moisture, and compatible combustion rates between wrapper, binder and filler.'
 WHERE component_key = 'burn' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Combustion is how readily the leaf sustains a flame once lit. Leaves differ: thinner, lower-priming leaf such as volado burns readily and is often blended in specifically to keep a cigar alight, while dense ligero resists combustion. Poor combustion shows up as frequent relights, which in turn build bitterness.'
 WHERE component_key = 'combustion' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Balance is what keeps draw and burn working together rather than against each other — enough dense leaf for flavor and body, enough combustible leaf to keep the burn honest, packed evenly enough that air moves consistently from foot to head.'
 WHERE component_key = 'balance' AND performance_impact IS NULL;

-- ── Leaf priming — draw/burn effect and how to apply it ──────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Grown lowest on the stalk and thinnest, volado is the most combustible priming. Blenders include it largely for burn: it keeps a cigar alight and helps the burn line stay even, contributing little flavor of its own.'
 WHERE component_key = 'volado' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Treat volado as burn insurance rather than a flavor choice. If a practice blend keeps going out or burns raggedly, a little more volado is usually the correction.'
 WHERE component_key = 'volado' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Seco sits mid-stalk with moderate thickness, so it burns readily while still carrying flavor. It is the priming that lets a blend hold a steady draw without either choking or racing.'
 WHERE component_key = 'seco' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Use seco as the backbone of a filler blend and adjust around it. It is the safest priming to increase when you want more flavor without risking the burn.'
 WHERE component_key = 'seco' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Thicker and oilier than seco, viso burns more slowly. It adds body without the combustion penalty of ligero, so it is a common way to build depth while keeping the burn manageable.'
 WHERE component_key = 'viso' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Reach for viso when a blend tastes correct but thin. It is the middle step between a safe seco-led blend and the risk of adding ligero.'
 WHERE component_key = 'viso' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Grown at the top of the plant in full sun, ligero is the thickest, oiliest and least combustible priming. Too much of it, or placing it badly in the bunch, is a leading cause of a tight draw and a sluggish, uneven burn — which is why rollers typically place ligero at the centre of the bunch where air can still pass around it.'
 WHERE component_key = 'ligero' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Add ligero last and sparingly. It is the most powerful lever on strength and the one most likely to break the draw, so change it in small increments and re-test the draw each time.'
 WHERE component_key = 'ligero' AND decision_guidance IS NULL;

-- ── Component roles ─────────────────────────────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'The filler bunch is what actually sets the draw — the channels left between folded leaves are the airway. How the leaves are folded matters as much as which leaves are used.'
 WHERE component_key = 'filler-role' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The binder holds the bunch at its intended density, so it protects the draw the roller established. A binder applied too tightly can constrict the airway; too loosely and the bunch relaxes and the draw turns airy.'
 WHERE component_key = 'binder-role' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Because the wrapper is the outermost leaf, its combustion rate governs how evenly the burn line advances. A wrapper that burns much faster or slower than the leaf beneath it produces a ragged burn regardless of how well the bunch was made.'
 WHERE component_key = 'wrapper-role' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Long filler runs the full length of the cigar, so its folds form continuous air channels from foot to head. This is what allows a consistent draw and a slow, even burn.'
 WHERE component_key = 'long-filler' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Short filler is chopped leaf, so the air path is less continuous and the cigar generally burns faster and hotter than a comparable long-filler cigar. Draw is also less predictable from cigar to cigar.'
 WHERE component_key = 'short-filler' AND performance_impact IS NULL;

-- ── Bunching methods — the direct determinants of draw ───────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Entubado rolls each filler leaf into its own small tube before bundling, creating many parallel air channels. It is labour-intensive but widely regarded as giving the most consistent draw and the most even burn.'
 WHERE component_key = 'bunching-entubado' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Accordion folding pleats each leaf back and forth, leaving repeated air gaps along its length. It offers a good compromise between the draw consistency of entubado and the speed of book bunching.'
 WHERE component_key = 'bunching-accordion' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Book bunching lays leaves flat and folds them together like pages. It is quick, but because the leaves stack rather than form tubes, the airway is less open and the method is more prone to a tight draw if the roller is heavy-handed.'
 WHERE component_key = 'bunching-book' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'A Lieberman device assists bunching mechanically, improving repeatability between rollers. Consistency of draw across a production run is its main benefit; it does not by itself produce a better draw than a skilled hand roller.'
 WHERE component_key = 'bunching-lieberman' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Molding and pressing set the bunch to its final shape and consolidate its density. Over-pressing compresses the air channels and tightens the draw; under-pressing leaves the bunch loose and the burn fast.'
 WHERE component_key = 'molding-pressing' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'This is the step where draw is explicitly measured rather than guessed. A draw test checks airflow resistance against a target range so cigars that would smoke too tight or too loose are rejected before they reach a customer.'
 WHERE component_key = 'quality-control-draw-test' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The binder is applied at the density that preserves the intended draw. Wrapping it too tightly here undoes a well-made bunch.'
 WHERE component_key = 'binder-application' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Applied under even tension, the wrapper should not compress the bunch. Uneven tension along the barrel is a common cause of a burn line that wanders.'
 WHERE component_key = 'wrapper-application' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The cap seals the head. A cap applied with too much glue or too many layers can restrict the draw at the very point where you pull, so a clean cut through it matters as much as the cap itself.'
 WHERE component_key = 'cap-construction' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'An evenly finished, open foot lights cleanly and burns evenly from the start. A ragged or compressed foot makes an even initial toast harder, which is a frequent root cause of tunnelling.'
 WHERE component_key = 'foot-finishing' AND performance_impact IS NULL;

-- ── Cigar anatomy ───────────────────────────────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'The foot is where the burn begins. Toasting it evenly all the way across, rather than lighting one edge, is the single most effective way to prevent tunnelling and canoeing later.'
 WHERE component_key = 'foot' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The head is where you draw. How much of the cap you remove sets the effective opening: too shallow a cut restricts airflow, too deep a cut can unravel the wrapper.'
 WHERE component_key = 'head' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The cap protects the head and holds the wrapper in place. Cutting just above the shoulder removes enough cap to open the draw while leaving enough to stop the wrapper peeling.'
 WHERE component_key = 'cap' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The shoulder marks the safe cutting limit. Cutting past it removes the structure holding the wrapper, which typically leads to unravelling rather than a better draw.'
 WHERE component_key = 'shoulder' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The body is where you feel the bunch. Gently squeezing along it reveals soft spots or hard plugs — an early warning of an airy or a tight draw before you light.'
 WHERE component_key = 'body' AND coalesce(category, component_type) = 'cigar_anatomy' AND performance_impact IS NULL;

-- ── Smoking technique — behavioural control of draw and burn ────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Cadence is the most powerful thing the smoker controls. Puffing too frequently overheats the cigar, which turns the smoke harsh and bitter and can distort the burn line; roughly one gentle puff per minute lets the cigar cool between draws.'
 WHERE component_key = 'puff-cadence' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'A firm ash column insulates the ember and moderates the burn rate. Letting roughly an inch build before gently rolling it off tends to keep the cigar burning cooler and more evenly than tapping constantly.'
 WHERE component_key = 'ash-management' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Relighting is normal, but technique matters: knock off the dead ash, toast the exposed foot evenly rather than blasting it, and expect some added bitterness. Repeated relights usually point to an underlying combustion or humidity problem rather than bad luck.'
 WHERE component_key = 'relighting' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Setting a cigar down for a few minutes lets the ember cool and can pull a cigar back from overheating. Left much longer it goes out, so resting is a cooling tool, not a pause button.'
 WHERE component_key = 'resting-the-cigar' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Retrohaling passes smoke through the nasal passage to reveal aroma the palate alone misses. Do it gently and sparingly — it does not change the burn, but a forceful retrohale early in a full cigar is overwhelming for most new smokers.'
 WHERE component_key = 'retrohale' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'As the ember nears the head there is less leaf left to cool the smoke, so it runs hotter and harsher. Heat and bitterness, not a fixed length, are the honest signal that a cigar is finished.'
 WHERE component_key = 'when-to-stop' AND performance_impact IS NULL;

-- ── Format — geometry drives draw ───────────────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Ring gauge is the diameter, so it directly sets how much filler the air must pass through. Wider gauges hold more filler and generally smoke cooler and longer, but they are also less forgiving of a poorly made bunch because there is more room for uneven density.'
 WHERE component_key = 'ring-gauge-explainer' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Length affects how far smoke travels before reaching you. A longer cigar gives the smoke more time to cool, which is part of why the first third of a long cigar often tastes smoother than the last.'
 WHERE component_key = 'length-explainer' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'A Robusto''s relatively wide gauge over a short length gives a cool, open draw in a shorter smoking time — a common reason it is recommended as a first format.'
 WHERE component_key = 'robusto' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The Toro''s added length over a Robusto gives the smoke more cooling distance and a longer window to show flavour progression, at the cost of a longer commitment.'
 WHERE component_key = 'toro' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'The Corona''s narrower gauge means less filler and a somewhat firmer draw, and it puts proportionally more wrapper against filler — one reason wrapper character often reads more clearly in this classic format.'
 WHERE component_key = 'corona' AND performance_impact IS NULL;

-- ── Leaf structure ──────────────────────────────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'The midrib is removed before rolling precisely because it burns differently from the blade and is too rigid to fold. Leaving any of it in the bunch is a reliable way to produce an uneven burn.'
 WHERE component_key = 'midrib' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'When you handle leaf, check that the midrib has been fully stripped — it is an easy thing to miss and a common cause of burn faults.'
 WHERE component_key = 'midrib' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Veins are denser than the surrounding blade and burn at a different rate, so prominent veins on a wrapper can pull the burn line out of true.'
 WHERE component_key = 'veins' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Fine, flat veins on a wrapper are a reasonable visual quality cue; heavy raised veins are worth noting, though they are a cosmetic and burn consideration rather than proof of a bad cigar.'
 WHERE component_key = 'veins' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Blade thickness and oil content govern how readily the leaf combusts — the same property that makes a thick, oily leaf flavourful also makes it slower to burn.'
 WHERE component_key = 'leaf-blade' AND performance_impact IS NULL;
UPDATE golden_box_component_catalog SET decision_guidance =
 'Learn to judge a blade by feel as well as look: elasticity and a light sheen tell you more about how a leaf will behave than colour alone.'
 WHERE component_key = 'leaf-blade' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET decision_guidance =
 'Remember stalk position when reading a blend: knowing a leaf is volado or ligero tells you more about how it will smoke than the country on the band.'
 WHERE component_key = 'stem' AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET decision_guidance =
 'Not part of a finished cigar — study it to understand why growers top the plant, then apply that to why upper leaves are stronger.'
 WHERE component_key IN ('flower', 'seed-pod') AND decision_guidance IS NULL;

UPDATE golden_box_component_catalog SET decision_guidance =
 'Roots connect the plant to the soil, which is where terroir claims actually originate — useful context when you evaluate how much weight to give origin.'
 WHERE component_key = 'roots' AND decision_guidance IS NULL;

-- ── Processing ──────────────────────────────────────────────────────────────
UPDATE golden_box_component_catalog SET performance_impact =
 'Curing sets the leaf''s final moisture behaviour, which underpins everything about how it later burns. Leaf cured badly never burns well no matter how skilfully it is rolled.'
 WHERE component_key = 'air-cured' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Fermentation drives off ammonia and other harsh compounds and evens out moisture, which is a large part of why properly fermented leaf burns cleanly and smells sweet rather than acrid.'
 WHERE component_key = 'pilon-fermentation' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Aging lets moisture equalise through the leaf. Even moisture is a precondition for an even burn, which is why a rushed cigar often burns raggedly even when well constructed.'
 WHERE component_key = 'leaf-aging' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Box aging lets the finished cigar''s components settle to a common humidity. This is why a cigar rested for a few weeks after purchase frequently draws and burns better than one smoked the same day.'
 WHERE component_key = 'final-resting-box-aging' AND performance_impact IS NULL;

UPDATE golden_box_component_catalog SET performance_impact =
 'Sorting by thickness and elasticity as well as colour is what keeps bunches consistent. Mixing leaves that burn at very different rates into one cigar is a root cause of uneven burn.'
 WHERE component_key = 'leaf-sorting-grading' AND performance_impact IS NULL;
