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

[~] Phase 4. Deployment verification and ops hardening
- [x] Update `.env.example` and `README.md` for the new domain setup
- [x] Validate `docker compose config`
- [x] Validate shell scripts locally
- [x] Document required VPS steps after `git pull`
- [x] Fix first-run deploy when Prisma migrations are empty
- [~] Stabilize reverse proxy upstream strategy for this VPS

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
- Finalize the reverse proxy upstream strategy used on the VPS.
- Deploy the pricing changes and run `prisma db push` on the VPS.
- Manually verify mixed-period bookings, admin manual booking totals, saved booking history, and period creation on the live environment.
- Smooth admin UX for editing price periods so partial rows do not show blocking validation while the user is still filling them in.
- Improve booking calendar UX: compact price summary, 3-click range selection reset, and softer range highlight styling.
- User-facing booking summary now groups contiguous equal-price days; calendar selection resets on the third click and uses softer range colors.
- Booking calendar stabilization was completed locally: conflicting global DayPicker overrides were removed, the public booking form now owns its range visuals, and client booking dates are sent as `YYYY-MM-DD` to avoid one-day shifts.
- Public booking calendar still needs one more stabilization pass: the click/reset logic must stop using DayPicker's residual range behavior, and the endpoint circles should be enlarged slightly to match the range fill.
- Public booking calendar range selection is now fully owned by custom modifiers in `BookingForm`; the third click resets both calculations and highlight, and the endpoint circles were enlarged to sit flush with the range fill.

Durable Notes
- This is stabilization and extension of the current implementation, not a redesign.
- Deployment changes stay isolated from `main` in the separate branch.
- Existing bookings must preserve their original amounts even if room prices change later.
- Dynamic pricing must support bookings that span multiple pricing periods with correct nightly totals.
- Price periods for one room must never overlap; admin should see a warning and the save must be rejected until periods are corrected.
- A server-side save bug was found after first deploy: period prices must be written as normalized `number + Date` values, not re-serialized strings before `createMany`.
