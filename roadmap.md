# Automatic creator code linking
- [x] Link AUSSIESIN to Lucas's CH493 dashboard and verify sign-in.
- [x] Preserve creator identity and old code revenue on Creator Hub code changes via the existing add-creator endpoint.
- [x] Support identity-bearing Google Sheets code changes without modifying revenue maths.
- [x] Pass six identity-linking tests and seven commission tests; deploy add-creator and sheets-sync.
- [ ] Update the external Creator Hub code-change sender and Sheets Apps Script to send stable creator_id or email: blocked by source scripts not available in this project; current Sheets feed sends only code and months. Authenticated webhook checks also need the configured sender secrets.

# Commission deal
- [x] Apply BALIPM10's dated rate consistently to creator, leaderboard and admin commission totals.
- [x] Verify rate boundaries with six passing tests and check the standard creator dashboard remains unchanged.
- [ ] Verify BALIPM10's own dashboard with payable revenue: blocked by no assigned Creator ID and zero synced revenue; admin verification requires a signed-in preview session.
- [ ] Activate year-aware 2027 revenue: blocked by the existing month-only source data and fixed 2026 dataset; requires a year-aware sync before 2027 earnings can be distinguished.