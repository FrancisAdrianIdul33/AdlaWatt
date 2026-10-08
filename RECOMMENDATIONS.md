As a developer looking at `AdlaWatt-`, here's the updated take: 5 of the original 15 items are now resolved (commits below), and the remaining defense-blocker is down to 2 items — tests and safety thresholds.

> **Status as of threshold wiring.** ✅ = done (commit ref), ⏳ = pending. Line refs re-verified this pass.

What you do well already:

* Live path works: `src/services/monitoringService.ts` + `notificationService.ts` (transition-gated + 10/5-min cooldowns) + `send-alert-email` Edge Function.
* Recommendation engine `src/services/recommendation.ts` is pure/testable — good design.
* Analytics screen wires 17 charts (post appliance-usage removal) — `README.md` still claims 1; docs drift persists (see ⏳ 10).
* Admin scaffold exists (`src/admin/components/AdminDashboardScreen.tsx`), `supabase/migrations/20261007*user_roles.sql`, `appliance-images` bucket + `MediaPickerModal.tsx`, vibration, Google auth, forgot-password — done in code, still listed as missing in `README.md`.
* ✅ NEW since last review: Porch catalog photos (`cctv-camera.png`, `porch-lantern.png` wired in `CATALOG_IMAGES`) — Porch no longer falls back to the default icon.

### P0 — Fix before defense

1. ✅ **User Manual is empty** — RESOLVED two ways: `USER-MANUAL.md` (`ec70f41`, 15 task-oriented sections, usage-verified flows) + in-app screen (`fd47c16`: `user-manual.tsx` rebuilt with 15 EN cards, `ManualCallout`, `ManualSectionCard`, quick-jump chips, AppLogo in §1, Figure 1–8 slots). Remaining: screenshot capture, FIL/CEB translation pass, `TODO.md` checkbox.
2. ✅ **Zero tests** — RESOLVED: jest + jest-expo runner (`npm test`, `jest.config.js` with `@/` alias, dummy-env + AsyncStorage mocks in `jest.setup.js`), 68 tests across 4 suites (`recommendation`, `chartMath`, `analyticsGrouping`, `notificationCooldown` — incl. extracted pure `isWithinCooldown` helper wired into both create paths, behavior-identical), and `.github/workflows/ci.yml` (`tsc` + `lint` + `jest --ci`, coverage collect-only). Deliberately untested: UI components, Realtime channels, Edge Function, E2E.
3. ✅ **Safety thresholds disabled** — RESOLVED as fixed constants (final decision: admin has no publishing role, dashboard is a starting shell with login/logout/exit only): `HIGH_LOAD_WATTS = 800`, `BATTERY_VOLTAGE_MIN/MAX = 11.6/14.6` frozen in `notificationService.ts`; the unapplied `alert_thresholds` migration was deleted (zero remote trace); ThresholdEditor/overview/audit admin tabs removed; rules keep injected-value signatures + transition tests. Remaining: on-device alert end-to-end.
4. ✅ **Native PDF export is fake** — RESOLVED (`2fcf799`): `src/services/reportPrint.ts` (expo-print HTML template, 500-row cap, logo embed) + real-file CSV via new `expo-file-system` `File`/`Paths` API + share sheet; `AnalyticsCard.tsx` exporting state; dead text-share builder deleted. Web jsPDF path untouched. Remaining: on-device verification (needs dev-client rebuild).
5. ✅ **Appliance usage never recorded** — RESOLVED BY REMOVAL (`3445d2d`, your call, out of scope): `appliance_usage_history` query, types, chart functions, CSV/PDF sections, and both chart components deleted (1,853 lines); Usage section keeps its 2 monitoring-based cards. State this scoping in delimitations.

### P1 — Reliability / quality

6. ⏳ **No push notifications** — OPEN: no `expo-notifications`. Vibration + email only work with app open.
7. ⏳ **No offline story** — OPEN: AsyncStorage cache for last `monitoring` row, ESP32 buffer + retry, `last_seen` staleness (10s too aggressive for WiFi jitter) all still unaddressed.
8. ⏳ **Analytics perf** — OPEN (slightly improved: appliance grouping gone with #5, but ~15 `groupMonitoringHistory` calls + 12 frequency states remain). Consolidate grouping; consider server-side RPC.
9. ⏳ **History bloat** — OPEN: 5-min cron snapshots, no retention/index policy. Add 90-day prune + `(user_id, recorded_at)` indexes.
10. ⏳ **Docs sync** — OPEN and grown: `README.md` now additionally stale on manual ("empty" — it isn't), native export ("fake" — it isn't), appliance usage (removed), Porch photos, and language persistence ( vibrates/persists now — see correction below). Freeze one source of truth before submission.
11. ⏳ **Small TODOs (partially done)** — navbar username, `menu.tsx` profile fixed-height + black border still open. CORRECTION to last review: language and vibration **do** persist now (`settings.ts` `adlawatt.language.v1` / `adlawatt.vibration.v1`); only color-blind mode is session-only. Remaining: multi-language display wiring per `TODO.md`.

### P2 — Wow factor for capstone

12. ⏳ **No control path** — OPEN: monitoring only; relay auto-cutoff / fan toggle via `device_commands` still future.
13. ⏳ **No device pairing flow** — OPEN: no QR/WiFi provisioning; manual honestly documents researcher-provisioned units instead.
14. ⏳ **Missing insights** — OPEN: pesos-saved, CO2, best-hour, severe-weather conserve alert.
15. ⏳ **No crash reporting** — OPEN: no Sentry, no OTA strategy, no staging vs prod split.

Revised build order: 10 > 11 > 9 > 8 > 7 > 6 (P2s only if time remains: 12 > 14 > 15 > 13).
