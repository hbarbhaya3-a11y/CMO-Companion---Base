"""Seed 6 memory cards from UPS_Memory_Reasoning_v2.docx spec."""
import logging
from app.database import SessionLocal
from app.models.domain import MemoryItem

logger = logging.getLogger(__name__)

SEED_MEMORY = [
    # ── CARD 1: Automotive T1 ABM Ramp ──
    {
        "cxo_id": 1,
        "status": "current",
        "title": "Automotive T1 ABM Ramp — Ford & Stellantis",
        "body": "5 T1 auto accounts $116M below plan. Ford (RFP Aug 12, −$30M) and Stellantis (carrier review open, −$24M) are critical. GM playbook activated — 1-to-1 ABM, NAAF pre-lock, account team restored.",
        "tags": [["HIGH ALERT", "amber"], ["AUTOMOTIVE", "ink"]],
        "owners": "Matt Guffey",
        "region": "US Domestic",
        "coverage": "NAAF, Ground",
        "decision_tree": [
            {"key": "trigger", "label": "Automotive T1 Revenue Gap", "sub": "$116M below plan across 5 T1 auto accounts — Ford and Stellantis most critical", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: FedEx Auto Express", "sub": "FedEx launched USMCA cross-border product Jun 5. Pricing 8% below UPS list. Targeting Ford + Stellantis plant managers.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "ext2", "label": "External: Ford 8-K Production Delay", "sub": "Ford BlueOval City TN production start delayed to Aug 2026. Battery logistics RFP closes Aug 12. ADV gap began Q4 2025.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int1", "label": "Internal: CRM Account Gap Data", "sub": "Ford: −$30M vs plan, account team cut 2.5→1.0 FTE Jan 2026. Stellantis: −$24M vs plan, procurement reorg weakened exec relationships.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "int2", "label": "Internal: ABM Memory — GM Analog", "sub": "INI-2025-027 (GM Detroit): CCO briefings + Industry Expert + NAAF capacity lock lifted engagement +47%. SOW growing. 3 of 4 quarters completed.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — $54M combined gap · 2 accounts · 6-day FedEx timing advantage. GM playbook is highest-confidence analog — same OEM T1 profile, same FedEx threat, same geography.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 5},
            {"key": "options", "label": "Options: NAAF Pre-lock / Price Match / Wait", "sub": "A: NAAF pre-lock + GM ABM playbook (+$40M P50). B: Price match FedEx −8% (margin erosion ~$8M). C: Monitor and respond to RFP (purely reactive).", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 6},
            {"key": "decision", "label": "Matt Selected: Option A — NAAF Pre-lock", "sub": "VP Automotive Sales instructed to route NAAF pre-lock offer to Ford and Stellantis within 48 hours. GM analog removes uncertainty about playbook effectiveness.", "status": "done", "type": "decision", "color": "#0EA5E9", "parent": "options", "order": 7},
            {"key": "reality", "label": "In Reality", "sub": "Ford RFP closes Aug 12. Stellantis procurement VP meeting scheduled. NAAF capacity confirmed 85% ready. Account team restored to 2.0 FTE at Ford.", "status": "active", "type": "outcome", "color": "#0EA5E9", "parent": "decision", "order": 8},
            {"key": "next_gate", "label": "Next Gate", "sub": "Both accounts to respond by Aug 31. Close rate vs +$40M P50 modeled lift is tracking metric. CCO briefing cadence activated monthly.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 9},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2026-06-14", "step": "Signal Detected", "change": "$116M cumulative revenue gap flagged across 5 T1 auto accounts — Ford and Stellantis most critical", "context": "UPS Portfolio Data", "delta": "High", "notes": "Gap exceeds quarterly tolerance threshold — triggered executive review"},
            {"id": "TR02", "date": "2026-06-14", "step": "External Scan", "change": "FedEx launched USMCA cross-border Auto Express product Jun 5 — pricing 8% below UPS list, targeting Ford + Stellantis plant managers", "context": "Competitive Intel", "delta": "High", "notes": "Direct threat to exposed UPS lanes in Detroit-3 corridor"},
            {"id": "TR03", "date": "2026-06-14", "step": "External Scan", "change": "Ford BlueOval City TN production delayed to Aug 2026. Battery logistics RFP closes Aug 12. ADV gap began Q4 2025", "context": "SEC Filing (8-K)", "delta": "High", "notes": "RFP window creates urgency — FedEx could secure forward commitment before Aug"},
            {"id": "TR04", "date": "2026-06-14", "step": "Internal Pull", "change": "Ford: −$30M vs plan, account team cut 2.5→1.0 FTE Jan 2026. Stellantis: −$24M, procurement reorg weakened exec relationships", "context": "CRM Account Data", "delta": "High", "notes": "Coverage ratio 3x below healthy threshold — structural gap, not seasonal"},
            {"id": "TR05", "date": "2026-06-14", "step": "Internal Pull", "change": "GM Detroit playbook (INI-2025-027): CCO briefings + NAAF capacity lock lifted engagement +47%. SOW growing across 3 of 4 quarters", "context": "Historical Playbook", "delta": "OK", "notes": "Proven analog exists — reduces execution risk of proposed strategy"},
            {"id": "TR06", "date": "2026-06-14", "step": "Correlation", "change": "HIGH — $54M combined gap, 2 accounts at risk, 6-day FedEx timing advantage. NAAF pre-lock eliminates FedEx timing advantage by offering August launch as present commercial offer", "context": "Companion Analysis", "delta": "Action", "notes": "Convergence of internal weakness and external aggression requires immediate response"},
            {"id": "TR07", "date": "2026-06-14", "step": "Options Presented", "change": "3 paths: A) NAAF pre-lock + GM ABM playbook (+$40M P50), B) Price match FedEx −8% (margin erosion ~$8M), C) Monitor and respond to RFP (reactive)", "context": "Companion Analysis", "delta": "OK", "notes": "Each option addresses different risk dimension — capability vs price vs wait"},
            {"id": "TR08", "date": "2026-06-14", "step": "User Decision", "change": "Matt approved Option A. VP Automotive Sales instructed to route NAAF pre-lock offer to Ford and Stellantis account teams within 48 hours", "context": "User Decision", "delta": "Action", "notes": "GM analog removes uncertainty. NAAF pre-lock is only move defeating FedEx on timing. Price matching gives margin away; waiting gives accounts away"},
            {"id": "TR09", "date": "2026-06-15", "step": "Execution", "change": "NAAF pre-lock offer routed. Account team restored to 2.0 FTE at Ford. Stellantis procurement VP meeting scheduled", "context": "Account Team Action", "delta": "OK", "notes": "NAAF capacity confirmed 85% ready — operational bottleneck cleared"},
            {"id": "TR10", "date": "2026-06-22", "step": "Status Check", "change": "Ford RFP closes Aug 12. Stellantis carrier review open. NAAF capacity 85% ready. CCO briefing cadence activated monthly", "context": "Execution Tracker", "delta": "Action", "notes": "Both accounts to respond by Aug 31 — close rate vs +$40M P50 is tracking metric"},
        ],
    },
    # ── CARD 2: AutoZone Renewal Save-Play ──
    {
        "cxo_id": 1,
        "status": "current",
        "title": "AutoZone Renewal Save-Play — L2 Override Decision",
        "body": "AutoZone ($41M, Pkt 10941) facing FedEx counter-offer. Analyst staged S3 (floor breach, OR 0.70) but S2 (Happy Returns bundle, OR 0.67) is viable within guardrails. CCO sign-off required.",
        "tags": [["HIGH ALERT", "amber"], ["ENTERPRISE", "ink"]],
        "owners": "Matt Guffey",
        "region": "US Domestic",
        "coverage": "Ground, SurePost",
        "decision_tree": [
            {"key": "trigger", "label": "AutoZone $41M Renewal at Risk", "sub": "FedEx counter-offer received. Analyst staged override (S3) but compliant alternative (S2) exists.", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: AutoZone Q3 Earnings", "sub": "AutoZone publicly stated 'reviewing carrier diversification.' FedEx counter-offer at −8.5% base discount with 24-month lock.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "int1", "label": "Internal: FedEx Counter Pricing", "sub": "FedEx pricing at −8.5% base on aftermarket lanes. Time-bound offer. Aftermarket peak season Aug–Oct narrows retention window.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int2", "label": "Internal: Deal Analyser — Pkt 10941", "sub": "Analyst T. Whitaker staged S0–S3. S3 matches FedEx at OR 0.70 — breaches L2 ceiling TARGET 81.1%→143%. S2: Happy Returns bundle, OR 0.67, profit $14.4M.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "int3", "label": "Internal: O'Reilly 2024 Analog", "sub": "Prior L2 override approved with peak-season SLA + Happy Returns bundle. Closed 14% above modeled OR. Bundle saves outperform price-match saves.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — $41M at risk · Override precedent risk · Renewal due Jul 30. S2 delivers higher profit ($14.4M vs $11.8M) AND avoids portfolio-wide override precedent.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 5},
            {"key": "options", "label": "Options: Happy Returns Bundle / L2 Override / Decline", "sub": "A: S2 Happy Returns bundle (OR 0.67, profit $14.4M, within guardrails). B: S3 floor override (OR 0.70, profit $11.8M, precedent risk). C: Decline — accept churn ($41M lost).", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 6},
            {"key": "decision", "label": "Matt Selected: Option A — S2 Happy Returns", "sub": "Directed analyst to re-stage with S2 as lead. Sent back without approving S3 override. Guardrail exists to prevent margin leakage disguised as retention.", "status": "done", "type": "decision", "color": "#0EA5E9", "parent": "options", "order": 7},
            {"key": "reality", "label": "In Reality", "sub": "S2 proposal delivered to AutoZone sourcing team Jun 14. Happy Returns attach confirmed viable with aftermarket volume. AutoZone evaluating.", "status": "active", "type": "outcome", "color": "#0EA5E9", "parent": "decision", "order": 8},
            {"key": "next_gate", "label": "Next Gate", "sub": "AutoZone decision expected before Jul 30 renewal date. L1 Accessorial cap tightening 20%→18% routed to VP Revenue Mgmt.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 9},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2026-06-03", "step": "Signal Detected", "change": "AutoZone ($41M, Pkt 10941) flagged — FedEx counter-offer at −8.5% base discount with 24-month lock", "context": "Deal Analyser", "delta": "High", "notes": "Renewal due Jul 30 — narrow retention window with aftermarket peak season Aug–Oct"},
            {"id": "TR02", "date": "2026-06-03", "step": "External Scan", "change": "AutoZone Q3 earnings: publicly stated 'reviewing carrier diversification' — confirms churn risk is real, not posturing", "context": "Earnings Call", "delta": "High", "notes": "Public statement signals active evaluation — not just leverage negotiation"},
            {"id": "TR03", "date": "2026-06-03", "step": "Internal Pull", "change": "Analyst T. Whitaker staged S0–S3. S3 matches FedEx at OR 0.70 — breaches L2 Tier ceiling TARGET 81.1%→143%", "context": "Deal Analyser", "delta": "High", "notes": "S3 was staged as lead recommendation despite guardrail breach — process concern"},
            {"id": "TR04", "date": "2026-06-03", "step": "Internal Pull", "change": "S2 alternative: Happy Returns bundle, OR 0.67, within guardrails, profit $14.4M (+$2.6M more than S3)", "context": "Deal Analyser", "delta": "OK", "notes": "Compliant option exists that is MORE profitable — S3 escalation was unnecessary"},
            {"id": "TR05", "date": "2026-06-03", "step": "Internal Pull", "change": "O'Reilly Auto 2024 analog: L2 override with Happy Returns bundle closed 14% above modeled OR. Bundle saves consistently outperform price-match saves", "context": "Historical Playbook", "delta": "OK", "notes": "Proven analog confirms bundle approach — reduces execution risk"},
            {"id": "TR06", "date": "2026-06-03", "step": "Correlation", "change": "HIGH — $41M at risk, override precedent risk, Jul 30 deadline. Happy Returns is genuine fit with aftermarket return volume, not a concession", "context": "Companion Analysis", "delta": "Action", "notes": "S2 is both more profitable AND avoids precedent — clear recommendation"},
            {"id": "TR07", "date": "2026-06-03", "step": "Options Presented", "change": "A: S2 Happy Returns (OR 0.67, $14.4M profit). B: S3 floor override (OR 0.70, $11.8M, precedent risk). C: Decline ($41M lost)", "context": "Companion Analysis", "delta": "OK", "notes": "Option A recommended — higher profit, within guardrails, proven analog"},
            {"id": "TR08", "date": "2026-06-03", "step": "User Decision", "change": "Matt directed analyst to re-stage with S2 as lead. S3 override NOT approved. Guardrail preserved.", "context": "User Decision", "delta": "Action", "notes": "Guardrail exists to prevent margin leakage disguised as customer retention — principle upheld"},
            {"id": "TR09", "date": "2026-06-14", "step": "Execution", "change": "S2 proposal delivered to AutoZone sourcing team. Happy Returns attach confirmed viable with aftermarket volume", "context": "Account Team Action", "delta": "OK", "notes": "AutoZone evaluating — decision expected before Jul 30 renewal date"},
            {"id": "TR10", "date": "2026-06-22", "step": "Policy Action", "change": "L1 Accessorial cap tightening 20%→18% routed to VP Revenue Mgmt for portfolio review", "context": "Pricing Policy", "delta": "Action", "notes": "Systemic fix to prevent future override escalations like this one"},
        ],
    },
    # ── CARD 3: Amazon Exit — Capacity Reallocation ──
    {
        "cxo_id": 1,
        "status": "current",
        "title": "Amazon Exit — Capacity Reallocation Pace Risk Review",
        "body": "~500K ADV freed in Q1. SMB (34.5%) and Healthcare ($3B) absorbing well. Enterprise Automotive is the pace risk — 5 accounts $116M below plan. Q2 margin guide (7.5–8.5%) depends on both clearing.",
        "tags": [["STRATEGY", "ink"], ["REVENUE", "green"]],
        "owners": "Matt Guffey",
        "region": "US Domestic",
        "coverage": "Ground, Air, Healthcare",
        "decision_tree": [
            {"key": "trigger", "label": "Amazon Capacity Reallocation Review", "sub": "~500K ADV freed in Q1. Absorption tracking across segments — Automotive is pace risk to Q2 margin guide.", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: Q1 2026 Earnings", "sub": "Amazon ADV reduced 500K pieces/day in Q1. Now 8.8% of revenue (from 13%+). June 2026 completion confirmed by CEO. 23 facilities closed.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "ext2", "label": "External: FedEx + Market Signal", "sub": "FedEx +10% US domestic revenue in Q3 FY26. Targeting freed UPS enterprise capacity in Automotive with Auto Express product.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int1", "label": "Internal: Segment Absorption Data", "sub": "SMB: 34.5% record. B2B: 45.2% (6-yr high). Healthcare: $3B first quarter. RPP +6.5% YoY. Premium mix shift working in 3 of 4 segments.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "int2", "label": "Internal: Enterprise Gap Tracker", "sub": "Automotive T1 accounts $116M below plan — freed enterprise capacity not absorbed as modeled. Root cause: Jan 2026 coverage reduction + FedEx timing.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — Q2 margin guide 7.5–8.5% requires both: one-time costs clearing AND auto segment gap closing. Automotive is the single largest variable in H2 recovery math.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 5},
            {"key": "options", "label": "Options: Accelerate ABM / Accept Pace Risk", "sub": "A: Accelerate Automotive ABM + weekly tracking. Activate ABM ramp on Ford + Stellantis. B: Accept pace risk — over-rotate SMB + Healthcare to compensate.", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 6},
            {"key": "decision", "label": "Matt Selected: Option A — Accelerate ABM", "sub": "ABM ramp on Ford + Stellantis activated. Weekly margin dashboard commissioned. Ops reallocation scorecard requested.", "status": "done", "type": "decision", "color": "#0EA5E9", "parent": "options", "order": 7},
            {"key": "reality", "label": "In Reality", "sub": "ABM ramp active on Ford + Stellantis. NAAF pre-lock in motion. Q2 margin recovery depends on one-time cost clearance (confirmed non-recurring) + Automotive close rate.", "status": "active", "type": "outcome", "color": "#0EA5E9", "parent": "decision", "order": 8},
            {"key": "next_gate", "label": "Next Gate", "sub": "Q2 margin target 7.5–8.5%. H2 target 11–13% to reach 9.6% FY. Automotive account close rate by Aug 31 is the single biggest variable.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 9},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2026-05-01", "step": "Signal Detected", "change": "Amazon ADV reduced 500K pieces/day in Q1 — now 8.8% of revenue (from 13%+). 23 facilities closed. June completion confirmed", "context": "Q1 Earnings", "delta": "OK", "notes": "Amazon exit on track — structural transformation proceeding as planned"},
            {"id": "TR02", "date": "2026-05-01", "step": "External Scan", "change": "FedEx +10% US domestic revenue in Q3 FY26. FedEx Express targeting freed UPS enterprise capacity in Automotive with Auto Express", "context": "Competitive Intel", "delta": "High", "notes": "Competitive window narrowing — FedEx exploiting UPS transition"},
            {"id": "TR03", "date": "2026-05-01", "step": "Internal Pull", "change": "SMB: 34.5% record. B2B: 45.2% (6-yr high). Healthcare: $3B first quarter. RPP +6.5% YoY. Premium mix shift working in 3 of 4 segments", "context": "Segment Absorption Data", "delta": "OK", "notes": "Three segments absorbing ahead of schedule — structural thesis validated"},
            {"id": "TR04", "date": "2026-05-01", "step": "Internal Pull", "change": "Automotive T1 accounts $116M below plan — freed enterprise capacity not absorbed as modeled. Root cause: Jan 2026 coverage reduction + FedEx timing", "context": "Enterprise Gap Tracker", "delta": "High", "notes": "Only segment where reallocation is not converting to margin — pace risk identified"},
            {"id": "TR05", "date": "2026-05-01", "step": "Correlation", "change": "Q2 margin guide 7.5–8.5% requires both one-time costs clearing AND auto segment gap closing. $116M gap is single largest variable in H2 recovery", "context": "Companion Analysis", "delta": "Action", "notes": "9.6% FY margin guide requires H2 margins of 11–13% — achievable only if Automotive closes gap"},
            {"id": "TR06", "date": "2026-05-01", "step": "Options Presented", "change": "A: Accelerate Automotive ABM + weekly tracking dashboard. B: Accept pace risk — over-rotate SMB + Healthcare to compensate", "context": "Companion Analysis", "delta": "OK", "notes": "Option B compounds the Automotive problem — FedEx deepens penetration while UPS over-rotates to already-performing segments"},
            {"id": "TR07", "date": "2026-05-01", "step": "User Decision", "change": "Matt approved Option A. ABM ramp on Ford + Stellantis activated. Weekly margin dashboard commissioned. Ops reallocation scorecard requested", "context": "User Decision", "delta": "Action", "notes": "Option A addresses root cause directly rather than compensating around it"},
            {"id": "TR08", "date": "2026-06-01", "step": "Execution", "change": "ABM ramp active. NAAF pre-lock in motion. One-time costs ($350M: MD-11 retirement, Ground Saver, weather) confirmed non-recurring by CFO", "context": "Execution Tracker", "delta": "OK", "notes": "Q2 recovery depends on both cost clearance (confirmed) and Automotive close rate (in progress)"},
            {"id": "TR09", "date": "2026-06-15", "step": "Network Savings", "change": "$600M network savings realized in Q1. $3B structural savings program on track. Driver Choice reductions confirmed structural", "context": "Operations Data", "delta": "OK", "notes": "Structural cost improvements are delivering — variable is commercial execution"},
            {"id": "TR10", "date": "2026-06-22", "step": "Status Check", "change": "Q2 margin 7.5–8.5% range. H2 needs 11–13% for 9.6% FY guide. Automotive close rate by Aug 31 is single biggest variable", "context": "Financial Planning", "delta": "Action", "notes": "Weekly margin dashboard now live — tracking close rate vs +$40M P50 modeled lift"},
        ],
    },
    # ── CARD 4: Board Pre-Read ──
    {
        "cxo_id": 1,
        "status": "current",
        "title": "Board Pre-Read — Q2 2026 Commercial Strategy Narrative",
        "body": "Board meets June 18. Deck due June 11. Board will probe: Q1 margin drag, $89.7B recovery path, NAAF $50M ROI, FedEx posture. Narrative anchors on prior commitments delivered — SMB record, Healthcare $3B, Amazon exit on track.",
        "tags": [["BOARD", "amber"], ["STRATEGY", "ink"]],
        "owners": "Matt Guffey",
        "region": "US Domestic",
        "coverage": "Enterprise-wide",
        "decision_tree": [
            {"key": "trigger", "label": "Board Pre-Read Due June 11", "sub": "Board meets June 18. Deck must address Q1 margin drag, recovery path, NAAF ROI, and FedEx posture.", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: Board Agenda + Prior Transcript", "sub": "Q4 2025 commitments: Amazon exit, SMB record, Healthcare $20B path, 50 facilities closed H1. All delivered or on track. FedEx +10% growth on Board's radar.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "ext2", "label": "External: FedEx + Macro Signal", "sub": "FedEx Freight spin-off Jun 1. FedEx Express +10% Q3 US domestic. Middle East fuel spike. 10% import surcharge extended to Sep 30.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int1", "label": "Internal: Q1 2026 Performance", "sub": "Q1 margin 4.0% (adj.) — below Q2 guide 7.5–8.5%. $350M one-time costs: MD-11 retirement, Ground Saver, weather/casualty. CFO: 'largely behind us.'", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "int2", "label": "Internal: Commercial Progress", "sub": "SMB 34.5% record. Healthcare $3B first quarter. B2B 45.2% (6-yr high). Amazon exit on track. Network savings $600M Q1. NAAF launches August.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — Board credibility on $89.7B / 9.6% guide requires crisp narrative. All Q4 commitments delivered. Q1 drag explained by non-recurring costs. H2 mechanism must be specific.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 5},
            {"key": "options", "label": "Options: Lead with Commitments / Lead with Guide", "sub": "A: Lead with delivered commitments → explain Q1 → H2 mechanism → FedEx → NAAF. B: Lead with Q2 guide and H2 expectations first (risk: 'why believe the guide given Q1?').", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 6},
            {"key": "decision", "label": "Matt Selected: Option A — Commitments First", "sub": "Deck structure: prior commitments → Q1 drag → Q2 mechanism → FedEx → NAAF. CFO alignment completed before submission.", "status": "done", "type": "decision", "color": "#0EA5E9", "parent": "options", "order": 7},
            {"key": "reality", "label": "In Reality", "sub": "Deck submitted June 11. CFO narrative alignment completed. Four Board probe questions with prepared answers. NAAF ROI answer: Ford + Stellantis windows close before September.", "status": "active", "type": "outcome", "color": "#0EA5E9", "parent": "decision", "order": 8},
            {"key": "next_gate", "label": "Next Gate", "sub": "Board meeting June 18. Goal: Board exits with confidence in FY guide + H2 inflection narrative. Prior commitment tracker in slide 1 is key framing device.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 9},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2026-06-06", "step": "Signal Detected", "change": "Board meeting June 18 — deck due June 11. Q1 margin 4.0% vs 7.5–8.5% guide will be probed", "context": "Board Calendar", "delta": "High", "notes": "Credibility on $89.7B / 9.6% FY guide depends on narrative framing"},
            {"id": "TR02", "date": "2026-06-06", "step": "External Scan", "change": "Q4 2025 Board commitments tracker: Amazon exit ✓, SMB record ✓, Healthcare $20B path ✓, 50 facilities closed ✓", "context": "Board Transcript", "delta": "OK", "notes": "All prior commitments delivered — this is the credibility anchor"},
            {"id": "TR03", "date": "2026-06-06", "step": "External Scan", "change": "FedEx Freight spin-off Jun 1. FedEx Express +10% Q3 US domestic. Middle East fuel spike. Import surcharge extended to Sep 30", "context": "Market Data", "delta": "High", "notes": "Board will probe competitive posture and macro impact on guide"},
            {"id": "TR04", "date": "2026-06-06", "step": "Internal Pull", "change": "Q1 margin 4.0% (adj). $350M one-time costs: MD-11 retirement ($120M), Ground Saver ($95M), weather/casualty ($135M). CFO confirms non-recurring", "context": "Financial Data", "delta": "High", "notes": "Q1 drag is fully explained by non-recurring costs — narrative problem if framed wrong"},
            {"id": "TR05", "date": "2026-06-06", "step": "Internal Pull", "change": "SMB 34.5%, Healthcare $3B, B2B 45.2%, Amazon 8.8%, RPP +6.5%. Network savings $600M. NAAF launches August", "context": "Commercial Tracker", "delta": "OK", "notes": "Structural thesis (yield over volume, SMB, Healthcare) is playing out in data"},
            {"id": "TR06", "date": "2026-06-06", "step": "Correlation", "change": "Prior commitment delivery is credibility anchor. Q1 drag becomes problem only if framed wrong. H2 mechanism must be specific, not 'we expect improvement'", "context": "Companion Analysis", "delta": "Action", "notes": "Board enters trusting strategy — narrative must reinforce, not undermine, that trust"},
            {"id": "TR07", "date": "2026-06-06", "step": "Options Presented", "change": "A: Lead with delivered commitments → Q1 explain → H2 mechanism. B: Lead with Q2 guide first (risk: back-footed on 'why believe?')", "context": "Companion Analysis", "delta": "OK", "notes": "Option A lets Q1 explanation land as expected, not alarming"},
            {"id": "TR08", "date": "2026-06-06", "step": "User Decision", "change": "Matt approved Option A. Deck structure set: commitments → Q1 drag → Q2 mechanism → FedEx → NAAF. CFO alignment required", "context": "User Decision", "delta": "Action", "notes": "Board confidence in H2 depends on believing Q1 was transitional — delivered commitment list is evidence"},
            {"id": "TR09", "date": "2026-06-11", "step": "Execution", "change": "Deck submitted June 11. CFO narrative alignment completed. Four Board probe questions with prepared answers drafted", "context": "Deliverable Tracker", "delta": "OK", "notes": "NAAF ROI answer prepared: Ford + Stellantis windows close before September"},
            {"id": "TR10", "date": "2026-06-17", "step": "Status Check", "change": "Board meeting June 18. Slide 1: prior commitments tracker. Prepared answers for: margin drag, recovery path, NAAF ROI, FedEx posture", "context": "Meeting Prep", "delta": "Action", "notes": "Goal: Board exits with confidence in FY guide + H2 inflection narrative"},
        ],
    },
    # ── CARD 5: Enterprise Pricing Discipline (RESOLVED) ──
    {
        "cxo_id": 1,
        "status": "resolved",
        "title": "Enterprise Pricing Discipline — L1 Accessorial Cap 22%→20%",
        "body": "Portfolio-wide ceiling tightened Aug 2025. Result: $42M actual vs $36M modeled (+17%). Margin realization +6pp. Win-rate compression −1.2pp (within tolerance). Policy now permanent.",
        "tags": [["ENTERPRISE", "ink"], ["PRICING", "green"]],
        "owners": "R. Patel (VP Revenue Management)",
        "region": "US Domestic",
        "coverage": "Enterprise-wide",
        "decision_tree": [
            {"key": "trigger", "label": "Accessorial Margin Leakage Identified", "sub": "Portfolio audit flagged post-approval concessions as #1 margin leakage source. UPS at 22% ceiling was above market range.", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: Market Benchmark", "sub": "Carrier benchmark Q2 2025: 16–20% Off is market range for accessorial concessions. UPS at 22% ceiling drifted upward through successive negotiation rounds.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "ext2", "label": "External: FedEx Pricing Posture", "sub": "FedEx applying DIM to 90% of shipments + tighter accessorial discipline. UPS 22% ceiling creating margin gap vs competitor posture.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int1", "label": "Internal: Portfolio Audit — 187 Packets", "sub": "Post-approval accessorial concessions (FSC, RES, DAS) identified as #1 leakage. 84% realization vs 90%+ target. 172 packets affected.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "int2", "label": "Internal: Historical Close Rate Data", "sub": "Win-rate model: 2pp ceiling tightening = −1.5pp retention compression (tolerable) + $12M profit recovery. Prior L1 cycles confirmed model.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — $12M per 2pp · 84%→90%+ realization target. Ceiling drift not visible until audit surfaced it. 172 packets already above new ceiling.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 5},
            {"key": "options", "label": "Options: Tighten to 20% / Tighten to 18%", "sub": "A: Tighten to 20% Off — immediate portfolio effect, modeled +$12M, −1.5pp win-rate. B: Tighten to 18% Off in one step — faster but −3pp win-rate risk.", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 6},
            {"key": "decision", "label": "Matt Selected: Option A — 20% Off Ceiling", "sub": "CFO co-signed. Analyst pool trained within 2 weeks. DA guardrails updated to flag any breach automatically. Sequencing over speed.", "status": "done", "type": "decision", "color": "#2CA58D", "parent": "options", "order": 7},
            {"key": "outcome", "label": "Resolved: $42M Actual vs $36M Modeled", "sub": "$42M actual (+17% above model). Margin realization +6pp. Win-rate compression −1.2pp (better than −1.5pp modeled). 172 packets rerated. Policy permanent.", "status": "done", "type": "outcome", "color": "#2CA58D", "parent": "decision", "order": 8},
            {"key": "next_step", "label": "Next Step: Tighten to 18%", "sub": "Next guardrail review cycle. Modeled additional recovery: +$12M. AutoZone (Pkt 10941) handled as single-use exception — not a ceiling change.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 9},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2025-07-15", "step": "Signal Detected", "change": "Portfolio audit flagged post-approval accessorial concessions (FSC, RES, DAS) as #1 margin leakage source — 84% realization vs 90%+ target", "context": "Portfolio Audit", "delta": "High", "notes": "Concessions added after formal packet approval — bypassing DA guardrail process"},
            {"id": "TR02", "date": "2025-07-15", "step": "External Scan", "change": "Carrier benchmark: 16–20% Off is market range. UPS at 22% ceiling — above market, drifted upward through successive negotiation rounds", "context": "Market Benchmark", "delta": "High", "notes": "UPS ceiling above market range — unforced margin leakage"},
            {"id": "TR03", "date": "2025-07-15", "step": "External Scan", "change": "FedEx applying DIM to 90% of shipments + tighter accessorial discipline. UPS 22% ceiling creating margin gap vs competitor", "context": "Competitive Intel", "delta": "High", "notes": "Competitor tightening while UPS drifting — gap widening"},
            {"id": "TR04", "date": "2025-07-15", "step": "Internal Pull", "change": "187 packets audited. 172 affected by ceiling change. Post-approval concessions identified in 84% of enterprise packets", "context": "Deal Analyser Audit", "delta": "High", "notes": "Systemic issue — not isolated to specific analysts or accounts"},
            {"id": "TR05", "date": "2025-07-15", "step": "Internal Pull", "change": "Win-rate model: 2pp tightening = −1.5pp retention compression + $12M profit recovery. Prior L1 cycles confirmed model accuracy", "context": "Historical Close Data", "delta": "OK", "notes": "Model has track record — risk is quantified and within tolerance"},
            {"id": "TR06", "date": "2025-07-15", "step": "Correlation", "change": "Tightening to 20% aligns to market, recovers $12M, within win-rate tolerance. Mechanism is clear and reversible if competitive data changes", "context": "Companion Analysis", "delta": "Action", "notes": "Bigger risk was NOT acting — continued drift compounds realization gap"},
            {"id": "TR07", "date": "2025-07-15", "step": "Options Presented", "change": "A: Tighten to 20% (+$12M, −1.5pp win-rate). B: Tighten to 18% in one step (faster but −3pp risk, too aggressive mid-cycle)", "context": "Companion Analysis", "delta": "OK", "notes": "Option B recommended as second step after Option A outcome measured"},
            {"id": "TR08", "date": "2025-08-01", "step": "User Decision", "change": "Matt approved Option A (20% Off). CFO co-signed. Analyst pool trained within 2 weeks. DA guardrails updated to auto-flag breaches", "context": "User Decision", "delta": "Action", "notes": "Sequencing matters more than speed — 18% is right next step after this outcome confirmed"},
            {"id": "TR09", "date": "2025-12-01", "step": "Outcome Measured", "change": "$42M actual vs $36M modeled (+17%). Margin realization +6pp. Win-rate compression −1.2pp (better than −1.5pp modeled)", "context": "Performance Review", "delta": "OK", "notes": "Outperformed model on both margin recovery and win-rate — policy now permanent"},
            {"id": "TR10", "date": "2026-05-26", "step": "Resolved + Next", "change": "172 packets rerated, 6 of 8 above-ceiling packets renegotiated. Next step: tighten to 18% in next guardrail review cycle (+$12M additional)", "context": "Policy Review", "delta": "Action", "notes": "AutoZone (Pkt 10941) handled as single-use exception — not a ceiling change"},
        ],
        "learnings": [
            {"category": "worked", "body": "Hard policy ceiling with clear governance proved more effective than 'soft guidance' had been previously. The ceiling proved immediately learnable for the analyst pool — escalation churn was minimal within 4 weeks. The $42M actual vs $36M modeled (+17% outperformance) validates both the model and the implementation quality. Closed-won margin recovery was clean and visible within one quarter."},
            {"category": "didnt_work", "body": "Win-rate compression on Retention saves (−1.2pp) was within tolerance but still created two packet withdrawals totaling approximately $8M opportunity cost. These were time-bound deals that couldn't wait for the grandfathering review. A 5-business-day expedite path for time-bound retention deals was not in place at go-live."},
            {"category": "next_time", "body": "When implementing any pricing policy tightening, simultaneously publish: (1) the new ceiling, (2) a 5-business-day expedite review path for time-bound Retention deals, (3) a 6-month grandfathering window for deals already in late-stage Customer Counter. The expedite path prevents the withdrawal losses that ceiling changes create on time-sensitive packets."},
        ],
    },
    # ── CARD 6: SMB Digital Access Program (RESOLVED) ──
    {
        "cxo_id": 1,
        "status": "resolved",
        "title": "SMB Digital Access Program — Q1 Acquisition Acceleration",
        "body": "SMB at record 34.5% of US volume. Three verticals targeted: Healthcare SMB ($380M headroom), Auto Aftermarket ($210M), High-Tech ($155M). FedEx post-spin threat pre-empted. Cohorts locked before Q3.",
        "tags": [["SMB", "green"], ["DIGITAL", "ink"]],
        "owners": "Sarah Chen (Head of SMB Marketing)",
        "region": "US Domestic",
        "coverage": "Digital Access, Healthcare, Ground",
        "decision_tree": [
            {"key": "trigger", "label": "SMB Acquisition Window — FedEx Post-Spin", "sub": "6–8 week window before FedEx can launch meaningful SMB digital campaign post Freight spin-off. $745M total vertical headroom.", "status": "done", "type": "signal", "color": "#2CA58D", "parent": None, "order": 0},
            {"key": "ext1", "label": "External: FedEx Post-Spin Signal", "sub": "FedEx Freight spin-off Jun 1 frees Express management attention and capital. Ship Manager historically inferior to DAP but post-spin SMB digital investment is obvious next move.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "ext2", "label": "External: Q1 2026 SMB Performance", "sub": "SMB 34.5% record (from 31.2% prior year). B2B 45.2% (6-yr high). SMB ADV grew despite overall US Dom ADV down 8% YoY. RPP +6.5%.", "status": "done", "type": "data_external", "color": "#2CA58D", "parent": "trigger", "order": 1},
            {"key": "int1", "label": "Internal: Vertical Headroom Model", "sub": "Healthcare SMB: $380M (Andlauer + Frigo-Trans cold-chain unique). Auto Aftermarket SMB: $210M (downstream of T1 ABM). High-Tech SMB: $155M (re-shoring).", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 2},
            {"key": "int2", "label": "Internal: DAP Cohort Performance", "sub": "Healthcare lifecycle campaigns: +12% above baseline. 1-to-many ABM (1,498 Tier-3 accounts) has proven response rate from T1 seed data.", "status": "done", "type": "data_internal", "color": "#2CA58D", "parent": "trigger", "order": 3},
            {"key": "correlates", "label": "Companion Correlates", "sub": "HIGH — 6-week pre-emption window · $745M total headroom. UPS has 3 advantages FedEx can't match quickly: Andlauer cold-chain, T1 auto network, DAP conversion data.", "status": "done", "type": "analysis", "color": "#2CA58D", "parent": "trigger", "order": 4},
            {"key": "options", "label": "Options: 3-Vertical Simultaneous / Healthcare Only", "sub": "A: 3-vertical simultaneous DAP campaign (Healthcare + Auto Aftermarket + High-Tech). B: Healthcare SMB only — highest headroom, sequence others.", "status": "done", "type": "action", "color": "#2CA58D", "parent": "correlates", "order": 5},
            {"key": "decision", "label": "Matt Selected: Option A — 3-Vertical Launch", "sub": "Three-vertical simultaneous launch. Healthcare lifecycle + Auto Aftermarket 1-to-many ABM (1,498 accounts) + High-Tech re-shoring cohort. Two-week activation.", "status": "done", "type": "decision", "color": "#2CA58D", "parent": "options", "order": 6},
            {"key": "outcome", "label": "Resolved: Cohorts Performing Above Baseline", "sub": "Healthcare DAP +12%. Auto Aftermarket first-response +18%. High-Tech 90-day retention above baseline (weeks 45–70 churn flagged). Q2 SMB +60bps QoQ.", "status": "done", "type": "outcome", "color": "#2CA58D", "parent": "decision", "order": 7},
            {"key": "next_step", "label": "Next Step: Monitor FedEx Response", "sub": "Watch Q3 for FedEx digital SMB response. High-Tech weeks 45–70 retention: SLA to be added to DAP onboarding for capability-led cohorts.", "status": "pending", "type": "outcome", "color": "#9CA3AF", "parent": "decision", "order": 8},
        ],
        "activity_log": [
            {"id": "TR01", "date": "2026-03-15", "step": "Signal Detected", "change": "FedEx Freight spin-off Jun 1 creates 6–8 week window — FedEx Express will refocus on SMB digital. Ship Manager investment coming", "context": "Competitive Intel", "delta": "High", "notes": "Window is binding constraint — timing advantage over FedEx, not capability"},
            {"id": "TR02", "date": "2026-03-15", "step": "External Scan", "change": "SMB at 34.5% record (from 31.2% prior year). B2B 45.2%. SMB ADV grew despite overall US Dom ADV down 8% YoY. RPP +6.5%", "context": "Q1 Performance", "delta": "OK", "notes": "SMB momentum is real and accelerating — investment timing is right"},
            {"id": "TR03", "date": "2026-03-15", "step": "Internal Pull", "change": "Vertical headroom: Healthcare SMB $380M (Andlauer cold-chain unique), Auto Aftermarket $210M (T1 ABM downstream), High-Tech $155M (re-shoring)", "context": "Headroom Model", "delta": "OK", "notes": "$745M total addressable — three verticals where UPS has structural advantages"},
            {"id": "TR04", "date": "2026-03-15", "step": "Internal Pull", "change": "DAP conversion baselines by vertical available. Healthcare lifecycle: +12% above baseline. 1-to-many ABM (1,498 Tier-3) has proven response rate", "context": "DAP Cohort Data", "delta": "OK", "notes": "Proven performance data reduces execution risk across all three verticals"},
            {"id": "TR05", "date": "2026-03-15", "step": "Correlation", "change": "UPS has 3 advantages FedEx can't match quickly: Andlauer cold-chain (Healthcare), T1 auto relationship network (Aftermarket seeding), DAP conversion data", "context": "Companion Analysis", "delta": "Action", "notes": "Activating cohort campaigns NOW locks loyalty before FedEx enters — waiting forfeits window"},
            {"id": "TR06", "date": "2026-03-15", "step": "Options Presented", "change": "A: 3-vertical simultaneous DAP campaign (all within 2 weeks). B: Healthcare only — highest headroom, sequence others later", "context": "Companion Analysis", "delta": "OK", "notes": "Option B sequencing would allow FedEx to enter Auto Aftermarket and High-Tech uncontested"},
            {"id": "TR07", "date": "2026-03-15", "step": "User Decision", "change": "Matt approved Option A. 3-vertical simultaneous launch. Healthcare lifecycle + Auto Aftermarket 1-to-many ABM (1,498 accounts) + High-Tech re-shoring", "context": "User Decision", "delta": "Action", "notes": "6-week window is binding constraint, not execution capacity. Option B forfeits 2 of 3 verticals"},
            {"id": "TR08", "date": "2026-04-01", "step": "Launch", "change": "All three campaigns activated within 2-week target. Healthcare lifecycle, Auto Aftermarket ABM, High-Tech re-shoring cohort live", "context": "Campaign Tracker", "delta": "OK", "notes": "Execution on schedule — FedEx SMB digital campaign not yet visible in market"},
            {"id": "TR09", "date": "2026-06-01", "step": "Outcome Measured", "change": "Healthcare DAP +12% above baseline. Auto Aftermarket first-response +18%. High-Tech 90-day retention above baseline but weeks 45–70 churn higher than modeled", "context": "Cohort Performance", "delta": "OK", "notes": "Two verticals exceeding targets. High-Tech churn flagged to product team for SLA fix"},
            {"id": "TR10", "date": "2026-06-15", "step": "Resolved + Monitor", "change": "Q2 SMB trending +60bps QoQ. FedEx SMB digital campaign not yet visible. High-Tech weeks 45–70: service-quality SLA to be added to DAP onboarding", "context": "Performance Review", "delta": "Action", "notes": "Window strategy worked — monitor Q3 for FedEx response. High-Tech cohort fix in progress"},
        ],
        "learnings": [
            {"category": "worked", "body": "The 1-to-many ABM downstream extension (using the T1 Automotive account list as a seed for Automotive Aftermarket SMB targeting) was a creative and capital-efficient move — it piggy-backed on existing industry relationships and event sponsorships to reach a 10× larger account set. Healthcare cold-chain thought leadership worked because Andlauer + Frigo-Trans capability is genuinely unique — DAP converts higher when the service differentiation is real."},
            {"category": "didnt_work", "body": "90-day retention for the High-Tech SMB cohort, while above baseline, showed higher churn in weeks 45–70 than the model predicted. The re-shoring narrative drove signup but post-signup service experience in some tech-heavy zip codes had slower pickup windows than premium SMB customers expected. Product team alerted."},
            {"category": "next_time", "body": "For any SMB cohort that is capability-led (cold-chain, hazmat, re-shoring), build a service-quality SLA for that specific cohort into the DAP onboarding flow from day 1 — not as a reactive retention measure. Cohorts with a specific capability value-prop churn when the capability promise isn't matched by the operational delivery in weeks 30–60."},
        ],
    },
]


SEED_TITLES = {card["title"] for card in SEED_MEMORY}


def seed_memory_cards():
    db = SessionLocal()
    try:
        existing_titles = {
            r[0] for r in db.query(MemoryItem.title).filter(MemoryItem.cxo_id == 1).all()
        }
        to_add = [c for c in SEED_MEMORY if c["title"] not in existing_titles]
        for card in to_add:
            db.add(MemoryItem(**card))
            logger.info(f"Seeded memory card: {card['title'][:50]}")
        updated = 0
        for card in SEED_MEMORY:
            if card["title"] in existing_titles and card.get("learnings"):
                existing = db.query(MemoryItem).filter(MemoryItem.title == card["title"], MemoryItem.cxo_id == 1).first()
                if existing and not existing.learnings:
                    existing.learnings = card["learnings"]
                    updated += 1
                    logger.info(f"Updated learnings for: {card['title'][:50]}")
        if not to_add and not updated:
            logger.info("All seed memory cards up to date — skipping")
            return
        db.commit()
        logger.info(f"Seeded {len(to_add)} new, updated {updated} existing memory cards")
    except Exception as e:
        logger.error(f"Failed to seed memory cards: {e}")
        db.rollback()
    finally:
        db.close()
