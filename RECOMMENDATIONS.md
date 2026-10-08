As a developer looking at `AdlaWatt-`, here's my honest take: the core is strong, but docs are stale and there are 3 defense-blocking gaps.

What you do well already:

* Live path works: `src/services/monitoringService.ts` + `notificationService.ts` (transition-gated + 10/5-min cooldowns) + `send-alert-email` Edge Function.
* Recommendation engine `src/services/recommendation.ts` is pure/testable — good design.
* `src/app/dashboard/analytics.tsx:97` already wires ~19 charts, not 1 as `README.md:144` claims. Docs drift is hurting you.
* Admin scaffold exists (`src/admin/components/AdminDashboardScreen.tsx`), `supabase/migrations/20261007*user_roles.sql`, `appliance-images` bucket + `MediaPickerModal.tsx`, vibration, Google auth, forgot-password — all marked done in `TODO.md` but still listed as missing in `README.md:177,940`.

### P0 — Fix before defense

1. **User Manual is empty** — `src/app/dashboard/user-manual.tsx:67` is an empty `<View>`. TODO lists this open. SUS evaluators will open this first.
2. **Zero tests** — no `*.test.*` in repo. At minimum add unit tests for `recommendation.ts` (tier/verdict/runtime), `chartMath.ts`, `groupMonitoringHistory` in `analyticsService.ts`, and cooldown logic in `notificationService.ts:55`. No CI either — add `tsc --noEmit + eslint` GitHub Action.
3. **Safety thresholds disabled** — `src/services/notificationService.ts:88` : `SAFE_CURRENT_LOAD_THRESHOLD / VOLTAGE_MIN/MAX = null`. Either wire `src/admin/components/ThresholdEditor.tsx` to DB and read them at runtime, or delete the dead rules. Silent `null` safety checks look bad in defense.
4. **Native PDF export is fake** — `src/app/dashboard/analytics.tsx:685` uses `Share.share({message})` text on native, real jsPDF only on web. Use `expo-print + expo-file-system` for real PDF on Android.
5. **Appliance usage never recorded** — charts `ApplianceEnergyChart / ApplianceRuntimeChart` stay empty until `record_appliance_usage` is called. Auto-log on selection toggle.

### P1 — Reliability / quality

6. **No push notifications** — `package.json` has no `expo-notifications`. Vibration + email only work with app open. Add FCM push via Edge Function for `alert` types.
7. **No offline story** — app + ESP32 both require internet. Add: AsyncStorage cache for last `monitoring` row, ESP32 local buffer + retry, `last_seen` staleness contract (currently 10s in `notificationService.ts:67`, too aggressive for WiFi jitter).
8. **Analytics perf** — `analytics.tsx:226` calls `groupMonitoringHistory` 15+ times per render with 12 separate frequency states. Consolidate to one grouping pass, paginate `loadAnalyticsData`, move aggregation to RPC `get_analytics_report` server-side. Will jank on low-end Android.
9. **History bloat** — 5-min cron snapshots into `monitoring_history` with no retention/index policy. Add 90-day prune + indexes on `(user_id, recorded_at)`.
10. **Docs sync** — `README.md:677,940`, `TODO.md`, `implementation plan/analytics_charts.md:26` contradict code. Freeze one source of truth before submission.
11. **Small TODOs**: navbar username, `menu.tsx` profile fixed-height + black border, i18n `src/locales/en|fil|ceb.ts` wiring (TODO says pending) + persist language, not session-only.

### P2 — Wow factor for capstone

12. **No control path** — monitoring only. Relay already in hardware list; add low-battery auto-cutoff / remote fan toggle (ESP32 polls a `device_commands` table).
13. **No device pairing flow** — how does ESP32 get `user_id`? Add QR provision + WiFi setup guide in manual.
14. **Missing insights**: pesos-saved estimator, CO2 avoided, "best hour to run X" from `SolarCurveByHourChart + PowerByHourChart`, severe-weather conserve alert (noted as missing in `notification_catalog.md:91`).
15. **No crash reporting** — add Sentry, no `expo-updates` OTA strategy, no staging vs prod Supabase.

If I were you, order would be: 1 > 3 > 2 > 4 > 5 > 7 > 6.

Want me to turn this into a sequenced implementation plan with effort estimates, starting with the manual + thresholds + tests?
