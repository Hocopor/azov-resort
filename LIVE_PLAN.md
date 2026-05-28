[x] Phase 1. Direct deploy branch
- [x] Check current repo state and deployment scheme
- [x] Create branch `deploy/direct-domain-secure`
- [x] Publish separate branch without Cloudflare Tunnel
- [x] Keep changes isolated from `main`

[x] Phase 2. Direct HTTPS deployment path
- [x] Find Cloudflare Tunnel dependencies
- [x] Move branch to direct domain access without conflict with neighbor sites on the VPS
- [x] Keep app and PostgreSQL inside Docker internal networking
- [x] Update docker compose and deploy script for the new mode

[x] Phase 3. VPS security baseline
- [x] Enable secure HTTP headers and HTTPS redirect strategy
- [x] Limit exposed ports to SSH, 80, 443
- [x] Add baseline firewall configuration to deploy script
- [x] Verify secrets and internal services are not exposed publicly

[x] Phase 4. Deployment verification and ops hardening
- [x] Update `.env.example` and `README.md` for the new domain setup
- [x] Validate `docker compose config`
- [x] Validate shell scripts locally
- [x] Document required VPS steps after `git pull`
- [x] Fix first-run deploy when Prisma migrations are empty
- [x] Stabilize reverse proxy upstream strategy for this VPS
- [x] Откат мусора от Gemini AI Studio: удалён дублированный src/, prisma/, public/ и Vite-файлы из корня репо; починен docker-compose.yml (context: ./app → правильная папка с Dockerfile); убраны папки с фигурными скобками из app/src/; LIVE_PLAN убран из .gitignore

[~] Phase 5. Dynamic room pricing by period
- [x] Design price-period model without breaking existing bookings
- [x] Add Prisma storage for room price periods and booking price snapshots
- [x] Update room admin UI to edit multiple date-based prices
- [x] Rework booking calculations to sum nightly prices across mixed periods
- [x] Keep existing and cancelled bookings on their original prices
- [x] Show active price range on room cards/pages
- [x] Show per-day prices inside the booking calendar
- [~] Verify totals, deposits, admin views, and booking history

Blockers
- `LIVE_PLAN.md` had broken encoding and was normalized.
- Local Caddy validation through Docker was not possible earlier because the local Docker Desktop daemon was unavailable.

Next Steps
- [x] Normalize broken UTF-8/mojibake strings introduced in the recent rooms/capacity/media changes, then rerun the build.
- Finalize the reverse proxy upstream strategy used on the VPS.
- Deploy the pricing changes and run `prisma db push` on the VPS.
- Manually verify mixed-period bookings, admin manual booking totals, saved booking history, and period creation on the live environment.
- Smooth admin UX for editing price periods so partial rows do not show blocking validation while the user is still filling them in.
- Improve booking calendar UX: compact price summary, 3-click range selection reset, and softer range highlight styling.
- User-facing booking summary now groups contiguous equal-price days; calendar selection resets on the third click and uses softer range colors.
- Security remediation is intentionally deferred until the user explicitly returns to it.
- When resumed, fix in this order:
  1. Harden payment webhook validation and idempotency checks.
  2. Add abuse protection and rate limiting for login, registration, booking, upload, and review endpoints.
  3. Reduce public exposure of review media and stop leaking stable internal user identifiers in file paths.
  4. Tighten upload validation with server-side file signature checks and smaller size limits by media type.
  5. Improve PII protection and retention rules for bookings, comments, transfer details, and account deletion flows.
  6. Reduce account enumeration and require stricter mail transport security settings.
- Research and plan improvements for room cards and site-wide image performance:
  1. Make the whole room card clickable in the room listing.
  2. Add hoverable room photo carousel directly on room cards.
  3. Split room capacity into main places, extra places, and total capacity.
  4. Design image performance strategy for room galleries, blog, territory, reviews, and about media.
  5. Evaluate a future Yandex Cloud CDN path without coupling the first implementation to it.
- Booking calendar stabilization was completed locally: conflicting global DayPicker overrides were removed, the public booking form now owns its range visuals, and client booking dates are sent as `YYYY-MM-DD` to avoid one-day shifts.
- Public booking calendar still needs one more stabilization pass: the click/reset logic must stop using DayPicker's residual range behavior, and the endpoint circles should be enlarged slightly to match the range fill.
- Public booking calendar range selection is now fully owned by custom modifiers in `BookingForm`; the third click resets both calculations and highlight, and the endpoint circles were enlarged to sit flush with the range fill.
- Final visual polish remains for the public booking calendar: reduce the range-fill height to match the endpoint circle diameter, keep price-period text on a single line with day counts stacked on the right, and align nav arrow color with the booking calendar heading.
- Public booking calendar visual polish is completed locally: the range-fill height now matches the endpoint circle diameter, grouped period lines keep the price text on one line with day counts below on the right, and the month navigation arrows match the booking heading color.
- One last geometry tweak remains for the public booking calendar: prevent the right endpoint circle from clipping by tuning internal DayPicker spacing instead of shrinking the calendar font.
- The public booking calendar geometry tweak is completed locally: added inner horizontal breathing room and slightly tightened the day step width so the right endpoint circle fits without shrinking the calendar typography.
- A follow-up geometry pass is still needed: the public booking calendar must avoid clipping the right endpoint circle and month caption by tuning DayPicker's internal spacing, not the outer frame.
- The remaining calendar geometry task is to explicitly compress the DayPicker width and anchor it to the left, leaving a clean right-side inset so the endpoint circle stays inside the card.
- The DayPicker is now explicitly compressed in width and anchored to the left so the right edge gets reserved breathing room without changing the calendar typography.
- The next calendar pass should stop targeting the outer wrapper and instead compress the DayPicker month grid itself so the right endpoint circle fits inside the card.
- Root cause found for the remaining right-edge clipping: the custom endpoint circle is slightly wider than the effective day cell, so the next fix must align day-cell and day-button geometry first, then reserve a small right inset for the month grid.
- The right-edge clipping fix is now based on aligned geometry: the endpoint circle and DayPicker button width match the day cell width, with a small month-grid right inset preserved.
- Static security review completed locally with focus on auth, payments, file uploads, and personal data handling. Main findings: missing abuse controls, public review-media privacy leakage, plaintext long-lived booking PII, and weak webhook state validation.
- Research findings for the next room/media task:
  - Public room cards currently show only `room.images[0]`; the whole card is not clickable, only the CTA links are.
  - Room detail pages use `RoomGallery`, whose lightbox mounts a full-screen image plus a thumbnail strip for every image at once; uploaded room images are served as original files with no derived preview sizes.
  - Uploaded `/uploads/...` media are rendered through plain `<img>` in `AppImage`, so current uploaded images bypass `next/image` sizing/optimization entirely.
  - The uploads route currently returns original files with `Cache-Control: no-store`, which prevents browser/CDN reuse and gives us no width/quality variants for cards, galleries, reviews, blog, territory, or about images.
  - Room data currently has only one `capacity` field; adding main places and extra places will require a schema/API/admin/public UI pass, plus a backward-compatible interpretation for existing rooms.
  - The first implementation should focus on local optimizations (responsive variants, lazy loading, lighter card previews, saner gallery/lightbox behavior) and keep Yandex Cloud CDN as a later optional edge-distribution layer rather than a prerequisite.
- Approved direction for the next room/media implementation:
  1. Room cards should be clickable as a whole.
  2. Room-card photo browsing should use arrow controls and dot indicators, not thumbnail strips.
  3. Room capacity must become admin-configurable as main places + extra places, with total capacity shown publicly.
  4. CDN is explicitly postponed; first implementation must solve performance locally.
- Detailed implementation plan for the next room/media task:
  Phase A. Data model and compatibility
    1. Add `baseCapacity` and `extraCapacity` to `Room`.
    2. Keep `capacity` temporarily as the derived total used by existing booking/public code.
    3. Backfill existing rooms with `baseCapacity = capacity`, `extraCapacity = 0`.
    4. Update Prisma types, room admin API, and seed/runtime defaults so new rooms always have all three values consistent.
    5. Define one server-side normalization rule: if `baseCapacity` or `extraCapacity` changes, `capacity` is recalculated in the API before save.
  Phase B. Room admin editing
    1. Replace the single capacity field in room editing with:
       - main places,
       - extra places,
       - total capacity (read-only or auto-calculated preview).
    2. Show validation that both capacity inputs must be non-negative integers.
    3. Ensure the admin room list and expanded room details show the new capacity breakdown.
  Phase C. Uploaded image architecture
    1. Stop treating uploaded originals as the only source for every screen size.
    2. Introduce generated image variants per uploaded image, at least:
       - `thumb`,
       - `card`,
       - `gallery`,
       - `lightbox`.
    3. Store variant metadata alongside uploaded media or derive a stable naming/path convention.
    4. Keep original files for future reuse, but render UI from variants by default.
    5. Update upload and media-serving paths so variants can be cached safely, unlike the current `no-store` behavior.
  Phase D. Shared media rendering layer
    1. Extend or replace `AppImage` so uploaded images can choose variants and output correct `src`, `srcSet`, `sizes`, `loading`, and decoding behavior.
    2. Reuse that shared layer everywhere:
       - room cards,
       - room detail galleries,
       - about images,
       - blog media,
       - territory media,
       - review media,
       - account booking previews.
    3. Keep static `/images/...` support intact.
  Phase E. Public room-card UX
    1. Extract a dedicated reusable room-card component from the public rooms page.
    2. Make the whole card navigate to the room page.
    3. Preserve explicit CTA buttons and carousel arrows as nested interactive elements that stop parent navigation when needed.
    4. Replace bottom thumbnail previews with dot indicators only.
    5. Add left/right controls on hover for desktop and a tap-safe variant for touch devices.
    6. Load only the current card image immediately; defer the rest.
  Phase F. Room detail gallery optimization
    1. Rework `RoomGallery` so fullscreen mode does not mount heavy versions of all images simultaneously.
    2. Render the current frame eagerly and preload only adjacent frames.
    3. Use lighter variants for the grid and thumbnail strip.
    4. Load lightbox-resolution images only after opening fullscreen or when actively navigating.
    5. Keep navigation responsive on mobile and avoid blocking the main thread with many image decodes.
  Phase G. Rollout of media optimizations across the site
    1. Update home-page room cards to use the shared optimized room-card/media path.
    2. Update “About” block images to use lighter variants.
    3. Update blog, territory, reviews, and account previews to use the shared variant-aware media layer.
    4. Add lazy loading and conservative `sizes` rules across non-critical media blocks.
  Phase H. Verification and regression pass
    1. Verify room-card navigation works from card body, title area, and buttons.
    2. Verify carousel arrows and dot indicators do not break navigation.
    3. Verify admin can edit main/extra capacity and sees correct totals everywhere.
    4. Verify booking flows still respect total capacity and existing bookings are unaffected.
    5. Manually test room detail fullscreen performance on desktop and mobile-width emulation.
    6. Check that uploaded media appear without rebuild/restart and that cache behavior does not keep stale variants after replacement.
    7. Re-run build and spot-check key public/admin routes.
- Local implementation status for the room/media task:
  - Added room capacity split in schema and seeds: `baseCapacity`, `extraCapacity`, and derived `capacity`.
  - Updated the admin room save path so server-side room totals are recalculated from main + extra places.
  - Public `/rooms` now uses a dedicated clickable room card with inline photo browsing, arrows, and dot indicators instead of thumbnail strips.
  - Room detail pages now show the new capacity breakdown label and use the optimized gallery path.
  - Uploaded image delivery now supports cached resized variants through the existing `/uploads` route, instead of serving only original files for every screen size.
  - `AppImage` now gives uploaded images responsive `srcSet`/`sizes` behavior, which is the new base for room cards, gallery images, and shared media blocks.
  - Shared media rendering now prefers lighter image variants and video metadata preload.
  - Local `npm run build` passes after the room/media implementation.
- Deployment note for the current room/media implementation:
- The VPS will require `prisma db push` before restart because the `Room` schema gained `baseCapacity` and `extraCapacity`.
- A follow-up UTF-8 cleanup was completed for the newly touched room/capacity files:
  - public `/rooms` listing page,
  - public `/rooms/[id]` detail page,
  - `RoomCard`,
  - `RoomImageCarousel`,
  - `getRoomCapacityBreakdown()` and related room/payment labels in `utils`,
  - new capacity labels in `AdminRoomsClient`.
- Local `npm run build` passes after the encoding cleanup.

Durable Notes
- This is stabilization and extension of the current implementation, not a redesign.
- Deployment changes stay isolated from `main` in the separate branch.
- Existing bookings must preserve their original amounts even if room prices change later.
- Dynamic pricing must support bookings that span multiple pricing periods with correct nightly totals.
- Price periods for one room must never overlap; admin should see a warning and the save must be rejected until periods are corrected.
- A server-side save bug was found after first deploy: period prices must be written as normalized `number + Date` values, not re-serialized strings before `createMany`.
- Security findings to keep for later remediation:
  - Payment webhook currently trusts event flow too loosely; verify status, amount, and replay/idempotency behavior.
  - Sensitive public review media URLs expose stable per-user path segments.
  - Booking-related PII is stored long-term in plaintext fields with no retention/minimization workflow.
  - Sensitive endpoints lack rate limiting and abuse throttling.
  - Upload validation trusts MIME/extension too much and allows very large public files.
  - Registration currently leaks whether an email already exists; SMTP transport is not forced into a stricter secure mode in code.
- For the next room/image work, prioritize design and implementation planning first; do not change code until the user reviews the proposed approach.
- The next room/image feature set touches both UX and data model:
  - whole-card navigation on room listings,
  - inline room-card photo browsing with arrows and dot indicators instead of mini-thumbnails,
  - split room capacity into main/extra/total,
  - systemic media optimization across rooms, blog, territory, reviews, and about blocks.
- Current media bottleneck is architectural, not only visual: uploaded media are served only as original files, so previews and large views are pulling from the same source assets.
- Yandex Cloud CDN is intentionally postponed for this feature set; local image-variant generation and rendering optimization must come first.
- Current implementation strategy for uploaded images:
  - keep original uploaded files,
  - generate/cache derived image sizes on demand through `/uploads`,
  - render cards/galleries/content blocks from responsive variants by default,
  - rely on randomized file names for cache-safe media replacement.
