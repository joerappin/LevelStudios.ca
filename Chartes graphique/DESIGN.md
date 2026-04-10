# Design System: High-End Digital Editorial

## 1. Overview & Creative North Star

**Creative North Star: The Neon Nocturne**
This design system is a masterclass in "Atmospheric Depth." It moves away from the flat, utilitarian nature of standard web layouts to embrace an editorial, high-production-value aesthetic. It is inspired by the world of professional content creation: dark recording studios, vibrant signal lights, and high-contrast optics.

We break the "template" look by utilizing:
- **Kinetic Typography:** High-contrast scale shifts between massive display headers and focused body copy.
- **Intentional Asymmetry:** Utilizing staggered grid layouts and overlapping elements to create a sense of movement.
- **Vibrant Luminance:** Using light as a structural element—where gradients aren't just decorative but act as "signals" or "glows" within a dark environment.

---

## 2. Colors & Surface Philosophy

The color palette is anchored in a `surface: #0e0e0e` (Deep Black) to ensure that every vibrant accent feels like it is emitting light.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. We define spatial boundaries through **Tonal Shifts**. To separate content blocks, transition from `surface` to `surface-container-low` (#131313) or `surface-container` (#1a1919). This creates a sophisticated, "un-boxed" feel.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials.
- **Base Layer:** `surface` (#0e0e0e) - The infinite background.
- **Secondary Tier:** `surface-container-low` (#131313) - Large content areas.
- **Interactive Tier:** `surface-container-high` (#201f1f) - For cards and interactive modules.
- **Floating Tier:** `surface-bright` (#2c2c2c) - For modals and tooltips.

### The Glass & Gradient Rule
To achieve the signature Level Studios look, floating elements must utilize **Glassmorphism**. 
- **Recipe:** Use a semi-transparent `surface-variant` (#262626) at 60% opacity with a `backdrop-filter: blur(20px)`.
- **Gradients:** Use linear gradients (e.g., `primary` #ff89ac to `secondary` #ea73fb) at 45-degree angles for high-impact CTAs. This provides a "liquid" feel that flat colors lack.

---

## 3. Typography

The typography scale is designed to feel like a high-end fashion magazine or a film credit sequence.

*   **Display (Plus Jakarta Sans):** Bold, aggressive, and spacious. `display-lg` (3.5rem) should be used for hero moments with tight letter-spacing (-0.02em).
*   **Headlines (Plus Jakarta Sans):** `headline-lg` (2rem) handles section titles. Utilize gradient text masks (Primary to Tertiary) on key words to draw the eye.
*   **Body (Inter):** The "clean" workhorse. `body-lg` (1rem) ensures legibility against the dark background. Always use `on-surface-variant` (#adaaaa) for secondary body text to reduce eye strain.
*   **Labels (Inter):** Uppercase, tracked out (+0.1em) for a technical, studio-equipment aesthetic.

---

## 4. Elevation & Depth

We ignore traditional Material Design shadows. Instead, we use **Tonal Layering** and **Luminous Diffusion**.

*   **The Layering Principle:** Place a `surface-container-highest` card on top of a `surface` background. The subtle 4% difference in luminosity creates enough "lift" without the clutter of a shadow.
*   **Ambient Glows:** For floating elements, use a "Bloom" effect instead of a shadow. A shadow should be a tinted version of the `primary` or `secondary` color at 5% opacity with a 40px blur, mimicking the way a neon light casts a glow on a dark wall.
*   **The Ghost Border:** When containment is necessary for accessibility, use the `outline-variant` (#494847) at **15% opacity**. This creates a suggestion of a border that disappears into the background, maintaining the "sleek" studio feel.

---

## 5. Components

### Buttons (The "Signal" Component)
*   **Primary:** A vibrant gradient background (`primary` to `secondary`) with `on-primary-fixed` (Black) text. Use a `full` (9999px) corner radius for a modern, pill-shaped look.
*   **Secondary:** A "Ghost" style with the `outline-variant` border and `on-background` text. On hover, apply a subtle `surface-bright` background.
*   **Tertiary:** Text-only with an icon, using the `tertiary` (#88ebff) color to denote a different action class.

### Cards & Modules
*   **Constraint:** Zero 100% opaque borders.
*   **Styling:** Use `surface-container-high` as the base. Apply a 1px "Ghost Border" (15% opacity) only to the top and left edges to mimic a subtle rim-light.
*   **Spacing:** Use a generous `xl` (1.5rem) padding to give content room to "breathe."

### Chips & Tags
*   **Execution:** Small, uppercase labels using `secondary-container` backgrounds. Use `label-sm` typography to keep them secondary to the main content.

### Inputs & Forms
*   **Execution:** Containers should use `surface-container-lowest` (pure black) with a subtle `outline-variant` bottom-border only. This mimics the sleek, minimal controls of high-end audio hardware.

---

## 6. Do's and Don'ts

### Do:
*   **Use Intentional Overlap:** Let a high-quality image of a studio slightly overlap a text container to create depth.
*   **Embrace the Dark:** Use pure black (#000000) for the most recessed areas to maximize the "pop" of the vibrant colors.
*   **Vary Gradient Directions:** Use different angles for gradients to keep the interface feeling dynamic and bespoke.

### Don't:
*   **Don't use pure white (#ffffff) for long-form body text:** It causes "halation" (glowing effect) on dark screens which hurts readability. Use `on-surface-variant` (#adaaaa) for paragraph text.
*   **Don't use standard shadows:** Avoid black "drop shadows" on a dark background; they look muddy. Use tonal shifts instead.
*   **Don't crowd the layout:** High-end studios feel spacious. If a layout feels "busy," increase the vertical white space using the `xl` spacing scale.
*   **Don't use sharp corners:** This system relies on `lg` (1rem) and `xl` (1.5rem) radiuses to feel premium and approachable. Avoid `none` or `sm` radiuses unless for technical data grids.