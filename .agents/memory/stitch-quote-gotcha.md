---
name: Stitch HTML quote gotcha
description: Stitch-exported code.html files often contain curly/smart quotes in data strings that break single-quoted JSX string literals.
---

## The rule
When lifting copy from Stitch `code.html` into JSX data arrays (mentor bios, descriptions, labels), always wrap those strings in **double quotes** or **template literals** — never single quotes.

**Why:** Stitch copy routinely contains apostrophes and smart quotes like `Criollo '98`, `it's`, `Jalapa's`. A single-quoted JS string `'Criollo '98'` terminates early at the apostrophe, causing a parse error that crashes the entire module.

**How to apply:** Any time you copy a text string verbatim from a Stitch `code.html`, inspect it for apostrophes/single quotes before wrapping. Use `"..."` as the default delimiter for all Stitch-sourced string data.
