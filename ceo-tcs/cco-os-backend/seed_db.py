from datetime import datetime
from app.database import SessionLocal, engine, Base
from app.models.domain import Firm, CXO, HomeCard, KPI, Signal, AttentionItem, MemoryItem
from app.models.simulation import LeverDefinition, Scenario, ScenarioResult
from app.models.abm import AutoKPI, AutoSubsegment, AutoAccount, AutoMarketSignal, AutoInitiative, ABMAccountDetail, ABMInitiativeDetail
from app.models.enterprise import (
    EnterpriseKPI, DAPacket, LiveDeal, PricingBridge,
    EntStrategicDeal, EntMarginTrajectory, EntSignalEffect,
    DealLeverDefinition, EntInitiative, EntLeverActivity, EntPipelineStage,
)
from app.models.wargame import WargameCompetitor
from app.models.chat import ChatSession, ChatMessageRecord
from app.models.user import User
from app.utils.auth import hash_password

# Drop and recreate tables to pick up schema changes
MemoryItem.__table__.drop(engine, checkfirst=True)
Signal.__table__.drop(engine, checkfirst=True)
ABMAccountDetail.__table__.drop(engine, checkfirst=True)
ABMInitiativeDetail.__table__.drop(engine, checkfirst=True)

# Create all tables
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()

    # Clear existing data to prevent duplicates
    db.query(Firm).delete()
    db.query(CXO).delete()
    db.query(HomeCard).delete()
    db.query(AttentionItem).delete()
    db.query(KPI).delete()
    db.query(Signal).delete()
    db.query(LeverDefinition).delete()
    db.query(Scenario).delete()
    db.query(ScenarioResult).delete()
    db.query(AutoKPI).delete()
    db.query(AutoSubsegment).delete()
    db.query(AutoAccount).delete()
    db.query(AutoMarketSignal).delete()
    db.query(AutoInitiative).delete()
    db.query(ABMAccountDetail).delete()
    db.query(ABMInitiativeDetail).delete()
    db.query(EnterpriseKPI).delete()
    db.query(DAPacket).delete()
    db.query(LiveDeal).delete()
    db.query(PricingBridge).delete()
    db.query(EntStrategicDeal).delete()
    db.query(EntMarginTrajectory).delete()
    db.query(EntSignalEffect).delete()
    db.query(DealLeverDefinition).delete()
    db.query(EntInitiative).delete()
    db.query(EntLeverActivity).delete()
    db.query(EntPipelineStage).delete()
    db.query(MemoryItem).delete()
    db.query(WargameCompetitor).delete()
    db.query(User).delete()
    db.commit()

    # Seed default users
    admin = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        full_name="CCO Admin",
        role="admin",
        cxo_id=1,
    )
    matt = User(
        username="matt.guffey",
        hashed_password=hash_password("ups2026"),
        full_name="Matt Guffey",
        role="cxo",
        cxo_id=1,
    )
    db.add(admin)
    db.add(matt)
    db.commit()

    # Create Firm
    firm = Firm(name="UPS", industry="Logistics")
    db.add(firm)
    db.commit()

    # Create CXO
    cxo = CXO(firm_id=firm.id, name="Matt Guffey", title="Chief Commercial Officer")
    db.add(cxo)
    db.commit()

    # Add Home Cards
    cards = [
        {
            "tone": "urgent", "tag": "HIGH PRIORITY", 
            "title": "Q2 SMB BACKFILL PACING",
            "body": "SMB revenue growth is 4.8% behind the network-backfill plan as the Amazon glide-down completes this month. Existing accounts are stable, but newly acquired SMB cohorts show weaker first-90-day ship frequency and lower 90-day revenue retention. Digital-acquisition decay, onboarding completion gaps, and a crowded competitive pricing window may be suppressing durable, high-yield growth.",
            "cta": "INVESTIGATE BACKFILL GAP", "to_view": "investigate"
        },
        {
            "tone": "amber", "tag": "EMERGING RISK", 
            "title": "EUROPE EXPORT YIELD & SENTIMENT DIP",
            "body": "Net customer sentiment on Europe export lanes is down 9 pts over the last 14 days following the latest rate adjustment and de-minimis policy shifts. Freight-forwarder chatter is amplifying the narrative, and SMB export bookings have softened despite healthy network on-time performance.",
            "cta": "INVESTIGATE EXPORT DIP", "to_view": "signals"
        },
        {
            "tone": "green", "tag": "OPPORTUNITY", 
            "title": "HEALTHCARE COLD-CHAIN WINDOW OPENING",
            "body": "Temperature-controlled and clinical-trial logistics demand in the US Northeast and EU is up 11% QoQ, and a key competitor just delayed a regional cold-chain facility. There's a 6–8 week window to lock in enterprise healthcare contracts and dedicated capacity before peak.",
            "cta": "EXPLORE OPPORTUNITY", "to_view": "decision"
        }
    ]
    for c in cards:
        db.add(HomeCard(cxo_id=cxo.id, **c))

    # Add KPIs
    kpis = [
        {"label": "US Domestic ADV", "val": "−8.0%", "sub": "YoY", "chip": "Volume", "note": "Planned decline — Amazon glide-down completing June.", "spark": [7,6,5,5,4,4,3], "up": False},
        {"label": "Revenue per Piece", "val": "$15.32", "sub": "+6.5% YoY", "chip": "Yield", "note": "Yield ahead of plan; base rates + mix driving gains.", "spark": [3,4,4,5,6,6,7], "up": True},
        {"label": "SMB Penetration", "val": "34.5%", "sub": "record high", "chip": "SMB", "note": "Highest SMB share of US volume in company history.", "spark": [4,5,5,6,6,7,7], "up": True},
        {"label": "Healthcare Revenue", "val": "$3.0B", "sub": "first $3B quarter", "chip": "Healthcare", "note": "First $3B quarter — all three segments growing.", "spark": [3,4,4,5,6,6,7], "up": True},
        {"label": "International Revenue", "val": "$4.5B", "sub": "+3.8% YoY", "chip": "International", "note": "Growth across all regions; premium-market focus.", "spark": [4,5,5,5,6,6,7], "up": True},
        {"label": "Op Margin (consol.)", "val": "6.2%", "sub": "−1.9 pts", "chip": "Margin", "note": "Non-GAAP adj. ~$350M transitional costs; recovery guided in Q2.", "spark": [7,7,6,6,5,5,6], "up": False},
        {"label": "Customer Sentiment*", "val": "74", "sub": "+4 pts QoQ", "chip": "Service", "note": "Stable across enterprise even with rate activity.", "spark": [5,5,6,6,6,7,7], "up": True},
        {"label": "Account Retention*", "val": "91%", "sub": "+0.7 pts QoQ", "chip": "Retention", "note": "Installed-base retention nudging up across verticals.", "spark": [5,6,6,6,7,7,7], "up": True}
    ]
    for k in kpis:
        db.add(KPI(cxo_id=cxo.id, **k))

    # Add Signals — enrichment matches the reference UI layout:
    # - metrics: colored stat cards under "Why it matters"
    # - key_insight: single paragraph for "Key Insight" card
    # - recent_activity: timeline items for "Recent Activity" card
    # - related_topics: bullet list for "Related Topics" card
    # - recommended_takeaways: 2-col table (action/reasoning + impact)
    # - confidence_description: contextual description for signal strength
    # - context_questions: dynamic chat questions when user opens ChatFAB
    signals = [
        {
            "tag": "Urgent", "tone": "urgent", "title": "Cost-to-acquire rising faster than SMB yield recovery",
            "timestamp": "Jun 12, 2026 · 09:14 AM EST",
            "metric": "ACQUISITION EFFICIENCY", "delta": "−7.8% QoQ", "delta_neg": True,
            "desc": "SMB acquisition cost is up 7.8% QoQ across paid digital and field-sales motions; quote-to-close is lagging the cost curve.",
            "why": "Efficiency is declining across two major acquisition motions, creating pressure on the SMB backfill needed as Amazon volume exits.",
            "src": "UPS Revenue Management", "ago": "1h ago",
            "rows": [["Baseline", "CAC flat QoQ target"], ["Current", "SMB CAC +7.8% QoQ"], ["Time window", "Last quarter"], ["Source types", "Paid digital, field sales, MMM model"], ["Likely driver", "Auction inflation + softer landing-page conversion"]],
            "next_action": "Rebalance spend toward digital (DAP) and lifecycle channels",
            "open": True, "is_row2": False,
            "signal_enrichment": {
                "why_it_matters": "The Amazon glide-down removes $11.3B in annual shipping revenue. UPS's entire FY26 network-backfill strategy depends on replacing that volume with higher-yield SMB shippers acquired through the Digital Access Program and field sales. CAC is now rising 7.8% QoQ — driven by Google/Meta auction inflation and a 0.7pt drop in landing-page conversion — while new-cohort 90-day retention sits at just 71% vs the 84% target. If acquisition costs keep outrunning yield recovery, the backfill plan falls further behind the current 4.8% gap, putting $91B in total revenue at structural risk.",
                "metrics": [
                    {"value": "−7.8%", "label": "Acquisition efficiency QoQ", "negative": True, "positive": False},
                    {"value": "+7.8%", "label": "CAC QoQ", "negative": True, "positive": False},
                    {"value": "+0.9%", "label": "Conversion rate QoQ", "negative": False, "positive": True}
                ],
                "key_insight": "CAC is up 7.8% QoQ on paid digital (Google, Meta) and field-sales channels while landing-page conversion only recovered +0.9% QoQ. The cost curve is outrunning the funnel — Digital Access Program acquisitions now cost 58% less per activated shipper than field-sales, and creator-attributed signups through Shopify/WooCommerce integrations are beating paid social on a $/install basis. UPS processed 21.1M packages daily in 2024; every basis point of acquisition efficiency affects network utilization across 5.2M sq ft of Worldport capacity.",
                "recent_activity": [
                    {"action": "MMM model refresh flagged CAC +7.8% QoQ across paid digital and field-sales", "actor": "Revenue Mgmt Analytics", "time": "1h ago"},
                    {"action": "Google Ads auction CPMs spiked 12% in logistics verticals ahead of peak planning", "actor": "Digital Marketing", "time": "6h ago"},
                    {"action": "Landing-page conversion rate slipped 0.7 pts on the SMB acquisition flow (3.1% → 2.4%)", "actor": "UPS Digital", "time": "1d ago"},
                    {"action": "DAP-attributed signups outpaced paid social on a $/install basis for first time this quarter", "actor": "Digital Commerce", "time": "3d ago"}
                ],
                "related_topics": ["Paid Digital Spend", "Field Sales ROI", "Digital Access Program", "Landing Page CRO", "Marketing Mix Model", "SMB Onboarding"],
                "recommended_takeaways": [
                    {"action": "Discuss a paid digital spend pullback with the growth and media teams", "reasoning": "because it could lead to consensus around how much budget to shift out of inflating Meta and Google auctions this quarter.", "impact": "Reallocates an estimated $4.2M of paid social spend into more efficient DAP and lifecycle channels within 30 days."},
                    {"action": "Discuss the SMB landing-page conversion backlog with the web and lifecycle teams", "reasoning": "because it could lead to consensus around which conversion-rate fixes get shipped before the next acquisition push.", "impact": "A prioritized 2-sprint CRO plan targeting the 0.7pt conversion gap on paid landing flows — could recover 2,800+ leads/month."},
                    {"action": "Discuss expanding DAP-attributed acquisition with the partnerships team", "reasoning": "because it could lead to consensus around moving budget into Shopify/WooCommerce integration channels where $/install is now beating paid social.", "impact": "Locks in 2-3 expanded integration deals to absorb shifted spend with a lower blended CAC across 14,200+ DAP signups."},
                    {"action": "Discuss the CAC vs. LTV narrative ahead of the quarterly board review with finance", "reasoning": "because it could lead to consensus on whether to revise the FY CAC guardrail or hold and absorb pressure.", "impact": "A pre-aligned CAC framing for finance review — no surprises in the QBR deck, with UPS's $15.32 yield advantage as context."}
                ],
                "data_sources": [
                    {"name": "UPS Revenue Management", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                    {"name": "Marketing Mix Model (MMM)", "type": "Internal", "confidence": "High", "updated": "Weekly"},
                    {"name": "Digital Commerce Analytics", "type": "Internal", "confidence": "High", "updated": "Daily"},
                    {"name": "Google Ads Auction Insights", "type": "External", "confidence": "Medium", "updated": "Daily"}
                ],
                "confidence_description": "High confidence — corroborated by MMM model, paid platforms, and finance reconciliation.",
                "context_questions": [
                    "Break down CAC by acquisition channel — paid digital vs. field vs. DAP",
                    "What's the revenue gap if CAC stays elevated through Q3?",
                    "How does the $4.2M DAP reallocation affect the Amazon backfill timeline?",
                    "Which field-sales territories have the worst ROI per activated shipper?"
                ]
            }
        },
        {
            "tag": "Opportunity", "tone": "green", "title": "Revenue quality holding strong",
            "timestamp": "Jun 12, 2026 · 07:42 AM EST",
            "metric": "REVENUE PER PIECE", "delta": "+7.7% QoQ", "delta_neg": False,
            "desc": "Global revenue per piece reached $15.32, up 7.7%, driven by SMB, B2B and premium mix.",
            "why": "Yield is outpacing the volume decline — the mix shift is working and creating room to be selective.",
            "src": "UPS Finance", "ago": "2h ago", "rows": [], "next_action": "", "is_row2": False,
            "signal_enrichment": {
                "why_it_matters": "Revenue per piece hit $15.32 — the clearest proof that Carol Tomé's yield-over-volume strategy is working. Despite US Domestic ADV declining 8% YoY as planned Amazon volume exits ($11.3B annually), the remaining portfolio is structurally higher-margin. SMB now accounts for 29% of total revenue (up from 24% YoY), healthcare RPP leads all verticals at $22.80, and surcharge realization reached 97%. This gives the CCO office leverage to resist pressure to chase low-yield volume and stay selective on new business — critical as FedEx and DHL ramp competitive pricing in Q3.",
                "metrics": [
                    {"value": "$15.32", "label": "Revenue per piece", "negative": False, "positive": True},
                    {"value": "+7.7%", "label": "Yield improvement QoQ", "negative": False, "positive": True},
                    {"value": "29%", "label": "SMB share of revenue", "negative": False, "positive": True}
                ],
                "key_insight": "The yield-over-volume strategy is producing durable results — not just higher prices but better mix. SMB revenue per piece is $18.40 vs $12.10 enterprise average, B2B premium services grew 14% while standard declined 3%, and healthcare commands $22.80/piece. Surcharge realization hit 97% (up from 91% last year), meaning pricing discipline is holding across the 490,000-employee salesforce. The $1.22/piece advantage over FedEx's estimated $14.10 reflects genuine service differentiation, not temporary pricing power.",
                "recent_activity": [
                    {"action": "Finance published Q2 yield report — $15.32 RPP exceeds $14.80 internal target by 3.5%", "actor": "UPS Finance", "time": "2h ago"},
                    {"action": "Pricing team confirmed override rate below 2% threshold — no unplanned discounting in Q2", "actor": "Pricing & Strategy", "time": "Yesterday"},
                    {"action": "Enterprise sales identified 12 accounts ready for premium service migration", "actor": "Enterprise Sales", "time": "2d ago"},
                    {"action": "Healthcare RPP crossed $22.80 — highest across all segments, driven by Marken clinical trial logistics", "actor": "Healthcare Division", "time": "3d ago"}
                ],
                "related_topics": ["Yield Strategy", "SMB Mix Shift", "Premium Service Migration", "Surcharge Realization", "Healthcare Logistics", "FedEx Pricing Gap"],
                "recommended_takeaways": [
                    {"action": "Lock the $15.32 yield baseline into Q3 targets with the finance team", "reasoning": "because it could lead to consensus that volume-chasing discounts would destroy the mix gains Carol Tomé's strategy has built.", "impact": "Protects $1.22/piece yield advantage over FedEx in Q3 planning — prevents reactive discounting worth an estimated $180M annually."},
                    {"action": "Discuss the 12 premium-migration candidates with enterprise account teams", "reasoning": "because it could lead to consensus on which accounts to prioritize for standard-to-premium conversion before FedEx/DHL competitive offers land in Q3.", "impact": "Converts 8-12 accounts to premium tiers, adding an estimated $4-6M in incremental high-yield revenue."},
                    {"action": "Review the volume floor threshold with network planning", "reasoning": "because yield improvement only works above a volume floor — further Amazon-related declines could trigger fixed-cost leverage problems at Worldport.", "impact": "Establishes a clear volume floor KPI for Q4 planning, preventing a surprise margin compression scenario."}
                ],
                "data_sources": [
                    {"name": "UPS Finance", "type": "Internal", "confidence": "High", "updated": "Daily"},
                    {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                    {"name": "Pricing & Strategy", "type": "Internal", "confidence": "High", "updated": "Weekly"}
                ],
                "confidence_description": "High confidence — corroborated by finance actuals, pricing telemetry, and segment mix analysis.",
                "context_questions": [
                    "What's driving the $15.32 RPP improvement by business segment?",
                    "How does our $1.22/piece yield advantage compare to FedEx and DHL?",
                    "Which 12 accounts are best candidates for premium service migration?",
                    "What volume floor should we set to protect Worldport fixed-cost leverage?"
                ]
            }
        },
        {
            "tag": "Opportunity", "tone": "green", "title": "Digital Access (DAP) momentum",
            "timestamp": "Jun 11, 2026 · 03:28 PM EST",
            "metric": "DIGITAL-ATTRIBUTED REVENUE", "delta": "+18% QoQ", "delta_neg": False,
            "desc": "Digital Access Program signups are up 28% QoQ; digital-attributed SMB revenue up 18% QoQ.",
            "why": "The quarterly trend is compounding — digital is becoming a durable, low-cost SMB acquisition channel.",
            "src": "UPS Digital", "ago": "3h ago",
            "rows": [["Baseline", "+10% signup target"], ["Current", "+28% QoQ"], ["Time window", "Last quarter"], ["Source types", "ups.com, DAP, marketplace integrations"], ["Likely driver", "SMB onboarding + integration partnerships"]],
            "next_action": "Expand digital incentives ahead of peak", "is_row2": False,
            "signal_enrichment": {
                "why_it_matters": "DAP is the fastest path to replacing Amazon volume with higher-yield SMB shippers. Signups hit 14,200 this quarter (+28% QoQ), activation rate reached 78% (up from 64%), and DAP-attributed SMB revenue crossed a $48M annual run-rate. Shopify and WooCommerce integrations now account for 41% of signups, and the upcoming Amazon Seller Central integration could add 3,000-5,000 new shippers in 90 days. At 58% lower CAC than field sales and 11% higher first-quarter ship frequency, DAP is the channel that makes the network-backfill plan work.",
                "metrics": [
                    {"value": "+28%", "label": "DAP signup growth QoQ", "negative": False, "positive": True},
                    {"value": "78%", "label": "Activation rate (14-day)", "negative": False, "positive": True},
                    {"value": "$48M", "label": "DAP revenue run-rate", "negative": False, "positive": True}
                ],
                "key_insight": "DAP is compounding — not a one-time spike. Signups grew 28% QoQ to 14,200, activation rate jumped to 78% (from 64%), and average revenue per active shipper rose 9% to $342/month. The channel delivers 2.4× marginal ROI vs field sales. Shopify integration v2 launched last week with 3× higher early adoption than v1. Amazon Seller Central integration approved for Q3 launch — projected 3,000-5,000 new shippers in first 90 days, directly addressing the Amazon backfill gap.",
                "recent_activity": [
                    {"action": "DAP-attributed SMB revenue crossed $48M annual run-rate, 18% QoQ ahead of $42M plan", "actor": "UPS Digital Commerce", "time": "3h ago"},
                    {"action": "Shopify integration v2 launched — real-time rate comparison + auto-label. 3× v1 adoption", "actor": "Platform Partnerships", "time": "1w ago"},
                    {"action": "Amazon Seller Central integration approved — Q3 launch, 3-5K new shippers projected", "actor": "Product Development", "time": "2w ago"},
                    {"action": "$4.2M budget reallocation from field-sales to DAP incentives requested", "actor": "Digital Commerce", "time": "3d ago"}
                ],
                "related_topics": ["Digital Access Program", "Shopify Integration", "WooCommerce Sellers", "Amazon Seller Central", "SMB Onboarding", "Marketplace Partnerships"],
                "recommended_takeaways": [
                    {"action": "Approve the $4.2M field-to-DAP budget reallocation with finance and growth teams", "reasoning": "because DAP delivers 2.4× marginal ROI vs field sales, and delaying past Q3 peak planning locks loses the window.", "impact": "Accelerates DAP scaling by funding 6,000+ additional incentivized activations before peak season."},
                    {"action": "Discuss fast-tracking Amazon Seller Central integration with product and engineering", "reasoning": "because 3,000-5,000 projected new shippers in 90 days represents the single largest backfill opportunity this quarter.", "impact": "Pulls forward the biggest single-channel growth lever for Amazon volume replacement."},
                    {"action": "Review first-shipment incentive levels with the DAP team", "reasoning": "because testing $50-75 incentives (vs current $25) for multi-service activation could boost revenue per shipper from $342 to $400+/month.", "impact": "Higher activation incentives could increase DAP revenue per shipper 15-20%, adding $7-9M to the annual run-rate."},
                    {"action": "Set up cohort-over-cohort quality tracking with analytics", "reasoning": "because 78% activation is strong but quality could dilute as volume scales — need early warning before it shows in retention.", "impact": "Early detection of quality dilution prevents a costly retention problem 90 days downstream."}
                ],
                "data_sources": [
                    {"name": "UPS Digital Commerce", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                    {"name": "DAP Analytics Platform", "type": "Internal", "confidence": "High", "updated": "Daily"},
                    {"name": "Shopify Partner Dashboard", "type": "External", "confidence": "Medium", "updated": "Weekly"},
                    {"name": "Marketing Mix Model", "type": "Internal", "confidence": "High", "updated": "Weekly"}
                ],
                "confidence_description": "High confidence — corroborated by DAP platform data, partner dashboards, and MMM validation.",
                "context_questions": [
                    "What's the projected DAP revenue if we approve the $4.2M reallocation?",
                    "How does DAP shipper 90-day retention compare to field-sales acquired accounts?",
                    "What's the Amazon Seller Central integration timeline, risk, and expected ramp?",
                    "Which marketplace integrations should we prioritize after Shopify v2?"
                ]
            }
        },
        {
            "title": "Healthcare crosses $3B quarter", "tag": "Opportunity", "tone": "green", "is_row2": True, "timestamp": "Jun 11, 2026 · 11:05 AM EST",
            "signal_enrichment": {
                "why_it_matters": "Healthcare logistics crossed a $3.04B quarterly milestone — UPS's highest-yield vertical at $22.80 revenue per piece. Temperature-controlled and clinical-trial demand in the US Northeast and EU is up 11% QoQ, driven by Marken (acquired 2016) and MNX (acquired 2023). A FedEx regional cold-chain facility delay in Memphis (July → September) creates a 6-8 week window to lock in enterprise pharma contracts and dedicated capacity before peak. UPS Healthcare now leverages the Singapore Changi Asia-Pacific Hub's -20°C to 25°C cold chain infrastructure and UPS Flight Forward drone deliveries for time-critical clinical trial logistics.",
                "metrics": [
                    {"value": "$3.04B", "label": "Healthcare quarterly revenue", "negative": False, "positive": True},
                    {"value": "+11%", "label": "Cold-chain demand QoQ", "negative": False, "positive": True},
                    {"value": "$22.80", "label": "Healthcare RPP (highest)", "negative": False, "positive": True}
                ],
                "key_insight": "Healthcare is UPS's premium margin engine — $22.80 RPP is nearly double the $12.10 enterprise average. The Marken clinical trial platform and MNX time-critical acquisitions give UPS a differentiated cold-chain network that competitors can't replicate quickly. FedEx's Memphis cold-chain hub delay opens a window to capture displaced pharma capacity demand in the US Northeast corridor, where UPS already has strong infrastructure.",
                "recent_activity": [
                    {"action": "Healthcare revenue confirmed at $3.04B — first-ever $3B quarter milestone", "actor": "Healthcare Logistics", "time": "Today"},
                    {"action": "FedEx Memphis cold-chain hub delayed July → September", "actor": "Competitive Intelligence", "time": "Yesterday"},
                    {"action": "Marken clinical trial shipments up 14% QoQ in EU markets", "actor": "Marken Division", "time": "3d ago"},
                    {"action": "Singapore Changi hub expanded 25% — 40% more import, 45% more export capacity", "actor": "Network Planning", "time": "1w ago"}
                ],
                "related_topics": ["Cold-Chain Infrastructure", "Clinical Trial Logistics", "Marken Platform", "FedEx Competition", "Pharma Accounts", "Singapore Hub"],
                "recommended_takeaways": [
                    {"action": "Accelerate enterprise pharma contract outreach during the FedEx delay window", "reasoning": "because the 6-8 week gap before FedEx's Memphis hub opens is a time-limited opportunity to capture displaced capacity demand.", "impact": "Locks in 3-5 enterprise pharma contracts worth an estimated $120-200M annually in the Northeast corridor."},
                    {"action": "Discuss cold-chain capacity expansion in the US Northeast with network planning", "reasoning": "because demand is up 11% QoQ and current capacity is at 87% utilization — a bottleneck risk before peak.", "impact": "Prevents capacity-driven customer losses and supports the $3B+ quarterly run-rate trajectory."}
                ],
                "data_sources": [
                    {"name": "Healthcare Logistics Division", "type": "Internal", "confidence": "High", "updated": "Daily"},
                    {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "Weekly"},
                    {"name": "Marken Clinical Ops", "type": "Internal", "confidence": "High", "updated": "Real-time"}
                ],
                "confidence_description": "High confidence — internal revenue data confirmed, competitor delay verified through multiple channels.",
                "context_questions": [
                    "Which pharma accounts are most at risk when FedEx's Memphis hub opens in September?",
                    "What cold-chain capacity can we add in the Northeast within 6 weeks?",
                    "How does healthcare margin compare to SMB and enterprise verticals?",
                    "What's the Marken clinical trial pipeline for Q3?"
                ]
            }
        },
        {
            "title": "Customer sentiment stable across enterprise", "tag": "Stable", "tone": "amber", "is_row2": True, "timestamp": "Jun 10, 2026 · 04:52 PM EST",
            "signal_enrichment": {
                "why_it_matters": "Enterprise NPS is flat at +32 for three consecutive quarters despite on-time delivery improving 2.1 points to 96.8%. The stability masks a concerning divergence: mid-market enterprise accounts ($500K-$2M annual revenue) show a 6% increase in competitive quote requests — active shopping behavior. UPS serves 490,000 employees across 220+ countries, but customer experience investment has lagged what FedEx and DHL are deploying. The 2023 Teamsters contract raised driver pay to $95K/year — if sentiment doesn't improve, the cost structure becomes harder to sustain without pricing power erosion.",
                "metrics": [
                    {"value": "+32", "label": "Enterprise NPS (flat 3 quarters)", "negative": False, "positive": False},
                    {"value": "+6%", "label": "Competitive quote requests", "negative": True, "positive": False},
                    {"value": "96.8%", "label": "On-time delivery rate", "negative": False, "positive": True}
                ],
                "key_insight": "Service quality is improving (96.8% OTD, +2.1pts) but sentiment isn't following — suggesting enterprise customers value something beyond delivery performance that UPS isn't measuring or addressing. Mid-market accounts ($500K-$2M) are most at risk, with a 6% spike in competitive quoting. This segment represents roughly $8.2B in annual revenue. FedEx's Happy Returns acquisition (reverse logistics) and DHL's 8-12% win-back discounts are changing what 'good enough' means for enterprise shippers.",
                "recent_activity": [
                    {"action": "Q2 NPS survey: enterprise stable at +32, mid-market dipped to +28 (from +30)", "actor": "Customer Experience", "time": "Today"},
                    {"action": "Pricing telemetry flagged 6% increase in competitive quote requests from mid-market", "actor": "Revenue Management", "time": "2d ago"},
                    {"action": "FedEx launched Happy Returns integration for enterprise accounts — reverse logistics play", "actor": "Competitive Intelligence", "time": "1w ago"},
                    {"action": "On-time delivery performance hit 96.8%, best in 5 quarters", "actor": "Network Operations", "time": "1w ago"}
                ],
                "related_topics": ["Enterprise NPS", "Mid-Market Retention", "Competitive Quoting", "Customer Experience", "FedEx Happy Returns", "Service Quality Gap"],
                "recommended_takeaways": [
                    {"action": "Launch a proactive mid-market retention program with the enterprise sales team", "reasoning": "because the 6% spike in competitive quoting signals active shopping behavior worth an estimated $8.2B in annual revenue at risk.", "impact": "Proactive outreach to the top 50 at-risk mid-market accounts with value-adds and contract extensions before competitive offers convert."},
                    {"action": "Commission qualitative research on the sentiment-service gap with the CX team", "reasoning": "because OTD is up 2.1pts but NPS hasn't moved — understanding what enterprise customers value beyond delivery performance is critical.", "impact": "Identifies the 2-3 experience dimensions driving the gap, enabling targeted CX investments that actually move NPS."}
                ],
                "data_sources": [
                    {"name": "Customer Experience Analytics", "type": "Internal", "confidence": "High", "updated": "Quarterly"},
                    {"name": "Revenue Management Telemetry", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                    {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "Weekly"}
                ],
                "confidence_description": "Moderate confidence — NPS survey data is quarterly, competitive quoting data is real-time but sample-based.",
                "context_questions": [
                    "Which mid-market accounts are showing the most competitive shopping behavior?",
                    "What's driving the gap between OTD improvement and flat NPS?",
                    "How does our NPS compare to FedEx and DHL enterprise segments?",
                    "What would a mid-market retention program cost vs. the revenue at risk?"
                ]
            }
        },
        {
            "title": "Competitive pricing window tightens", "tag": "Watch", "tone": "amber", "is_row2": True, "timestamp": "Jun 10, 2026 · 10:17 AM EST",
            "signal_enrichment": {
                "why_it_matters": "FedEx and DHL are both signaling aggressive Q3 pricing moves. FedEx's 'Auto Express' dedicated automotive logistics service launches August 4 — six days ahead of UPS's NAAF Mexico expansion (Aug 10). Pre-launch marketing is already targeting 3 of UPS's top-10 automotive accounts. DHL is running targeted win-back campaigns offering 8-12% discounts to enterprise accounts in the $1M-$5M band — 14 UPS accounts have received competitive proposals in the last 30 days. Meanwhile, 42% of UPS enterprise contracts by revenue are up for renewal in Q3-Q4, the most concentrated renewal window in 3 years. UPS's $1.22/piece yield advantage ($15.32 vs FedEx's estimated $14.10) reflects genuine service differentiation, but blanket discounting to match would sacrifice margin across 21.1M daily packages.",
                "metrics": [
                    {"value": "6 days", "label": "FedEx Auto Express lead time", "negative": True, "positive": False},
                    {"value": "14", "label": "Accounts with DHL proposals", "negative": True, "positive": False},
                    {"value": "42%", "label": "Enterprise revenue up for renewal Q3-Q4", "negative": False, "positive": False}
                ],
                "key_insight": "The competitive window is narrowing on two fronts simultaneously. FedEx's Auto Express targets UPS's automotive vertical — its pre-launch marketing has reached 3 top-10 accounts before UPS NAAF Mexico even launches. DHL is running a different play: surgical 8-12% discounts aimed at the $1M-$5M enterprise band where UPS's value proposition is hardest to differentiate. With 42% of enterprise contracts by revenue renewing in Q3-Q4, this is the most concentrated competitive exposure in 3 years. Price-matching would sacrifice the $1.22/piece yield advantage that makes the yield-over-volume strategy work.",
                "recent_activity": [
                    {"action": "Competitive intelligence briefing: FedEx and DHL both showing more aggressive posture than Q2", "actor": "Strategy & CI", "time": "Today"},
                    {"action": "14 UPS enterprise accounts received DHL competitive proposals (8-12% discounts)", "actor": "Enterprise Sales", "time": "Last 30d"},
                    {"action": "FedEx Auto Express pre-launch marketing spotted targeting 3 UPS top-10 auto accounts", "actor": "Competitive Intelligence", "time": "1w ago"},
                    {"action": "Q3-Q4 contract renewal analysis: 42% of enterprise revenue up for renewal", "actor": "Revenue Management", "time": "2w ago"}
                ],
                "related_topics": ["FedEx Auto Express", "DHL Win-Back Campaign", "NAAF Mexico Launch", "Contract Renewals", "Pricing Discipline", "Enterprise Retention"],
                "recommended_takeaways": [
                    {"action": "Accelerate NAAF Mexico launch readiness and consider soft-launch to key automotive accounts before Aug 10", "reasoning": "because FedEx launches Auto Express 6 days ahead (Aug 4) and is already marketing to UPS's top accounts — being second to market loses the narrative.", "impact": "Neutralizes FedEx's first-mover advantage with key automotive accounts and protects an estimated $340M in annual automotive logistics revenue."},
                    {"action": "Deploy value-based retention packages (not price-matching) for the 14 DHL-targeted accounts", "reasoning": "because price-matching DHL's 8-12% discounts would sacrifice UPS's $1.22/piece yield advantage — the foundation of the yield strategy.", "impact": "Retains 10-12 of the 14 targeted accounts through service differentiation, protecting approximately $28M in annual revenue without margin erosion."},
                    {"action": "Hold pricing discipline on Q3-Q4 renewals with selective strategic offers only", "reasoning": "because blanket discounting across 42% of enterprise revenue would unwind the yield gains that took 18 months to build.", "impact": "Maintains the $15.32 RPP baseline while allowing surgical offers for the 5-8 most strategically important renewals."},
                    {"action": "Establish weekly contract renewal pipeline reviews with the CCO office", "reasoning": "because 42% of enterprise revenue renewing in 6 months is the most concentrated window in 3 years — early warning prevents reactive decisions.", "impact": "Flags at-risk renewals 4-6 weeks before they become competitive situations, giving account teams time for proactive engagement."}
                ],
                "data_sources": [
                    {"name": "Strategy & Competitive Intelligence", "type": "Internal", "confidence": "High", "updated": "Weekly"},
                    {"name": "Enterprise Sales CRM", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                    {"name": "Trade Publication Monitoring", "type": "External", "confidence": "Medium", "updated": "Daily"},
                    {"name": "Pricing System Telemetry", "type": "Internal", "confidence": "High", "updated": "Real-time"}
                ],
                "confidence_description": "High confidence — competitive activity confirmed through sales CRM, trade publications, and pricing telemetry.",
                "context_questions": [
                    "Which of our top-10 automotive accounts has FedEx Auto Express already reached?",
                    "What's the total revenue at risk from DHL's 14-account win-back campaign?",
                    "Should we selectively price-match on the highest-risk renewals or hold discipline?",
                    "What's the NAAF Mexico launch readiness status — can we soft-launch before Aug 10?"
                ]
            }
        }
    ]
    for s in signals:
        db.add(Signal(cxo_id=cxo.id, **s))

    # ── Lever Definitions (30 levers across automotive + enterprise) ──

    levers = [
        # AUTOMOTIVE — Marketing (B6.1)
        {"lever_id": "abm_budget", "lever_group": "automotive", "category": "marketing",
         "name": "ABM Budget (Annual)", "description": "Total Automotive ABM marketing budget",
         "unit": "$M", "min_val": 2, "max_val": 25, "default_val": 8, "step": 0.5,
         "impact_coefficients": {"revenue": 0.6, "margin": 0.1, "win_rate": 0.3, "volume": 0.4, "cac": -0.5},
         "interaction_keys": ["tier_allocation", "channel_mix"]},

        {"lever_id": "tier_allocation", "lever_group": "automotive", "category": "marketing",
         "name": "Tier-1 Allocation %", "description": "Share of ABM budget allocated to Tier-1 (1-to-1) accounts",
         "unit": "%", "min_val": 20, "max_val": 70, "default_val": 40, "step": 5,
         "impact_coefficients": {"revenue": 0.8, "margin": 0.4, "win_rate": 0.6, "volume": 0.2},
         "interaction_keys": ["abm_budget"]},

        {"lever_id": "channel_mix", "lever_group": "automotive", "category": "marketing",
         "name": "Executive Briefing Mix %", "description": "Share of Tier-1 budget in executive briefings vs. digital",
         "unit": "%", "min_val": 10, "max_val": 60, "default_val": 25, "step": 5,
         "impact_coefficients": {"revenue": 0.5, "win_rate": 0.7, "cycle_time": -0.3},
         "interaction_keys": ["abm_budget"]},

        {"lever_id": "cadence_tier1", "lever_group": "automotive", "category": "marketing",
         "name": "Tier-1 Cadence", "description": "Marketing touches per quarter for Tier-1 accounts",
         "unit": "count", "min_val": 4, "max_val": 24, "default_val": 8, "step": 2,
         "impact_coefficients": {"win_rate": 0.4, "revenue": 0.3, "cycle_time": -0.2},
         "interaction_keys": []},

        # AUTOMOTIVE — Sales Capacity (B6.2)
        {"lever_id": "industry_experts", "lever_group": "automotive", "category": "sales",
         "name": "Automotive Sales Experts", "description": "Dedicated automotive industry sales experts ($50M investment)",
         "unit": "count", "min_val": 5, "max_val": 40, "default_val": 12, "step": 1,
         "impact_coefficients": {"revenue": 0.7, "win_rate": 0.5, "margin": 0.3, "cycle_time": -0.4},
         "interaction_keys": ["exec_sponsorship"]},

        {"lever_id": "exec_sponsorship", "lever_group": "automotive", "category": "sales",
         "name": "Executive Sponsorship", "description": "Number of Tier-1 accounts with UPS executive sponsor",
         "unit": "count", "min_val": 0, "max_val": 15, "default_val": 5, "step": 1,
         "impact_coefficients": {"win_rate": 0.8, "revenue": 0.4, "cycle_time": -0.5},
         "interaction_keys": ["industry_experts"]},

        # AUTOMOTIVE — Service/Product (B6.3)
        {"lever_id": "naaf_capacity", "lever_group": "automotive", "category": "service",
         "name": "NAAF Mexico Capacity", "description": "North American Air Freight lanes and day-options allocated to automotive",
         "unit": "%", "min_val": 10, "max_val": 80, "default_val": 30, "step": 5,
         "impact_coefficients": {"revenue": 0.9, "volume": 0.7, "margin": 0.5},
         "interaction_keys": ["customs_brokerage"]},

        {"lever_id": "ground_freight_pricing", "lever_group": "automotive", "category": "service",
         "name": "Ground Freight Pricing Eligibility", "description": "Expand >150lb threshold and segment eligibility",
         "unit": "%", "min_val": 0, "max_val": 100, "default_val": 40, "step": 10,
         "impact_coefficients": {"revenue": 0.5, "volume": 0.6, "margin": 0.2},
         "interaction_keys": []},

        {"lever_id": "healthcare_crosssell", "lever_group": "shared", "category": "service",
         "name": "Healthcare Cold-Chain Cross-Sell", "description": "Cross-sell healthcare cold-chain into automotive aftermarket",
         "unit": "%", "min_val": 0, "max_val": 50, "default_val": 10, "step": 5,
         "impact_coefficients": {"revenue": 0.4, "margin": 0.6, "volume": 0.2},
         "interaction_keys": ["service_mix_push"]},

        {"lever_id": "customs_brokerage", "lever_group": "automotive", "category": "service",
         "name": "Customs Brokerage Bundle", "description": "Bundled customs brokerage + SCS for cross-border automotive",
         "unit": "%", "min_val": 0, "max_val": 100, "default_val": 30, "step": 10,
         "impact_coefficients": {"revenue": 0.6, "margin": 0.3, "win_rate": 0.4},
         "interaction_keys": ["naaf_capacity"]},

        # AUTOMOTIVE — Pricing (B6.4)
        {"lever_id": "base_discount_band", "lever_group": "shared", "category": "pricing",
         "name": "Base Rate Discount Band", "description": "Strategic-account base rate discount ceiling",
         "unit": "%", "min_val": 5, "max_val": 35, "default_val": 15, "step": 1,
         "impact_coefficients": {"win_rate": 0.7, "margin": -0.8, "revenue": 0.5, "volume": 0.3},
         "interaction_keys": ["accessorial_caps", "contract_term"]},

        {"lever_id": "accessorial_caps", "lever_group": "shared", "category": "pricing",
         "name": "Accessorial Discount Cap", "description": "Maximum accessorial discount (DAS, residential, large-pkg, peak)",
         "unit": "%", "min_val": 0, "max_val": 25, "default_val": 10, "step": 1,
         "impact_coefficients": {"win_rate": 0.3, "margin": -0.6, "revenue": 0.2},
         "interaction_keys": ["base_discount_band"]},

        {"lever_id": "dim_divisor", "lever_group": "shared", "category": "pricing",
         "name": "DIM Divisor Concession", "description": "DIM divisor relaxation for low-density automotive freight",
         "unit": "count", "min_val": 139, "max_val": 200, "default_val": 166, "step": 1,
         "impact_coefficients": {"win_rate": 0.4, "margin": -0.3, "volume": 0.5},
         "interaction_keys": []},

        {"lever_id": "volume_commitment", "lever_group": "shared", "category": "pricing",
         "name": "Volume Commitment Requirement", "description": "Minimum volume commitment for discount eligibility",
         "unit": "%", "min_val": 50, "max_val": 100, "default_val": 75, "step": 5,
         "impact_coefficients": {"margin": 0.5, "volume": 0.6, "win_rate": -0.2},
         "interaction_keys": []},

        {"lever_id": "contract_term", "lever_group": "shared", "category": "pricing",
         "name": "Contract Term Incentive", "description": "Multi-year contract term incentives (discount pp for 2+yr)",
         "unit": "pp", "min_val": 0, "max_val": 5, "default_val": 1.5, "step": 0.5,
         "impact_coefficients": {"win_rate": 0.5, "margin": -0.4, "revenue": 0.6},
         "interaction_keys": ["base_discount_band"]},

        # AUTOMOTIVE — Network (B6.5) — read-only inputs
        {"lever_id": "lane_capacity", "lever_group": "automotive", "category": "network",
         "name": "Key Lane Capacity", "description": "Network capacity in Detroit↔Mexico, TN/AL corridor, TX hub, SC corridor",
         "unit": "%", "min_val": 60, "max_val": 100, "default_val": 78, "step": 2,
         "impact_coefficients": {"volume": 0.8, "revenue": 0.4, "margin": 0.2},
         "interaction_keys": []},

        # AUTOMOTIVE — Partnership (B6.6)
        {"lever_id": "tms_alliance", "lever_group": "automotive", "category": "partnership",
         "name": "TMS Strategic Alliance", "description": "Joint go-to-market with TMS provider for Tier-1 suppliers",
         "unit": "count", "min_val": 0, "max_val": 3, "default_val": 0, "step": 1,
         "impact_coefficients": {"win_rate": 0.6, "revenue": 0.5, "cycle_time": -0.3},
         "interaction_keys": []},

        # ENTERPRISE — Policy/Guardrails (C5.1)
        {"lever_id": "approval_threshold", "lever_group": "enterprise", "category": "policy",
         "name": "Discount Approval Threshold", "description": "Max discount % Managing Directors can sign without escalation",
         "unit": "%", "min_val": 5, "max_val": 25, "default_val": 12, "step": 1,
         "impact_coefficients": {"cycle_time": -0.5, "margin": 0.4, "win_rate": 0.2},
         "interaction_keys": ["deal_analyser_threshold"]},

        {"lever_id": "peak_surcharge_waiver", "lever_group": "enterprise", "category": "policy",
         "name": "Peak Surcharge Waiver Cap", "description": "Maximum allowable peak surcharge waiver",
         "unit": "%", "min_val": 0, "max_val": 100, "default_val": 30, "step": 5,
         "impact_coefficients": {"win_rate": 0.3, "margin": -0.7, "revenue": 0.2},
         "interaction_keys": []},

        # ENTERPRISE — Portfolio Allocation (C5.2)
        {"lever_id": "renewal_capacity", "lever_group": "enterprise", "category": "portfolio",
         "name": "Sales Capacity — Renewals", "description": "% of enterprise sales capacity on renewal workstream",
         "unit": "%", "min_val": 15, "max_val": 50, "default_val": 30, "step": 5,
         "impact_coefficients": {"revenue": 0.6, "margin": 0.5, "win_rate": 0.4},
         "interaction_keys": []},

        {"lever_id": "penetration_capacity", "lever_group": "enterprise", "category": "portfolio",
         "name": "Sales Capacity — Penetration", "description": "% of enterprise sales capacity on cross-sell/up-sell",
         "unit": "%", "min_val": 10, "max_val": 40, "default_val": 25, "step": 5,
         "impact_coefficients": {"revenue": 0.7, "margin": 0.3, "volume": 0.5, "win_rate": 0.3},
         "interaction_keys": []},

        # ENTERPRISE — Product Strategy (C5.3)
        {"lever_id": "service_mix_push", "lever_group": "enterprise", "category": "product_strategy",
         "name": "Service-Mix Push", "description": "Target NAAF + Healthcare + UPS Capital attach rate in Enterprise",
         "unit": "%", "min_val": 0, "max_val": 50, "default_val": 15, "step": 5,
         "impact_coefficients": {"revenue": 0.8, "margin": 0.6, "volume": 0.3},
         "interaction_keys": ["bundling_rules", "healthcare_crosssell"]},

        {"lever_id": "bundling_rules", "lever_group": "enterprise", "category": "product_strategy",
         "name": "Bundling Incentives", "description": "Multi-service bundle discount (multi-year + volume + 2+ services)",
         "unit": "pp", "min_val": 0, "max_val": 8, "default_val": 2, "step": 0.5,
         "impact_coefficients": {"win_rate": 0.5, "revenue": 0.6, "margin": -0.2},
         "interaction_keys": ["service_mix_push"]},

        # ENTERPRISE — Pricing Strategy (C5.4)
        {"lever_id": "renewal_uplift", "lever_group": "enterprise", "category": "pricing_strategy",
         "name": "Renewal Uplift Policy", "description": "Price increase % for renewals by tier and contract age",
         "unit": "%", "min_val": 0, "max_val": 12, "default_val": 4, "step": 0.5,
         "impact_coefficients": {"margin": 0.7, "revenue": 0.3, "win_rate": -0.4},
         "interaction_keys": ["competitive_response"]},

        {"lever_id": "competitive_response", "lever_group": "enterprise", "category": "pricing_strategy",
         "name": "Competitive Response Trigger", "description": "Auto-match competitor within X% on defined lanes",
         "unit": "%", "min_val": 0, "max_val": 10, "default_val": 3, "step": 0.5,
         "impact_coefficients": {"win_rate": 0.6, "margin": -0.5, "revenue": 0.4},
         "interaction_keys": ["renewal_uplift"]},

        # ENTERPRISE — Deal Management (C5.5)
        {"lever_id": "deal_analyser_threshold", "lever_group": "enterprise", "category": "deal_mgmt",
         "name": "Deal Analyser Mandatory Threshold", "description": "ACV threshold above which Deal Analyser is mandatory",
         "unit": "$M", "min_val": 0.1, "max_val": 5, "default_val": 1, "step": 0.1,
         "impact_coefficients": {"margin": 0.5, "win_rate": 0.3, "cycle_time": 0.2},
         "interaction_keys": ["analyst_headcount"]},

        {"lever_id": "override_permission", "lever_group": "enterprise", "category": "deal_mgmt",
         "name": "Override Permission Tier", "description": "Level required to override Deal Analyser recommendation",
         "unit": "count", "min_val": 1, "max_val": 5, "default_val": 3, "step": 1,
         "impact_coefficients": {"margin": 0.6, "win_rate": -0.1, "cycle_time": 0.3},
         "interaction_keys": []},

        # ENTERPRISE — Investment (C5.6)
        {"lever_id": "analyst_headcount", "lever_group": "enterprise", "category": "investment",
         "name": "Pricing Analyst Headcount", "description": "Number of pricing analysts in Revenue Management",
         "unit": "count", "min_val": 10, "max_val": 50, "default_val": 22, "step": 1,
         "impact_coefficients": {"margin": 0.5, "win_rate": 0.4, "cycle_time": -0.3, "cac": -0.2},
         "interaction_keys": ["deal_analyser_threshold"]},

        {"lever_id": "customer_success_invest", "lever_group": "enterprise", "category": "investment",
         "name": "Customer Success Investment", "description": "Retention-focused customer success team investment",
         "unit": "$M", "min_val": 0.5, "max_val": 8, "default_val": 2.5, "step": 0.5,
         "impact_coefficients": {"win_rate": 0.3, "revenue": 0.4, "margin": 0.2, "volume": 0.2},
         "interaction_keys": []},

        # SHARED — Digital/Activation
        {"lever_id": "digital_reactivation", "lever_group": "shared", "category": "marketing",
         "name": "Digital Reactivation Campaign", "description": "Reactivation campaign targeting dormant digital-acquired accounts",
         "unit": "%", "min_val": 0, "max_val": 100, "default_val": 40, "step": 10,
         "impact_coefficients": {"revenue": 0.5, "volume": 0.6, "cac": -0.4},
         "interaction_keys": ["onboarding_fix"]},

        {"lever_id": "onboarding_fix", "lever_group": "shared", "category": "marketing",
         "name": "Onboarding Friction Fix", "description": "Fix onboarding completion gaps for new SMB cohorts",
         "unit": "%", "min_val": 0, "max_val": 100, "default_val": 50, "step": 10,
         "impact_coefficients": {"revenue": 0.6, "volume": 0.5, "win_rate": 0.3, "cac": -0.3},
         "interaction_keys": ["digital_reactivation"]},
    ]

    for lev in levers:
        db.add(LeverDefinition(**lev))
    db.commit()

    # ── Preset Scenarios ──
    presets = [
        {
            "name": "Conservative Recovery",
            "description": "Low-risk levers only — digital reactivation, lifecycle pricing, minimal budget increase",
            "is_preset": True, "budget": 5.5, "time_horizon": "Q",
            "levers_config": [
                {"lever_id": "digital_reactivation", "value": 60},
                {"lever_id": "onboarding_fix", "value": 65},
                {"lever_id": "base_discount_band", "value": 17},
                {"lever_id": "contract_term", "value": 2.0},
            ],
            "gap_closure_pct": 34,
        },
        {
            "name": "Recommended Scenario",
            "description": "Balanced portfolio — activation sprint + digital + regional pricing + capacity shift",
            "is_preset": True, "budget": 7.2, "time_horizon": "Q",
            "levers_config": [
                {"lever_id": "abm_budget", "value": 14},
                {"lever_id": "tier_allocation", "value": 55},
                {"lever_id": "industry_experts", "value": 20},
                {"lever_id": "naaf_capacity", "value": 50},
                {"lever_id": "digital_reactivation", "value": 80},
                {"lever_id": "onboarding_fix", "value": 75},
                {"lever_id": "service_mix_push", "value": 30},
                {"lever_id": "renewal_capacity", "value": 35},
            ],
            "gap_closure_pct": 62,
        },
        {
            "name": "Aggressive Recovery",
            "description": "Full lever pull — discount ladder, capacity reallocation, NAAF push, executive sponsorship",
            "is_preset": True, "budget": 11, "time_horizon": "Q",
            "levers_config": [
                {"lever_id": "abm_budget", "value": 20},
                {"lever_id": "tier_allocation", "value": 60},
                {"lever_id": "channel_mix", "value": 45},
                {"lever_id": "industry_experts", "value": 30},
                {"lever_id": "exec_sponsorship", "value": 12},
                {"lever_id": "naaf_capacity", "value": 65},
                {"lever_id": "base_discount_band", "value": 22},
                {"lever_id": "accessorial_caps", "value": 18},
                {"lever_id": "digital_reactivation", "value": 90},
                {"lever_id": "onboarding_fix", "value": 90},
                {"lever_id": "service_mix_push", "value": 40},
                {"lever_id": "bundling_rules", "value": 5},
                {"lever_id": "renewal_capacity", "value": 40},
                {"lever_id": "analyst_headcount", "value": 35},
            ],
            "gap_closure_pct": 27,
        },
    ]

    for p in presets:
        db.add(Scenario(cxo_id=cxo.id, **p))

    # ── Automotive KPIs ──
    auto_kpis = [
        {"label": "Automotive Revenue, YTD", "value": "$1.84B", "delta": "+8.2%", "delta_label": "vs plan", "status": "ok", "sub": "Run-rate to FY26: $7.6B (target $8.1B)"},
        {"label": "Automotive ADV growth", "value": "+4.1%", "delta": "+2.5pp", "delta_label": "vs prior Q", "status": "ok", "sub": "Driven by Tier-1 supplier wins (Magna, Lear)"},
        {"label": "Automotive Op. Margin", "value": "9.2%", "delta": "+140 bps", "delta_label": "vs PY", "status": "ok", "sub": "Above US Domestic 7.5-8.5% guide"},
        {"label": "Pipeline Coverage (wgt.)", "value": "2.8x", "delta": "-0.4x", "delta_label": "vs target 3.5x", "status": "warn", "sub": "Tier-1 OEM coverage is the gap"},
    ]
    for k in auto_kpis:
        db.add(AutoKPI(**k))

    # ── Automotive Sub-segments ──
    auto_subs = [
        {"name": "OEM (Detroit-3 + Japanese/Korean)", "rev": 612, "adv": "+1.2%", "rpp": 18.4, "margin": 11.8, "sow": 22, "status": "ok"},
        {"name": "Tier-1 Suppliers", "rev": 487, "adv": "+6.8%", "rpp": 16.9, "margin": 10.2, "sow": 28, "status": "ok"},
        {"name": "Tier-2/3 Suppliers", "rev": 268, "adv": "+3.1%", "rpp": 14.2, "margin": 8.6, "sow": 31, "status": "ok"},
        {"name": "Aftermarket Distributors", "rev": 314, "adv": "-1.4%", "rpp": 12.8, "margin": 7.4, "sow": 18, "status": "warn"},
        {"name": "Dealer Parts Network", "rev": 96, "adv": "+0.6%", "rpp": 11.2, "margin": 6.8, "sow": 14, "status": "warn"},
        {"name": "EV Pure-Play", "rev": 62, "adv": "+18.3%", "rpp": 19.6, "margin": 12.6, "sow": 9, "status": "ok"},
    ]
    for s in auto_subs:
        db.add(AutoSubsegment(**s))

    # ── Top Automotive Accounts ──
    auto_accounts = [
        {"name": "General Motors", "tier": "T1", "subv": "OEM", "spend": 142, "sow": 24, "headroom": 78, "opps": 4, "health": "G", "milestone": "Q3 NAAF Mexico expansion review", "abm": "1-to-1"},
        {"name": "Ford Motor Company", "tier": "T1", "subv": "OEM", "spend": 118, "sow": 21, "headroom": 92, "opps": 3, "health": "G", "milestone": "Battery logistics RFP — Aug 12", "abm": "1-to-1"},
        {"name": "Stellantis North America", "tier": "T1", "subv": "OEM", "spend": 86, "sow": 16, "headroom": 124, "opps": 5, "health": "A", "milestone": "Sourcing review window open", "abm": "1-to-1"},
        {"name": "Toyota Motor North America", "tier": "T1", "subv": "OEM", "spend": 104, "sow": 19, "headroom": 81, "opps": 2, "health": "G", "milestone": "Renewal due Aug 31, 2026", "abm": "1-to-1"},
        {"name": "Magna International", "tier": "T1", "subv": "Tier-1", "spend": 76, "sow": 31, "headroom": 42, "opps": 3, "health": "G", "milestone": "Mexico T-2 acquisition — +$28M opp", "abm": "1-to-1"},
        {"name": "Lear Corporation", "tier": "T1", "subv": "Tier-1", "spend": 58, "sow": 26, "headroom": 38, "opps": 2, "health": "A", "milestone": "Save-play active — competitor pressure", "abm": "1-to-1"},
        {"name": "Aptiv PLC", "tier": "T1", "subv": "Tier-1", "spend": 51, "sow": 24, "headroom": 34, "opps": 4, "health": "G", "milestone": "Penetration: UPS Capital trade-finance", "abm": "1-to-1"},
        {"name": "BorgWarner", "tier": "T1", "subv": "Tier-1", "spend": 38, "sow": 22, "headroom": 26, "opps": 2, "health": "G", "milestone": "EV transition penetration play", "abm": "1-to-few"},
        {"name": "Tesla, Inc.", "tier": "T1", "subv": "EV", "spend": 22, "sow": 11, "headroom": 68, "opps": 3, "health": "A", "milestone": "Austin parts hub rebalance — $4M opp", "abm": "1-to-1"},
        {"name": "Rivian Automotive", "tier": "T1", "subv": "EV", "spend": 14, "sow": 18, "headroom": 32, "opps": 2, "health": "G", "milestone": "Normal — Atlanta tradeshow follow-up", "abm": "1-to-few"},
        {"name": "AutoZone", "tier": "T2", "subv": "Aftermarket", "spend": 41, "sow": 17, "headroom": 48, "opps": 1, "health": "A", "milestone": "Renewal at risk — FedEx counter offer", "abm": "1-to-few"},
        {"name": "O'Reilly Automotive", "tier": "T2", "subv": "Aftermarket", "spend": 36, "sow": 19, "headroom": 38, "opps": 2, "health": "G", "milestone": "Happy Returns cross-sell", "abm": "1-to-few"},
    ]
    for a in auto_accounts:
        db.add(AutoAccount(**a))

    # ── Automotive Market Signals (with full enrichment for detail view) ──
    auto_signals = [
        {"time": "06:42 ET", "type": "RFP", "title": "Stellantis opens $312M parts logistics review for Detroit-Toluca lane", "source": "Automotive Logistics", "impact": "high", "conf": 0.86, "accounts": ["Stellantis North America"], "why": "Stellantis sourcing window opens Jul 1. UPS has 16% SOW. Direct fit for NAAF 1-/2-/3-day Mexico service launching August.", "action": "Trigger 1-to-1 ABM executive briefing within 48h; insert NAAF capacity guarantee into Deal Analyser scenario.",
         "signal_enrichment": {
             "why_it_matters": "Stellantis is the second-largest Detroit-3 OEM by cross-border parts volume on the Detroit–Toluca corridor. Their $312M logistics review covers inbound JIT parts, finished-vehicle accessories, and aftermarket distribution — all lanes where UPS NAAF 1-/2-/3-day Mexico service (launching August 10) is a direct fit. UPS currently holds only 16% share-of-wallet vs 31% at Magna, meaning significant headroom. Stellantis's 2025 procurement reorg moved logistics decisions into central Procurement, weakening UPS's prior commercial relationships — this RFP is the reset window. FedEx's Auto Express launches August 4, six days ahead of NAAF, making speed-to-engagement critical.",
             "metrics": [
                 {"value": "$312M", "label": "Logistics review scope", "negative": False, "positive": True},
                 {"value": "16%", "label": "Current UPS SOW at Stellantis", "negative": True, "positive": False},
                 {"value": "$124M", "label": "Addressable headroom", "negative": False, "positive": True}
             ],
             "key_insight": "Stellantis's central Procurement reorg in late 2025 reset carrier relationships — the old UPS commercial contacts no longer own the decision. This RFP is the first open carrier review since the reorg. UPS's NAAF Mexico service launching August 10 is a direct capability match for the Detroit-Toluca corridor, but FedEx Auto Express launches August 4. The 6-day gap means UPS must pre-position with an executive briefing and NAAF capacity guarantee before the RFP evaluation begins July 1. The proven Magna playbook (industry-event ABM + CCO briefings + multi-service bundle) lifted SOW from 24% to 31% and is directly transferable here.",
             "recent_activity": [
                 {"action": "Stellantis posted formal RFP for Detroit-Toluca parts logistics — $312M scope, Jul 1 open", "actor": "Automotive Logistics (trade pub)", "time": "06:42 ET today"},
                 {"action": "UPS account team confirmed Stellantis procurement reorg moved decision authority to central Procurement VP", "actor": "Enterprise Sales — Auto", "time": "Yesterday"},
                 {"action": "FedEx Auto Express pre-launch materials spotted targeting Stellantis Toluca plant managers", "actor": "Competitive Intelligence", "time": "2 days ago"},
                 {"action": "NAAF Mexico capacity allocation for Detroit-Toluca corridor confirmed at 85% readiness", "actor": "Network Planning", "time": "3 days ago"}
             ],
             "related_topics": ["NAAF Mexico Launch", "Detroit-Toluca Corridor", "Stellantis Procurement Reorg", "FedEx Auto Express", "Cross-Border JIT Logistics", "Magna Playbook"],
             "recommended_takeaways": [
                 {"action": "Schedule CCO-level executive briefing with Stellantis central Procurement VP within 48 hours", "reasoning": "because the old UPS commercial contacts no longer own the decision after the procurement reorg — executive access must be re-established before the Jul 1 RFP opens.", "impact": "Establishes UPS as a strategic partner (not just an incumbent) with the new decision-maker, positioning ahead of FedEx's Aug 4 Auto Express launch."},
                 {"action": "Insert NAAF capacity guarantee into the Stellantis Deal Analyser scenario", "reasoning": "because guaranteed 1-/2-/3-day Mexico service capacity is a differentiator FedEx cannot match until Auto Express ramps — and Stellantis needs certainty for JIT parts.", "impact": "Converts the NAAF launch from a product announcement into a contract-ready commitment, directly addressing Stellantis's corridor reliability requirements."},
                 {"action": "Deploy the Magna cross-border bundle template (NAAF + Brokerage + UPS Capital trade finance)", "reasoning": "because the Magna playbook delivered +$21M actual vs +$18M modeled and lifted SOW 24% → 31% — the most relevant analog for Stellantis.", "impact": "Multi-service bundle increases deal value 40-60% vs parcel-only proposals and raises switching costs for Stellantis."},
                 {"action": "Brief the pricing committee on Stellantis corridor economics before Jul 1", "reasoning": "because the 10% temporary import surcharge (extended to Sep 30) compresses lane economics — pricing models need to reflect tariff-adjusted margins.", "impact": "Prevents margin erosion on a $312M deal by building tariff impact into the pricing model upfront."}
             ],
             "confidence_description": "High confidence — RFP confirmed via trade publication, procurement reorg verified by account team, NAAF readiness confirmed by network planning.",
             "data_sources": [
                 {"name": "Automotive Logistics", "type": "External", "confidence": "High", "updated": "Today"},
                 {"name": "Enterprise Sales — Automotive", "type": "Internal", "confidence": "High", "updated": "Yesterday"},
                 {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "2 days ago"},
                 {"name": "Network Planning — NAAF", "type": "Internal", "confidence": "High", "updated": "3 days ago"}
             ],
             "context_questions": [
                 "Who is the new Stellantis Procurement VP and what's their carrier evaluation criteria?",
                 "Can we soft-launch NAAF Mexico for Stellantis before the Aug 10 official date?",
                 "What did the Magna playbook cost and what's the projected ROI for Stellantis?",
                 "How does the 10% tariff surcharge affect Detroit-Toluca lane pricing?"
             ]
         }},
        {"time": "05:55 ET", "type": "Production", "title": "Toyota Georgetown KY adds 12% Q3 production cadence on Camry/RAV4", "source": "Wards Auto", "impact": "med", "conf": 0.91, "accounts": ["Toyota Motor North America"], "why": "Inbound JIT volume from Tier-1 suppliers will lift through Aug-Oct. Toyota renewal is Aug 31.", "action": "Notify Toyota account director; pre-empt renewal conversation with capacity commitment.",
         "signal_enrichment": {
             "why_it_matters": "Toyota Georgetown is the largest Toyota plant in North America — 550,000 units/year capacity producing Camry, RAV4, and Lexus ES. A 12% production cadence increase means approximately 16,500 additional vehicles in Q3, each requiring 200-300 inbound JIT parts shipments from Tier-1 suppliers across the Midwest and Southeast. UPS handles Toyota's dedicated logistics for the Georgetown-to-dealer corridor ($104M annual spend, 19% SOW). The contract renewal is August 31 — this production surge creates natural leverage for a capacity-commitment-based renewal conversation. Toyota's on-time delivery requirement is 99.2%, and the production increase will stress current lane capacity.",
             "metrics": [
                 {"value": "+12%", "label": "Q3 production cadence increase", "negative": False, "positive": True},
                 {"value": "Aug 31", "label": "Contract renewal deadline", "negative": False, "positive": False},
                 {"value": "$104M", "label": "Toyota annual UPS spend", "negative": False, "positive": True}
             ],
             "key_insight": "The production increase at Georgetown KY creates a natural entry point for the August 31 renewal conversation. Toyota will need guaranteed lane capacity for 12% more inbound JIT volume from Tier-1 suppliers (BorgWarner, Denso, Aisin) through Aug-Oct. UPS can pre-empt the renewal by offering a capacity commitment that locks in the surge volume — turning a routine renewal into a SOW expansion opportunity. Current SOW is 19% with $81M addressable headroom.",
             "recent_activity": [
                 {"action": "Toyota Georgetown plant announced 12% Q3 production increase for Camry/RAV4 lines", "actor": "Wards Auto (trade pub)", "time": "05:55 ET today"},
                 {"action": "Toyota account director confirmed renewal timeline — formal review begins mid-July, decision by Aug 31", "actor": "Enterprise Sales — Auto", "time": "Yesterday"},
                 {"action": "BorgWarner and Denso (Toyota Tier-1 suppliers) both increased Q3 shipping forecasts by 8-15%", "actor": "Supply Chain Intelligence", "time": "3 days ago"},
                 {"action": "UPS Georgetown hub capacity assessment shows 91% utilization — 9% buffer for surge", "actor": "Network Operations", "time": "1 week ago"}
             ],
             "related_topics": ["Toyota Contract Renewal", "Georgetown KY Plant", "JIT Parts Logistics", "Tier-1 Supplier Volume", "Capacity Planning", "Camry/RAV4 Production"],
             "recommended_takeaways": [
                 {"action": "Brief Toyota account director on production surge and pre-empt renewal with capacity commitment offer", "reasoning": "because the 12% production increase creates a natural need for guaranteed lane capacity — framing the renewal around capacity locks in volume before competitors can bid.", "impact": "Converts a routine renewal into a capacity-based SOW expansion, protecting $104M annual spend and targeting $15-20M incremental from surge volume."},
                 {"action": "Model Georgetown hub capacity at +12% volume to ensure 99.2% OTD commitment holds", "reasoning": "because Toyota's on-time requirement is 99.2% and the hub is at 91% utilization — the 9% buffer may not cover a sustained 12% surge.", "impact": "Identifies capacity constraints before they become service failures, preserving the renewal position."},
                 {"action": "Coordinate with BorgWarner and Denso account teams on Tier-1 inbound volume alignment", "reasoning": "because Tier-1 suppliers are independently increasing shipment forecasts 8-15% — coordinated capacity planning prevents fragmented commitments.", "impact": "Unified inbound capacity plan across Toyota + 3 Tier-1 suppliers, demonstrating network-level value that single-lane competitors cannot match."}
             ],
             "confidence_description": "High confidence — production increase confirmed via Wards Auto, renewal timeline verified by account team.",
             "data_sources": [
                 {"name": "Wards Auto", "type": "External", "confidence": "High", "updated": "Today"},
                 {"name": "Enterprise Sales — Automotive", "type": "Internal", "confidence": "High", "updated": "Yesterday"},
                 {"name": "Network Operations", "type": "Internal", "confidence": "High", "updated": "1 week ago"}
             ],
             "context_questions": [
                 "What's the Georgetown hub capacity if Toyota sustains +12% through Q4?",
                 "Which Tier-1 suppliers ship the most volume into Georgetown?",
                 "What's FedEx's current position on the Toyota renewal?",
                 "Can we offer a multi-year capacity guarantee to lock in the renewal?"
             ]
         }},
        {"time": "21:18 ET (Jun 7)", "type": "Competitor", "title": "FedEx unveils Auto Express — direct competitor to UPS NAAF Mexico", "source": "FreightWaves", "impact": "high", "conf": 0.78, "accounts": ["General Motors", "Ford Motor Company", "Stellantis North America", "Magna International"], "why": "FedEx launches Aug 4 — six business days ahead of UPS NAAF. Pricing posture undisclosed; 2-day Mexico service.", "action": "Convene NAAF go-to-market war-room; tighten pricing posture in pre-launch Deal Analyser models.",
         "signal_enrichment": {
             "why_it_matters": "FedEx Auto Express is a direct competitive response to UPS's NAAF Mexico service, launching August 4 — six business days before UPS's August 10 go-live. FedEx is offering 2-day Mexico service on the Detroit-Toluca and Detroit-Monterrey corridors, exactly matching UPS NAAF's core value proposition. Pre-launch marketing materials have already reached 3 of UPS's top-10 automotive accounts (GM, Ford, Stellantis). FedEx's Q3 FY26 US domestic revenue surged 10%, giving them budget to price aggressively. The timing is designed to capture first-mover positioning on cross-border automotive — if UPS doesn't counter, Auto Express could lock up corridor capacity commitments before NAAF even launches.",
             "metrics": [
                 {"value": "6 days", "label": "FedEx launch lead vs UPS NAAF", "negative": True, "positive": False},
                 {"value": "3", "label": "UPS top-10 accounts already contacted", "negative": True, "positive": False},
                 {"value": "+10%", "label": "FedEx US domestic revenue surge Q3", "negative": True, "positive": False}
             ],
             "key_insight": "FedEx's Auto Express launch timing is strategic, not coincidental — they're specifically targeting the 6-day window before UPS NAAF goes live to lock up corridor capacity commitments. Pre-launch marketing has already reached GM, Ford, and Stellantis plant managers. However, FedEx Auto Express offers 2-day service only, while UPS NAAF provides 1-/2-/3-day tiered options plus customs brokerage integration. UPS's integrated network (Worldport Louisville + Laredo gateway) enables same-day customs clearance that FedEx's hub-spoke model cannot replicate. The counter-strategy is to emphasize reliability and multi-service integration, not price-match.",
             "recent_activity": [
                 {"action": "FreightWaves broke FedEx Auto Express announcement — 2-day Mexico service, Aug 4 launch", "actor": "FreightWaves", "time": "21:18 ET Jun 7"},
                 {"action": "FedEx pre-launch deck spotted at GM and Ford logistics planning offices", "actor": "Competitive Intelligence", "time": "Jun 8"},
                 {"action": "FedEx Freight spin-off (Jun 1) refocuses Express division on small-parcel — Auto Express is first vertical play", "actor": "Strategy & CI", "time": "Jun 3"},
                 {"action": "UPS NAAF Mexico capacity allocation at 85% readiness — on track for Aug 10", "actor": "Network Planning", "time": "Jun 5"}
             ],
             "related_topics": ["FedEx Auto Express", "NAAF Mexico Launch", "Competitive Positioning", "Cross-Border Automotive", "Detroit-Toluca Corridor", "FedEx Freight Spin-Off"],
             "recommended_takeaways": [
                 {"action": "Convene NAAF go-to-market war-room with sales, pricing, and network planning within 72 hours", "reasoning": "because FedEx is 6 days ahead and has already contacted 3 top-10 accounts — every day without a coordinated counter-response risks losing first-mover positioning.", "impact": "Aligns the entire go-to-market team on counter-positioning before FedEx locks up capacity commitments at GM, Ford, and Stellantis."},
                 {"action": "Consider soft-launching NAAF for key accounts before the Aug 10 official date", "reasoning": "because a soft launch to GM, Ford, and Stellantis neutralizes FedEx's 6-day timing advantage and demonstrates UPS's 1-/2-/3-day tiered capability vs FedEx's 2-day only.", "impact": "Eliminates FedEx's first-mover advantage at the 3 most strategically important automotive accounts."},
                 {"action": "Lead with integrated customs brokerage and 1-day express tier in all counter-proposals", "reasoning": "because FedEx Auto Express offers 2-day only without integrated customs — UPS's same-day customs clearance via the Laredo gateway is a hard differentiator.", "impact": "Shifts the competitive conversation from price and timing to capability differentiation that FedEx cannot match in 2026."},
                 {"action": "Tighten NAAF pricing models in Deal Analyser to reflect competitive pressure", "reasoning": "because FedEx's undisclosed pricing posture likely includes launch discounts — UPS needs scenario-ready pricing for the war-room.", "impact": "Pricing committee enters the war-room with pre-built scenarios, enabling fast decisions on selective pricing adjustments."}
             ],
             "confidence_description": "Moderate confidence — announcement confirmed via FreightWaves, but FedEx pricing and exact service scope details are still undisclosed.",
             "data_sources": [
                 {"name": "FreightWaves", "type": "External", "confidence": "High", "updated": "Jun 7"},
                 {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "Jun 8"},
                 {"name": "Strategy & CI", "type": "Internal", "confidence": "High", "updated": "Jun 3"},
                 {"name": "Network Planning", "type": "Internal", "confidence": "High", "updated": "Jun 5"}
             ],
             "context_questions": [
                 "What's FedEx Auto Express pricing — can we get intelligence from the GM/Ford pre-launch decks?",
                 "Can UPS soft-launch NAAF for top 3 accounts before Aug 10?",
                 "How does our 1-day express tier compare to FedEx's 2-day only offering?",
                 "What's the Laredo gateway customs clearance advantage in hours vs FedEx?"
             ]
         }},
        {"time": "19:04 ET (Jun 7)", "type": "M&A", "title": "Magna acquires Mexico Tier-2 (Queretaro) — adds ~$80M logistics spend", "source": "Reuters", "impact": "high", "conf": 0.94, "accounts": ["Magna International"], "why": "Magna logistics footprint expands meaningfully on USMCA cross-border. Estimated $28M incremental UPS opportunity.", "action": "Re-tier Magna scenario; bring UPS Capital + customs brokerage into the proposal.",
         "signal_enrichment": {
             "why_it_matters": "Magna International — UPS's largest Tier-1 automotive account ($76M annual spend, 31% SOW) — just acquired a Queretaro-based Tier-2 supplier with approximately $80M in annual logistics spend. This acquisition expands Magna's USMCA cross-border footprint significantly, creating an estimated $28M incremental opportunity for UPS. The Queretaro facility produces precision-machined components for GM and Ford, meaning the logistics network must integrate with existing Magna flows through the Detroit-Monterrey-Queretaro corridor. UPS's prior success with Magna (SOW lifted 24% → 31% via the cross-border bundle playbook) positions us to capture the acquisition logistics integration before competitors can approach the newly acquired entity separately.",
             "metrics": [
                 {"value": "$80M", "label": "Acquired entity logistics spend", "negative": False, "positive": True},
                 {"value": "$28M", "label": "Estimated UPS incremental opportunity", "negative": False, "positive": True},
                 {"value": "31%", "label": "Current UPS SOW at Magna", "negative": False, "positive": True}
             ],
             "key_insight": "Magna's Queretaro acquisition is a logistics integration event, not just a financial one — the acquired facility's supply chains must be merged into Magna's existing cross-border network within 90-120 days. UPS already handles 31% of Magna's logistics (highest SOW among UPS automotive accounts). By offering UPS Capital trade finance for the acquisition transition plus customs brokerage for the new Queretaro-to-Detroit flows, UPS can capture the integration logistics before the acquired entity's existing carriers (likely regional Mexican providers) are formally reviewed.",
             "recent_activity": [
                 {"action": "Reuters reported Magna's acquisition of Queretaro Tier-2 supplier — $80M logistics footprint", "actor": "Reuters", "time": "19:04 ET Jun 7"},
                 {"action": "Magna account team confirmed acquisition closes in 30 days — logistics integration begins Q3", "actor": "Enterprise Sales — Auto", "time": "Today"},
                 {"action": "UPS Capital pre-qualified for Magna acquisition trade finance ($12M facility)", "actor": "UPS Capital", "time": "Last week"},
                 {"action": "Customs brokerage team mapped Queretaro-to-Detroit corridor — 3 lane options identified", "actor": "Customs & Brokerage", "time": "2 days ago"}
             ],
             "related_topics": ["Magna International", "USMCA Cross-Border", "Queretaro Corridor", "UPS Capital Trade Finance", "Customs Brokerage", "Tier-2 Integration"],
             "recommended_takeaways": [
                 {"action": "Re-tier the Magna scenario in Deal Analyser to reflect the $28M incremental opportunity", "reasoning": "because the acquisition changes Magna's logistics profile — the existing scenario underestimates total addressable spend by 37%.", "impact": "Updated scenario enables the account team to propose a comprehensive integration package rather than piecemeal corridor additions."},
                 {"action": "Bundle UPS Capital trade finance + customs brokerage into the Magna proposal", "reasoning": "because acquisition transitions create financing and compliance complexity that competitors rarely address — this is where the Magna playbook showed +$21M actual lift.", "impact": "Multi-service bundle raises deal value 40-60% and creates switching costs that single-service competitors cannot match."},
                 {"action": "Engage Magna Procurement within 2 weeks — before the acquired entity's carriers are formally reviewed", "reasoning": "because the 90-120 day integration window is the only period where carrier selection for the new facility is genuinely open.", "impact": "First-mover advantage in the integration window — after carriers are selected, the next review cycle is 18-24 months away."}
             ],
             "confidence_description": "Very high confidence — acquisition confirmed via Reuters, account team verified, UPS Capital pre-qualified.",
             "data_sources": [
                 {"name": "Reuters", "type": "External", "confidence": "High", "updated": "Jun 7"},
                 {"name": "Enterprise Sales — Automotive", "type": "Internal", "confidence": "High", "updated": "Today"},
                 {"name": "UPS Capital", "type": "Internal", "confidence": "High", "updated": "Last week"},
                 {"name": "Customs & Brokerage", "type": "Internal", "confidence": "High", "updated": "2 days ago"}
             ],
             "context_questions": [
                 "What carriers does the acquired Queretaro facility currently use?",
                 "How quickly can UPS Capital deploy the $12M trade finance facility?",
                 "What's the Queretaro-to-Detroit transit time via UPS vs regional carriers?",
                 "Can we replicate the Magna cross-border bundle for other Tier-1 acquisitions?"
             ]
         }},
        {"time": "16:31 ET (Jun 7)", "type": "Tariff", "title": "10% temporary import surcharge confirmed extended to Sep 30, 2026", "source": "USTR / Politico", "impact": "high", "conf": 0.99, "accounts": ["General Motors", "Ford Motor Company", "Stellantis North America", "Toyota Motor North America", "Tesla, Inc."], "why": "OEMs rebalancing inventory — short-term lift in expedited cross-border. Lane economics compress on Detroit-MX corridor.", "action": "Pin as scenario constraint; raise NAAF capacity guarantee posture.",
         "signal_enrichment": {
             "why_it_matters": "The 10% temporary import surcharge extension to September 30, 2026 fundamentally changes cross-border automotive logistics economics for the next 4 months. All five major OEMs (GM, Ford, Stellantis, Toyota, Tesla) are rebalancing inventory strategies — some pulling forward shipments to beat potential further increases, others shifting to just-in-time to minimize duty exposure. This creates a short-term surge in expedited cross-border volume (good for UPS) but compresses lane margins on the Detroit-Mexico corridor by 2-4 percentage points. The tariff is also the backdrop for every pricing conversation on NAAF Mexico — it must be built into Deal Analyser scenarios as a constraint.",
             "metrics": [
                 {"value": "10%", "label": "Import surcharge rate", "negative": True, "positive": False},
                 {"value": "Sep 30", "label": "Extension deadline", "negative": False, "positive": False},
                 {"value": "5 OEMs", "label": "Affected major accounts", "negative": True, "positive": False}
             ],
             "key_insight": "The tariff extension creates a dual dynamic: short-term volume lift (OEMs accelerating shipments) but medium-term margin pressure (2-4pp compression on Detroit-MX lanes). UPS's advantage is network density — 5 daily cross-border flights on the Detroit-Laredo corridor vs FedEx's 3. OEMs shifting to expedited JIT to minimize duty-exposed inventory need guaranteed transit times that only dense networks can deliver. This is a NAAF positioning opportunity disguised as a margin headwind.",
             "recent_activity": [
                 {"action": "USTR confirmed 10% temporary import surcharge extended through Sep 30, 2026", "actor": "USTR / Politico", "time": "16:31 ET Jun 7"},
                 {"action": "GM and Ford logistics teams requesting expedited cross-border capacity quotes for Q3", "actor": "Enterprise Sales", "time": "Today"},
                 {"action": "Revenue Management modeling 2-4pp margin compression on Detroit-MX corridor", "actor": "Revenue Management", "time": "Yesterday"},
                 {"action": "Customs brokerage team processing 18% more entries QoQ on USMCA automotive lanes", "actor": "Customs & Brokerage", "time": "This week"}
             ],
             "related_topics": ["USMCA Tariffs", "Cross-Border Economics", "Detroit-Mexico Corridor", "OEM Inventory Strategy", "NAAF Pricing", "Customs Brokerage Volume"],
             "recommended_takeaways": [
                 {"action": "Pin the 10% surcharge as a scenario constraint in all NAAF Deal Analyser models", "reasoning": "because every automotive pricing conversation through Sep 30 must reflect tariff-adjusted lane economics — proposals without tariff modeling will lose credibility.", "impact": "All NAAF proposals reflect real-world economics, preventing margin surprises and building trust with OEM procurement teams."},
                 {"action": "Position NAAF's guaranteed transit times as a tariff mitigation tool for OEM JIT strategies", "reasoning": "because OEMs shifting to JIT to minimize duty-exposed inventory need the transit-time certainty that UPS's 5-daily-flight corridor density provides.", "impact": "Reframes the tariff headwind into a UPS positioning advantage — guaranteed JIT transit times become a duty-cost optimization tool for OEMs."},
                 {"action": "Review Detroit-MX corridor pricing to protect margins while remaining competitive", "reasoning": "because 2-4pp margin compression needs to be managed proactively — blanket absorption erodes the corridor economics, but over-pricing loses volume to FedEx.", "impact": "Surgical pricing adjustments that protect corridor margins while maintaining competitive positioning on the 5 highest-volume OEM lanes."}
             ],
             "confidence_description": "Very high confidence — USTR official announcement, confirmed by multiple news sources.",
             "data_sources": [
                 {"name": "USTR", "type": "External", "confidence": "Very High", "updated": "Jun 7"},
                 {"name": "Politico", "type": "External", "confidence": "High", "updated": "Jun 7"},
                 {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Yesterday"},
                 {"name": "Customs & Brokerage", "type": "Internal", "confidence": "High", "updated": "This week"}
             ],
             "context_questions": [
                 "How much does the 10% surcharge compress margins on our top 5 Detroit-MX lanes?",
                 "Which OEMs are shifting to expedited JIT vs pulling forward inventory?",
                 "Should we build a tariff surcharge into NAAF pricing or absorb it?",
                 "What happens if the surcharge is extended beyond Sep 30 or increased?"
             ]
         }},
        {"time": "14:08 ET (Jun 7)", "type": "Exec Move", "title": "Aptiv appoints new VP Global Logistics — Sarah Reyes (ex-Penske)", "source": "LinkedIn / Automotive News", "impact": "med", "conf": 0.96, "accounts": ["Aptiv PLC"], "why": "Reyes led a parcel consolidation at Penske; likely to revisit Aptiv carrier mix in next 90 days.", "action": "Schedule Matt + VP Marketing intro call; deploy Aptiv executive briefing pack.",
         "signal_enrichment": {
             "why_it_matters": "Aptiv PLC ($51M annual UPS spend, 24% SOW, $34M headroom) just appointed Sarah Reyes as VP Global Logistics. Reyes's track record at Penske is significant — she led a full parcel carrier consolidation that reduced Penske's carrier panel from 7 to 3, cut logistics costs 11%, and consolidated 65% of volume with a single primary carrier. If she runs the same playbook at Aptiv, there will be a carrier review within 90 days. UPS is currently one of 4 carriers at Aptiv — consolidation could go either way. Early executive engagement positions UPS as the consolidation winner rather than a reduction casualty.",
             "metrics": [
                 {"value": "$51M", "label": "Aptiv annual UPS spend", "negative": False, "positive": True},
                 {"value": "90 days", "label": "Expected carrier review window", "negative": True, "positive": False},
                 {"value": "24%", "label": "Current UPS SOW at Aptiv", "negative": False, "positive": False}
             ],
             "key_insight": "Sarah Reyes's Penske track record is a playbook we can predict: carrier consolidation from 7 to 3, cost reduction focus, primary-carrier model. At Aptiv, UPS is one of 4 carriers with 24% SOW. Consolidation to 3 carriers could increase UPS SOW to 35-40% — or eliminate UPS if FedEx or DHL offers a more aggressive consolidation deal. The 90-day window before Reyes initiates a formal review is the engagement window. UPS's advantage: 4 active opportunities in pipeline and Aptiv's Ireland-to-Detroit corridor where UPS has the strongest network.",
             "recent_activity": [
                 {"action": "LinkedIn announcement: Sarah Reyes appointed VP Global Logistics at Aptiv, effective immediately", "actor": "LinkedIn / Automotive News", "time": "14:08 ET Jun 7"},
                 {"action": "Background research on Reyes: led Penske carrier consolidation (7→3 carriers, -11% cost)", "actor": "Competitive Intelligence", "time": "Today"},
                 {"action": "Aptiv account team has 4 active opportunities in pipeline — $8.2M combined value", "actor": "Enterprise Sales", "time": "Current"},
                 {"action": "Aptiv Ireland-to-Detroit air freight corridor running at 94% OTD — strong service position", "actor": "Network Operations", "time": "This week"}
             ],
             "related_topics": ["Executive Relationship Building", "Carrier Consolidation Risk", "Aptiv PLC", "Penske Logistics Playbook", "Ireland-Detroit Corridor", "SOW Expansion"],
             "recommended_takeaways": [
                 {"action": "Schedule a VP Marketing + Account Director intro meeting with Sarah Reyes within 2 weeks", "reasoning": "because Reyes will form carrier impressions in her first 90 days — early executive access positions UPS as a strategic partner before a formal review begins.", "impact": "Establishes UPS relationship with the new decision-maker before she defaults to Penske-era carrier preferences."},
                 {"action": "Prepare an Aptiv executive briefing pack highlighting UPS's multi-corridor capability and 94% OTD on Ireland-Detroit", "reasoning": "because Reyes's consolidation playbook favors carriers who can demonstrate cross-corridor reliability — UPS's Ireland-Detroit performance is a proof point.", "impact": "Positions UPS as the consolidation winner (35-40% SOW target) rather than a reduction casualty."},
                 {"action": "Accelerate the 4 pipeline opportunities to close before any carrier review begins", "reasoning": "because active contracts create switching costs — $8.2M in new commitments makes UPS harder to consolidate away.", "impact": "Converts pipeline to contracted revenue, strengthening UPS's position if a carrier panel reduction occurs."}
             ],
             "confidence_description": "High confidence — executive appointment confirmed via LinkedIn and Automotive News, Penske track record verified.",
             "data_sources": [
                 {"name": "LinkedIn", "type": "External", "confidence": "High", "updated": "Jun 7"},
                 {"name": "Automotive News", "type": "External", "confidence": "High", "updated": "Jun 7"},
                 {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "Today"},
                 {"name": "Enterprise Sales CRM", "type": "Internal", "confidence": "High", "updated": "Current"}
             ],
             "context_questions": [
                 "What was Reyes's exact carrier selection criteria at Penske?",
                 "Which 3 carriers survived Penske's consolidation?",
                 "What's UPS's competitive position vs FedEx and DHL at Aptiv?",
                 "Can we offer Aptiv a consolidation discount to lock in 35%+ SOW?"
             ]
         }},
        {"time": "11:47 ET (Jun 7)", "type": "Plant", "title": "Ford BlueOval City TN — first production batch shifts to Aug 2026 (was Jun)", "source": "Ford 8-K", "impact": "med", "conf": 0.99, "accounts": ["Ford Motor Company"], "why": "Inbound parts surge timing moves; UPS dedicated logistics commitment with Ford has 6-week buffer to rebalance.", "action": "Update Ford operational playbook; reflect in capacity scenario.",
         "signal_enrichment": {
             "why_it_matters": "Ford's BlueOval City in Stanton, Tennessee is a $5.6B investment — the largest single manufacturing investment in Tennessee history. It will produce next-generation electric F-Series trucks and advanced batteries. The production start delay from June to August 2026 shifts the inbound parts surge by 8 weeks, directly affecting UPS's dedicated logistics commitment for the plant. UPS has a 6-week buffer in the current operational playbook, but the shift also moves the parts surge into the same window as the NAAF Mexico launch (Aug 10) and the Toyota Georgetown production increase (+12% Q3). Three simultaneous volume events in August create a network capacity coordination challenge across the Southeast and Midwest.",
             "metrics": [
                 {"value": "8 weeks", "label": "Production start delay (Jun → Aug)", "negative": True, "positive": False},
                 {"value": "$5.6B", "label": "BlueOval City investment", "negative": False, "positive": True},
                 {"value": "6 weeks", "label": "UPS playbook buffer remaining", "negative": False, "positive": False}
             ],
             "key_insight": "The delay is manageable for the Ford relationship (6-week buffer holds), but the timing convergence is the real risk. BlueOval City parts surge, NAAF Mexico launch, and Toyota Georgetown +12% all hit in August. UPS network planning needs to coordinate Southeast/Midwest capacity allocation across all three events simultaneously. Ford's battery logistics RFP closes August 12 — the BlueOval City delay may actually help by giving UPS more preparation time for the battery corridor proposal.",
             "recent_activity": [
                 {"action": "Ford 8-K filing confirmed BlueOval City first production batch delayed Jun → Aug 2026", "actor": "Ford 8-K / SEC", "time": "11:47 ET Jun 7"},
                 {"action": "UPS dedicated logistics team confirmed 6-week buffer in Ford operational playbook still holds", "actor": "Dedicated Operations", "time": "Today"},
                 {"action": "Ford battery logistics RFP still on track — closes Aug 12, unaffected by production delay", "actor": "Enterprise Sales — Auto", "time": "Yesterday"},
                 {"action": "Network planning flagged August capacity convergence: BlueOval + NAAF + Toyota Georgetown", "actor": "Network Planning", "time": "Today"}
             ],
             "related_topics": ["BlueOval City", "EV Battery Logistics", "Ford RFP Aug 12", "August Capacity Convergence", "Tennessee Hub", "Dedicated Logistics"],
             "recommended_takeaways": [
                 {"action": "Update the Ford operational playbook to reflect the August start and coordinate with NAAF/Toyota timing", "reasoning": "because three simultaneous volume events in August (BlueOval, NAAF, Toyota) create a network capacity coordination challenge that the current playbook doesn't address.", "impact": "Unified August capacity plan prevents service failures across Ford, NAAF Mexico, and Toyota Georgetown simultaneously."},
                 {"action": "Use the extra 8 weeks to strengthen the Ford battery logistics RFP response (due Aug 12)", "reasoning": "because the production delay gives UPS more preparation time — the battery corridor proposal can now include actual NAAF Mexico launch data as a proof point.", "impact": "Stronger RFP response with demonstrated cross-border capability, increasing win probability on the battery logistics contract."},
                 {"action": "Model the August capacity convergence in Deal Analyser to identify bottlenecks", "reasoning": "because BlueOval + NAAF + Toyota Georgetown all peak simultaneously — without simulation, capacity allocation decisions will be reactive.", "impact": "Proactive bottleneck identification prevents August service failures that could affect 3 major account relationships simultaneously."}
             ],
             "confidence_description": "Very high confidence — Ford 8-K SEC filing, confirmed by dedicated operations team.",
             "data_sources": [
                 {"name": "Ford 8-K / SEC Filing", "type": "External", "confidence": "Very High", "updated": "Jun 7"},
                 {"name": "Dedicated Operations", "type": "Internal", "confidence": "High", "updated": "Today"},
                 {"name": "Enterprise Sales — Automotive", "type": "Internal", "confidence": "High", "updated": "Yesterday"},
                 {"name": "Network Planning", "type": "Internal", "confidence": "High", "updated": "Today"}
             ],
             "context_questions": [
                 "What's the total August capacity demand across BlueOval, NAAF, and Toyota?",
                 "Does the BlueOval delay affect the Ford battery logistics RFP timeline?",
                 "What's the EV battery shipping corridor plan — Stanton TN to where?",
                 "Can we use the extra 8 weeks to run a capacity stress test?"
             ]
         }},
        {"time": "09:22 ET (Jun 7)", "type": "Earnings", "title": "AutoZone Q3: reviewing carrier diversification on earnings call", "source": "AutoZone Q3 transcript", "impact": "high", "conf": 0.88, "accounts": ["AutoZone"], "why": "Explicit signal of carrier mix review. UPS holds ~17% SOW. FedEx + regional courier likely competitive threats.", "action": "Escalate AutoZone account to retention / save play; convene pricing committee.",
         "signal_enrichment": {
             "why_it_matters": "AutoZone's CEO explicitly mentioned 'carrier diversification' on the Q3 earnings call — the first time logistics strategy has been raised on an AutoZone earnings call in 3 years. This is a direct signal of an imminent carrier mix review. UPS holds approximately 17% SOW ($41M annual spend) with $48M addressable headroom, but the diversification language suggests AutoZone wants more carriers, not fewer. FedEx has been running targeted pricing at aftermarket auto-parts accounts (8-12% discount offers to enterprise accounts in the $1M-$5M band), and regional last-mile couriers are undercutting on AutoZone's store-to-store replenishment lanes. UPS's 17% SOW could shrink to 12-14% if the review goes badly.",
             "metrics": [
                 {"value": "17%", "label": "Current UPS SOW at AutoZone", "negative": False, "positive": False},
                 {"value": "$41M", "label": "Annual UPS spend at risk", "negative": True, "positive": False},
                 {"value": "8-12%", "label": "FedEx discount offers in segment", "negative": True, "positive": False}
             ],
             "key_insight": "The earnings-call mention is the most reliable leading indicator of a carrier review — it signals board-level attention to logistics costs. AutoZone's aftermarket parts network (7,000+ stores, 70+ distribution centers) relies heavily on next-day store replenishment. UPS's advantage is network density for next-day ground to 7,000 stores — regional couriers can undercut on price but cannot match coverage. The retention strategy must lead with coverage and reliability, not price. FedEx's discount offers are the competitive threat, but their aftermarket parts handling infrastructure is weaker than UPS's.",
             "recent_activity": [
                 {"action": "AutoZone CEO mentioned 'carrier diversification' on Q3 earnings call — first logistics mention in 3 years", "actor": "AutoZone Q3 Earnings Transcript", "time": "09:22 ET Jun 7"},
                 {"action": "Revenue Management flagged AutoZone as competitive risk — FedEx counter-offer detected last month", "actor": "Revenue Management", "time": "Last month"},
                 {"action": "AutoZone store-to-store replenishment lanes showing 3% volume decline vs forecast", "actor": "Network Analytics", "time": "This week"},
                 {"action": "Regional courier (OnTrac) won 2 AutoZone West Coast DC-to-store lanes in Q2", "actor": "Enterprise Sales — Aftermarket", "time": "Q2"}
             ],
             "related_topics": ["AutoZone Carrier Review", "Aftermarket Parts Logistics", "FedEx Competitive Threat", "Store Replenishment Network", "Regional Courier Competition", "Retention Strategy"],
             "recommended_takeaways": [
                 {"action": "Escalate AutoZone to retention/save play status and convene the pricing committee within 1 week", "reasoning": "because an earnings-call mention of carrier diversification signals a formal review is imminent — reactive engagement after the review starts is too late.", "impact": "Proactive retention engagement protects $41M annual spend and positions UPS before FedEx's discount offers convert."},
                 {"action": "Lead the retention conversation with next-day coverage to 7,000+ stores — not price", "reasoning": "because regional couriers can undercut on price but cannot match UPS's network density for nationwide next-day store replenishment.", "impact": "Shifts AutoZone's evaluation criteria from cost-per-package to coverage reliability — where UPS has an unassailable advantage."},
                 {"action": "Analyze the 2 West Coast lanes lost to OnTrac and build a counter-proposal", "reasoning": "because understanding why OnTrac won reveals AutoZone's evaluation criteria and pricing sensitivity — intelligence needed for the broader retention strategy.", "impact": "Win-back of 2 lanes demonstrates competitive responsiveness, and the analysis informs pricing for the full carrier review."},
                 {"action": "Prepare a multi-year volume commitment offer with tiered pricing for AutoZone", "reasoning": "because a volume commitment with tiered pricing gives AutoZone the cost reduction they're seeking while locking in UPS SOW through the review period.", "impact": "3-year volume commitment at tiered pricing protects $41M base while offering AutoZone a path to cost savings without carrier fragmentation."}
             ],
             "confidence_description": "High confidence — earnings call transcript is public record, competitive activity confirmed by revenue management.",
             "data_sources": [
                 {"name": "AutoZone Q3 Earnings Transcript", "type": "External", "confidence": "Very High", "updated": "Jun 7"},
                 {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Last month"},
                 {"name": "Network Analytics", "type": "Internal", "confidence": "High", "updated": "This week"},
                 {"name": "Enterprise Sales — Aftermarket", "type": "Internal", "confidence": "High", "updated": "Q2"}
             ],
             "context_questions": [
                 "What exactly did AutoZone's CEO say about carrier diversification on the call?",
                 "Which lanes did OnTrac win and at what price point?",
                 "What's FedEx's aftermarket parts handling capability vs UPS?",
                 "Can we offer AutoZone a volume-tiered pricing model to prevent fragmentation?"
             ]
         }},
    ]
    # Old auto_signals removed — replaced by prototype signals below
    # for sig in auto_signals:
    #     db.add(AutoMarketSignal(**sig))

    # ── Market Signals ("What's moving the number") — from prototype ──
    market_signals = [
        {"time": "06:55 ET", "type": "Earnings", "title": "Q1 2026 US Domestic operating margin 4.0% adj. — $350M transitional cost drag (250 bps)",
         "source": "UPS Q1 2026 Earnings Call (Apr 28, 2026)", "impact": "high", "conf": 1.0, "accounts": ["Portfolio"],
         "why": "MD-11 retirement, Ground Saver insourcing transition, weather, and casualty expenses created a 250 bps drag on US Domestic margin. CFO Brian Dykes characterized as 'largely behind us.' Q2 guide: 7.5–8.5%.",
         "action": "Track margin recovery weekly; Q2 inflection critical to FY guide.",
         "signal_enrichment": {
             "why_it_matters": "US Domestic operating margin fell to 4.0% adjusted — well below the 7.5–8.5% Q2 target. The $350M drag came from four converging transitional costs: MD-11 fleet retirement (maintenance and lease-exit charges), Ground Saver insourcing (shifting USPS-delivered volume onto UPS network at higher cost during ramp), severe Q1 weather events (ice storms in the Southeast), and elevated casualty expenses. CFO Dykes characterized these as 'largely behind us,' implying Q2 should show meaningful recovery. However, if Q2 margin stays below 6%, the FY26 guide of 10%+ adjusted becomes structurally unreachable without dramatic H2 acceleration.",
             "metrics": [
                 {"value": "4.0%", "label": "US Domestic adj. operating margin", "negative": True, "positive": False},
                 {"value": "250 bps", "label": "Transitional cost drag", "negative": True, "positive": False},
                 {"value": "7.5–8.5%", "label": "Q2 margin target", "negative": False, "positive": True}
             ],
             "key_insight": "The 250 bps drag is transitional, not structural — MD-11 retirements complete in Q2, Ground Saver insourcing stabilizes by mid-year, and weather/casualty are non-recurring. The real test is Q2: if margin recovers to the 7.5–8.5% guide, the yield-over-volume strategy is confirmed. If it doesn't, the market will question whether the Amazon capacity reallocation is generating sufficient replacement revenue at target margins.",
             "recent_activity": [
                 {"action": "Q1 earnings reported US Domestic adj. op margin 4.0% — $350M transitional drag", "actor": "UPS Investor Relations", "time": "Apr 28, 2026"},
                 {"action": "CFO Dykes confirmed MD-11 retirement costs 'largely behind us' on earnings call", "actor": "CFO Office", "time": "Apr 28, 2026"},
                 {"action": "Ground Saver insourcing transition tracking at 78% completion — ahead of schedule", "actor": "Network Operations", "time": "Last week"},
                 {"action": "Finance team modeling Q2 margin recovery scenarios (base case: 7.8%)", "actor": "Finance & Strategy", "time": "This week"}
             ],
             "related_topics": ["Operating Margin", "MD-11 Retirement", "Ground Saver Insourcing", "Q2 Recovery", "FY26 Guidance", "Transitional Costs"],
             "recommended_takeaways": [
                 {"action": "Establish weekly margin tracking cadence with finance through Q2", "reasoning": "because Q2 margin recovery to 7.5–8.5% is the single most important proof point for the yield strategy — early warning on shortfall enables course correction.", "impact": "Real-time visibility into margin trajectory, enabling proactive pricing and cost actions if recovery lags."},
                 {"action": "Ensure Ground Saver insourcing completion stays on track for mid-year", "reasoning": "because insourcing is the largest controllable margin headwind — delays extend the cost drag into H2.", "impact": "Completing insourcing on schedule removes ~100 bps of the transitional drag from Q3 onwards."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "UPS Finance & Strategy", "type": "Internal", "confidence": "High", "updated": "This week"}
             ],
             "confidence_description": "Very high confidence — sourced directly from UPS Q1 2026 earnings call and SEC filings.",
             "context_questions": [
                 "What's the Q2 margin recovery tracking at so far?",
                 "How much of the $350M drag was one-time vs recurring?",
                 "Is the Ground Saver insourcing on track for mid-year completion?",
                 "What margin level do we need in Q2 to keep the FY26 guide credible?"
             ]
         }},
        {"time": "06:22 ET", "type": "Volume", "title": "Amazon volume reduced ~500K ADV in Q1 — glide-down on track for June 2026 completion",
         "source": "UPS Q1 2026 Earnings Call", "impact": "high", "conf": 1.0, "accounts": ["Portfolio"],
         "why": "Amazon was 10.6% of FY25 revenue; targeted to be roughly half by mid-2026. Freed capacity reallocating to higher-yield SMB, Healthcare, B2B, Automotive.",
         "action": "Confirm capacity reallocation plans hitting SMB / Healthcare growth engines.",
         "signal_enrichment": {
             "why_it_matters": "The Amazon glide-down is the cornerstone of Carol Tomé's 'better, not bigger' strategy. Amazon represented 10.6% of FY25 revenue ($11.3B) — a massive, low-margin volume dependency. Reducing Amazon to ~5% by mid-2026 frees approximately 700K ADV of network capacity. The strategic bet: reallocate that capacity to higher-yield segments (SMB at $18.40 RPP vs Amazon's ~$8.50 RPP, Healthcare at $22.80 RPP) to grow revenue per piece even as total volume declines. Q1 results show ~500K ADV already removed — the glide-down is mechanically on track for June completion.",
             "metrics": [
                 {"value": "~500K", "label": "Amazon ADV reduced in Q1", "negative": False, "positive": True},
                 {"value": "10.6%", "label": "Amazon share of FY25 revenue", "negative": True, "positive": False},
                 {"value": "~700K", "label": "ADV capacity freed by Q2 end", "negative": False, "positive": True}
             ],
             "key_insight": "The glide-down is on track mechanically, but the real question is whether freed capacity is being filled with higher-yield volume fast enough. SMB ADV grew +1.6% YoY, Healthcare logistics hit $3B quarterly — both positive. But US Domestic total ADV is down ~8% YoY, meaning the backfill is running behind the Amazon exit pace. The 4.8% volume gap must close through DAP acquisitions, healthcare penetration, and automotive wins before fixed-cost leverage erodes margins further.",
             "recent_activity": [
                 {"action": "Q1 earnings confirmed ~500K ADV Amazon volume reduction — on track for June completion", "actor": "UPS Investor Relations", "time": "Apr 28, 2026"},
                 {"action": "SMB ADV grew +1.6% YoY — positive but below the 3.5% needed to fully replace Amazon", "actor": "Revenue Management", "time": "This quarter"},
                 {"action": "Healthcare logistics crossed $3B quarterly — highest-yield backfill segment performing", "actor": "Healthcare Division", "time": "This quarter"},
                 {"action": "Network planning confirmed 700K ADV capacity available by end of Q2", "actor": "Network Planning", "time": "Last week"}
             ],
             "related_topics": ["Amazon Glide-Down", "Capacity Reallocation", "SMB Backfill", "Healthcare Growth", "Volume vs Yield Strategy", "Network Utilization"],
             "recommended_takeaways": [
                 {"action": "Accelerate SMB and Healthcare capacity reallocation to close the 4.8% volume gap", "reasoning": "because the Amazon exit pace is outrunning the backfill rate — freed capacity without replacement volume erodes fixed-cost leverage.", "impact": "Closing the gap protects US Domestic margins and validates the yield-over-volume thesis to investors."},
                 {"action": "Monitor for Amazon volume re-entry overtures and maintain pricing discipline", "reasoning": "because Amazon may attempt to reverse the glide-down with volume commitments at low rates — accepting would unwind 18 months of strategy.", "impact": "Protects the $15.32 RPP baseline and the strategic shift to higher-yield segments."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — sourced from UPS Q1 2026 earnings call. Glide-down targets publicly stated.",
             "context_questions": [
                 "How much of the freed Amazon capacity has been reallocated to higher-yield segments?",
                 "What's the current backfill rate vs the Amazon exit pace?",
                 "Has Amazon made any volume re-entry overtures?",
                 "Which hubs have the most unused capacity post-Amazon?"
             ]
         }},
        {"time": "05:40 ET", "type": "Healthcare", "title": "Healthcare logistics delivered first $3.0B quarter in Q1 2026 — all 3 segments YoY growth",
         "source": "UPS Q1 2026 Press Release (Apr 28, 2026)", "impact": "high", "conf": 1.0, "accounts": ["Portfolio · Healthcare"],
         "why": "On track toward $20B FY late-2026 healthcare target (~doubling 2023 base). Andlauer + Frigo-Trans acquisitions fully integrated. Cold-chain capacity material in US Domestic mix shift.",
         "action": "Accelerate Healthcare ABM motions; consider penetration plays in pharma + medical devices.",
         "signal_enrichment": {
             "why_it_matters": "Healthcare logistics crossed $3.04B in Q1 — a milestone quarter. UPS Healthcare now operates the world's largest healthcare-specific logistics network: Marken (clinical trials), MNX Global Solutions (time-critical), Andlauer Healthcare Group (Canadian pharma), and Frigo-Trans (European cold-chain). Revenue per piece in healthcare is $22.80 — nearly double the enterprise average of $12.10. On track toward the $20B FY late-2026 target. All three healthcare sub-segments grew YoY: temperature-controlled (+14%), clinical trials (+11%), medical devices (+8%).",
             "metrics": [
                 {"value": "$3.04B", "label": "Q1 Healthcare revenue (record)", "negative": False, "positive": True},
                 {"value": "$22.80", "label": "Healthcare RPP (highest vertical)", "negative": False, "positive": True},
                 {"value": "$20B", "label": "FY late-2026 healthcare target", "negative": False, "positive": True}
             ],
             "key_insight": "Healthcare is UPS's premium margin engine and the fastest path to replacing Amazon revenue with structurally higher-yield volume. At $22.80 RPP, every healthcare package is worth 2.7× an average enterprise package. The Marken clinical trial platform gives UPS a moat that FedEx and DHL cannot replicate without major acquisitions. FedEx's Memphis cold-chain hub delay (July → September) creates a 6-8 week window to lock in displaced pharma capacity.",
             "recent_activity": [
                 {"action": "Healthcare revenue confirmed at $3.04B — first-ever $3B quarter milestone", "actor": "Healthcare Logistics", "time": "Apr 28, 2026"},
                 {"action": "Temperature-controlled shipments up 14% YoY, led by Marken clinical trial logistics", "actor": "Marken Division", "time": "Q1"},
                 {"action": "Andlauer + Frigo-Trans integration completed — full Canadian and EU cold-chain coverage", "actor": "M&A Integration", "time": "This quarter"},
                 {"action": "FedEx Memphis cold-chain hub delayed July → September — capacity window for UPS", "actor": "Competitive Intelligence", "time": "Last week"}
             ],
             "related_topics": ["Healthcare Logistics", "Cold-Chain Infrastructure", "Marken Platform", "Clinical Trials", "$20B Target", "FedEx Competition"],
             "recommended_takeaways": [
                 {"action": "Accelerate enterprise pharma contract outreach during the FedEx delay window", "reasoning": "because the 6-8 week gap before FedEx's Memphis hub opens is a time-limited opportunity to capture displaced capacity demand.", "impact": "Locks in 3-5 enterprise pharma contracts worth an estimated $120-200M annually."},
                 {"action": "Expand Healthcare ABM motions to medical devices and pharma verticals", "reasoning": "because medical devices grew 8% YoY — slower than temp-controlled (14%) and clinical (11%) — indicating untapped potential.", "impact": "Accelerates medical device penetration toward the $20B healthcare target."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Press Release", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Healthcare Logistics Division", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — public earnings data confirmed by internal healthcare analytics.",
             "context_questions": [
                 "Which pharma accounts are most at risk when FedEx's Memphis hub opens in September?",
                 "What's driving the 14% growth in temperature-controlled vs 8% in medical devices?",
                 "How does healthcare margin compare across the three sub-segments?",
                 "What cold-chain capacity can we add in the Northeast within 6 weeks?"
             ]
         }},
        {"time": "04:18 ET", "type": "Network", "title": "Network Reconfiguration · 23 facilities closed in Q1; 27 more closing by end of H1",
         "source": "UPS Q1 2026 8-K", "impact": "med", "conf": 1.0, "accounts": ["Operations"],
         "why": "50-facility H1 closure target. 25,000 operational positions reduced. 28% lower cost-per-piece in automated facilities (per CEO Tomé). Driver Choice voluntary program — 7,500 buyouts, 77% exited April.",
         "action": "Monitor service continuity during transition; SMB-facing field readiness.",
         "signal_enrichment": {
             "why_it_matters": "UPS is executing the largest network reconfiguration in its 117-year history. 23 facilities closed in Q1, 27 more by end of H1 (50 total). 25,000 operational positions reduced through the Driver Choice voluntary buyout program — 7,500 drivers accepted buyouts, 77% exited by April. CEO Carol Tomé reported 28% lower cost-per-piece in fully automated facilities. This is the structural cost reduction that makes the yield-over-volume strategy viable: fewer facilities, higher automation, lower cost-per-piece, capacity freed from Amazon volume reinvested in higher-yield segments.",
             "metrics": [
                 {"value": "50", "label": "Facilities closing in H1", "negative": False, "positive": False},
                 {"value": "25,000", "label": "Positions reduced", "negative": False, "positive": False},
                 {"value": "28%", "label": "Cost-per-piece reduction (automated)", "negative": False, "positive": True}
             ],
             "key_insight": "The 28% cost-per-piece reduction in automated facilities is the headline number — it proves that the network reconfiguration is delivering structural margin improvement, not just cost-cutting. The risk is service continuity during the transition: 50 facility closures in 6 months means rerouting thousands of lanes. SMB customers in affected geographies may see temporary service disruptions unless field teams are proactively managing expectations and alternatives.",
             "recent_activity": [
                 {"action": "23 facilities closed in Q1 — on track for 50 by end of H1", "actor": "Network Operations", "time": "Q1"},
                 {"action": "Driver Choice program: 7,500 buyouts accepted, 77% exited by April", "actor": "HR & Operations", "time": "April"},
                 {"action": "Automated facility cost-per-piece benchmarked at 28% below legacy facilities", "actor": "Finance & Strategy", "time": "This quarter"},
                 {"action": "Service continuity monitoring dashboard activated for affected geographies", "actor": "Network Quality", "time": "This month"}
             ],
             "related_topics": ["Network Reconfiguration", "Facility Closures", "Automation", "Driver Choice Program", "Cost-Per-Piece", "Service Continuity"],
             "recommended_takeaways": [
                 {"action": "Monitor service continuity in affected geographies and proactively communicate with SMB customers", "reasoning": "because 50 facility closures in H1 create temporary service disruption risk — losing SMB customers during the transition would undermine the backfill strategy.", "impact": "Protects SMB volume in the 50 affected geographies during the transition period."},
                 {"action": "Accelerate automation deployment to capture the 28% cost-per-piece advantage more broadly", "reasoning": "because every automated facility delivers structural margin improvement — the faster the rollout, the sooner the cost base supports the yield strategy.", "impact": "Expanding automation to 15 additional facilities in H2 could reduce US Domestic cost base by $200-300M annually."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 8-K", "type": "External", "confidence": "Very High", "updated": "Q1 2026"},
                 {"name": "Network Operations", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — SEC filing data confirmed by internal network operations tracking.",
             "context_questions": [
                 "Which geographies are most affected by the remaining 27 facility closures?",
                 "What's the service continuity risk level in each affected area?",
                 "How many of the 25,000 position reductions are completed vs pending?",
                 "What's the automation rollout timeline for the next 15 facilities?"
             ]
         }},
        {"time": "21:18 ET (Jun 7)", "type": "Competitor", "title": "FedEx Freight spin-off completed Jun 1, 2026 — new standalone publicly traded company",
         "source": "FedEx Corp 8-K (Mar 19, 2026) · WSJ (Jun 1, 2026)", "impact": "high", "conf": 1.0, "accounts": ["LTL Competitive Set"],
         "why": "FedEx Freight (LTL) spun off as standalone NYSE listing on June 1, 2026 with $3.7B senior notes issued Feb 5. Refocuses FedEx Express on small-parcel competition with UPS. DIM technology aggressively used (90% of shipments) — material precedent for UPS pricing posture.",
         "action": "Re-evaluate competitive positioning vs leaner FedEx Express; tighten L0 DIM Divisor floor portfolio-wide.",
         "signal_enrichment": {
             "why_it_matters": "FedEx completed the Freight spin-off on June 1, 2026 — the most significant structural change in the US logistics industry in a decade. By separating LTL into a standalone NYSE-listed company (with $3.7B in senior notes), FedEx Express becomes a leaner, pure-play parcel competitor focused directly on UPS's core business. FedEx Express can now allocate 100% of capital and management attention to small-parcel competition. Their aggressive DIM technology deployment (90% of shipments scanned for dimensional weight) sets a pricing precedent that could pressure UPS if DIM adoption lags.",
             "metrics": [
                 {"value": "Jun 1", "label": "FedEx Freight spin-off completion", "negative": True, "positive": False},
                 {"value": "$3.7B", "label": "Senior notes issued for spin-off", "negative": False, "positive": False},
                 {"value": "90%", "label": "FedEx DIM scanning adoption", "negative": True, "positive": False}
             ],
             "key_insight": "Post-spin-off FedEx Express is a fundamentally different competitor. Without the LTL freight business consuming management bandwidth and capital, FedEx Express will pursue small-parcel market share with singular focus. Their 90% DIM scanning rate means they're pricing more accurately on dimensional weight — a competitive advantage UPS must match. The L0 DIM Divisor is UPS's primary lever to ensure pricing reflects actual package dimensions. If UPS doesn't tighten DIM floors portfolio-wide, FedEx's pricing accuracy advantage compounds over time.",
             "recent_activity": [
                 {"action": "FedEx Freight officially listed as standalone company on NYSE — Jun 1, 2026", "actor": "WSJ / NYSE", "time": "Jun 1, 2026"},
                 {"action": "FedEx Corp 8-K filed Mar 19 confirming spin-off mechanics and $3.7B debt issuance", "actor": "SEC / FedEx IR", "time": "Mar 19, 2026"},
                 {"action": "Competitive Intelligence briefing: post-spin FedEx Express restructuring underway", "actor": "Strategy & CI", "time": "This week"},
                 {"action": "UPS DIM scanning rate at 72% vs FedEx's 90% — 18-point gap", "actor": "Revenue Management", "time": "Current"}
             ],
             "related_topics": ["FedEx Freight Spin-Off", "DIM Technology", "Competitive Positioning", "L0 DIM Divisor", "Pricing Discipline", "Small-Parcel Market"],
             "recommended_takeaways": [
                 {"action": "Tighten L0 DIM Divisor floor portfolio-wide to match FedEx's pricing precision", "reasoning": "because FedEx's 90% DIM scanning rate gives them an 18-point advantage in pricing accuracy — leaving UPS at 72% means undercharging on oversized packages.", "impact": "Closing the DIM gap from 72% to 85% could recover an estimated $120-180M annually in under-captured dimensional surcharges."},
                 {"action": "Re-evaluate competitive positioning against the post-spin-off FedEx Express", "reasoning": "because FedEx Express without LTL freight is a leaner, more focused competitor — UPS's competitive playbook must be updated to reflect the new threat profile.", "impact": "Updated competitive strategy prevents being surprised by FedEx's increased focus on small-parcel market share."}
             ],
             "data_sources": [
                 {"name": "FedEx Corp 8-K", "type": "External", "confidence": "Very High", "updated": "Mar 19, 2026"},
                 {"name": "Wall Street Journal", "type": "External", "confidence": "High", "updated": "Jun 1, 2026"},
                 {"name": "Strategy & CI", "type": "Internal", "confidence": "High", "updated": "This week"}
             ],
             "confidence_description": "Very high confidence — SEC filings and public market data. Spin-off is complete.",
             "context_questions": [
                 "What's FedEx Express's estimated capital allocation post-spin-off?",
                 "How quickly can UPS close the DIM scanning gap from 72% to 85%?",
                 "Which UPS enterprise accounts are most vulnerable to a focused FedEx Express?",
                 "Should we accelerate our own DIM technology deployment timeline?"
             ]
         }},
        {"time": "16:42 ET (Jun 7)", "type": "Competitor", "title": "FedEx Q3 FY26: US domestic revenue +10%, package volume growing — share pressure vs UPS",
         "source": "FedEx Corp Q3 FY26 8-K (Mar 19, 2026)", "impact": "high", "conf": 0.95, "accounts": ["Portfolio"],
         "why": "FedEx Federal Express segment posted 10% Q3 revenue growth on higher US domestic + International Priority yields AND increased US domestic package volume — while UPS US Domestic Q1 revenue declined 2.3%. Mix-shift execution is now structural.",
         "action": "Sharpen pricing discipline on SMB and B2B segments to defend share gains; protect Healthcare premium.",
         "signal_enrichment": {
             "why_it_matters": "FedEx's Q3 FY26 results reveal a structural divergence: FedEx US domestic revenue grew 10% with volume growth, while UPS US Domestic Q1 revenue declined 2.3% with 8% volume decline. FedEx is growing both volume AND yield simultaneously — a combination UPS achieved only on the yield side. FedEx's International Priority yields also grew, pressuring UPS's $15.32 RPP advantage. This is no longer a temporary competitive moment — FedEx's execution on the Happy Returns acquisition, DIM technology, and post-Freight-spin focus is producing sustained results.",
             "metrics": [
                 {"value": "+10%", "label": "FedEx US domestic revenue growth", "negative": True, "positive": False},
                 {"value": "-2.3%", "label": "UPS US Domestic revenue (Q1)", "negative": True, "positive": False},
                 {"value": "+8%", "label": "FedEx volume growth (vs UPS -8%)", "negative": True, "positive": False}
             ],
             "key_insight": "The 10% revenue growth at FedEx while UPS declined 2.3% is the starkest competitive divergence since 2019. FedEx is executing a volume + yield strategy (grow both) while UPS is executing a yield-only strategy (grow yield, accept volume decline). Both can work — but UPS's strategy requires the yield premium to outrun the volume loss, and FedEx's momentum makes that harder. The Healthcare and SMB segments where UPS commands pricing power are precisely where FedEx is now investing most aggressively.",
             "recent_activity": [
                 {"action": "FedEx Q3 FY26 8-K: Federal Express segment revenue +10%, US domestic volume growing", "actor": "FedEx IR / SEC", "time": "Mar 19, 2026"},
                 {"action": "FedEx International Priority yields increased — pressuring UPS's international RPP advantage", "actor": "Competitive Intelligence", "time": "This quarter"},
                 {"action": "FedEx Happy Returns integration going live at enterprise accounts — reverse logistics play", "actor": "Competitive Intelligence", "time": "This month"},
                 {"action": "UPS US Domestic Q1 revenue declined 2.3% on -8% ADV — yield up but volume down more", "actor": "UPS Finance", "time": "Apr 28, 2026"}
             ],
             "related_topics": ["FedEx Competition", "Market Share", "Revenue Growth Divergence", "Yield vs Volume Strategy", "Happy Returns", "Pricing Discipline"],
             "recommended_takeaways": [
                 {"action": "Sharpen pricing discipline on SMB and B2B segments to defend share gains", "reasoning": "because FedEx is growing volume in exactly the segments UPS is targeting for Amazon replacement — losing share in SMB/B2B undermines the entire backfill strategy.", "impact": "Protects SMB and B2B share gains that represent the foundation of the yield-over-volume strategy."},
                 {"action": "Analyze FedEx's volume growth sources to understand which UPS segments are losing share", "reasoning": "because FedEx's +10% growth vs UPS's -2.3% implies FedEx is winning specific customer segments — identifying which ones enables targeted defense.", "impact": "Pinpoints the 3-5 customer segments where UPS is losing competitive position, enabling surgical intervention."}
             ],
             "data_sources": [
                 {"name": "FedEx Corp Q3 FY26 8-K", "type": "External", "confidence": "Very High", "updated": "Mar 19, 2026"},
                 {"name": "UPS Q1 2026 Earnings", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Competitive Intelligence", "type": "Internal", "confidence": "High", "updated": "Current"}
             ],
             "confidence_description": "Very high confidence — both companies' SEC filings provide direct comparison data.",
             "context_questions": [
                 "Which customer segments is FedEx winning volume from UPS?",
                 "How does FedEx's Happy Returns affect our enterprise account retention?",
                 "What's FedEx's pricing strategy in the SMB segment specifically?",
                 "Should we adjust our yield-only strategy to include selective volume plays?"
             ]
         }},
        {"time": "16:08 ET (Jun 7)", "type": "Trade Policy", "title": "2025 trade policy shifts continue rerouting Asia-to-Americas flows — UPS captured premium trade-lane shifts in Q1",
         "source": "UPS Q1 2026 Earnings Call + Supply Chain Dive (May 2026)", "impact": "med", "conf": 0.92, "accounts": ["International × US Dom B2B"],
         "why": "Per CFO Dykes: UPS 'capitalized on trade lane shifts resulting from 2025 trade policy changes.' International Q1 revenue +3.8% on +10.7% RPP. Continued tariff volatility shifts inbound flows toward Mexico + Vietnam.",
         "action": "Position NAAF Mexico and Asia-Pacific lanes as premium-priced alternatives in Q3 RFPs.",
         "signal_enrichment": {
             "why_it_matters": "2025 trade policy changes (tariff adjustments, USMCA enforcement, Section 301 modifications) are structurally rerouting Asia-to-Americas supply chains. Shippers are diversifying away from China-only sourcing toward Vietnam, Mexico, and India — creating new premium trade lanes where UPS has network advantages. CFO Dykes confirmed UPS 'capitalized on trade lane shifts' with International Q1 revenue up 3.8% and RPP up 10.7%. The NAAF Mexico launch (Aug 10) is perfectly timed to capture nearshoring-driven cross-border volume.",
             "metrics": [
                 {"value": "+3.8%", "label": "International Q1 revenue", "negative": False, "positive": True},
                 {"value": "+10.7%", "label": "International RPP growth", "negative": False, "positive": True},
                 {"value": "Mexico+Vietnam", "label": "Key rerouting destinations", "negative": False, "positive": True}
             ],
             "key_insight": "Trade policy shifts are creating a structural tailwind for UPS's international premium lanes. The +10.7% RPP growth in International means shippers are willing to pay more for reliable cross-border logistics during trade uncertainty. NAAF Mexico is positioned to capture the nearshoring wave — but only if UPS prices it as a premium service, not a commodity. Vietnam and India lanes also growing, requiring capacity investment in Asia-Pacific hubs.",
             "recent_activity": [
                 {"action": "CFO Dykes confirmed UPS capitalized on trade lane shifts in Q1 earnings call", "actor": "UPS Earnings Call", "time": "Apr 28, 2026"},
                 {"action": "International revenue up 3.8% on 10.7% RPP growth — premium pricing holding", "actor": "UPS Finance", "time": "Q1"},
                 {"action": "NAAF Mexico capacity allocation confirmed — Aug 10 launch on track", "actor": "Network Planning", "time": "Last week"},
                 {"action": "Vietnam-to-US lane volumes up 22% QoQ — fastest growing trade corridor", "actor": "International Operations", "time": "This quarter"}
             ],
             "related_topics": ["Trade Policy", "Nearshoring", "NAAF Mexico", "Vietnam Trade Lane", "USMCA", "Premium Pricing"],
             "recommended_takeaways": [
                 {"action": "Position NAAF Mexico as a premium-priced alternative in Q3 enterprise RFPs", "reasoning": "because nearshoring is driving structural demand for cross-border Mexico logistics — pricing it as premium captures the willingness-to-pay that trade uncertainty creates.", "impact": "Establishes NAAF as a premium service from launch, protecting long-term corridor pricing power."},
                 {"action": "Invest in Asia-Pacific hub capacity to capture Vietnam and India lane growth", "reasoning": "because Vietnam lane volumes are up 22% QoQ — the fastest growing corridor — and capacity constraints will limit UPS's ability to capture the tailwind.", "impact": "Capacity expansion in Singapore and Vietnam hubs positions UPS to capture the multi-year trade rerouting trend."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Supply Chain Dive", "type": "External", "confidence": "High", "updated": "May 2026"},
                 {"name": "International Operations", "type": "Internal", "confidence": "High", "updated": "Current"}
             ],
             "confidence_description": "High confidence — earnings call data confirmed, trade lane volumes verified by internal operations.",
             "context_questions": [
                 "Which specific trade lanes saw the biggest volume shifts in Q1?",
                 "How should we price NAAF Mexico relative to existing cross-border services?",
                 "What capacity investments are needed in Vietnam and India?",
                 "Are any major customers actively nearshoring production to Mexico?"
             ]
         }},
        {"time": "14:08 ET (Jun 7)", "type": "Fuel", "title": "Middle East conflict (March 2026) drove sustained fuel cost elevation — surcharges adjusting weekly",
         "source": "UPS Q1 2026 Earnings Call · EIA weekly diesel data", "impact": "med", "conf": 1.0, "accounts": ["Portfolio"],
         "why": "Per CEO Tomé: 'The conflict in the Middle East in March drove an immediate spike in fuel costs.' UPS fuel surcharges linked to published benchmarks and adjust weekly. Some International margin pressure expected.",
         "action": "Monitor weekly fuel surcharge pass-through; preserve margin via L1 accessorial discipline.",
         "signal_enrichment": {
             "why_it_matters": "The March 2026 Middle East conflict drove an immediate spike in diesel and jet fuel costs, directly impacting UPS's operating margins. CEO Tomé called it out on the Q1 earnings call as a material cost headwind. UPS fuel surcharges are linked to published DOE benchmarks and adjust weekly — meaning the pass-through mechanism works, but with a lag. The risk is international lanes where fuel surcharge recovery is incomplete (typically 85-90% pass-through vs 95%+ domestic). Sustained fuel elevation above $4.00/gallon diesel compresses International margins by an estimated 40-60 bps.",
             "metrics": [
                 {"value": "$4.00+", "label": "Diesel price (sustained elevation)", "negative": True, "positive": False},
                 {"value": "Weekly", "label": "Surcharge adjustment frequency", "negative": False, "positive": True},
                 {"value": "85-90%", "label": "International surcharge pass-through", "negative": True, "positive": False}
             ],
             "key_insight": "The fuel surcharge mechanism mostly works domestically (95%+ pass-through), but International lanes have a structural 10-15% gap. With sustained fuel elevation, this gap compounds — every week at $4.00+ diesel without full pass-through erodes International margin. The L1 Fuel Surcharge accessorial is the primary lever. Disciplined application across all enterprise contracts is critical to maintaining margins during the elevated cost period.",
             "recent_activity": [
                 {"action": "CEO Tomé cited Middle East conflict as driver of immediate fuel cost spike on Q1 call", "actor": "UPS Earnings Call", "time": "Apr 28, 2026"},
                 {"action": "EIA weekly diesel data shows sustained elevation above $4.00/gallon since March", "actor": "EIA / Energy Markets", "time": "Current"},
                 {"action": "Revenue Management reviewing International fuel surcharge pass-through rates", "actor": "Revenue Management", "time": "This week"},
                 {"action": "L1 FSC compliance audit shows 3% of enterprise contracts with waived surcharges", "actor": "Pricing & Strategy", "time": "Last month"}
             ],
             "related_topics": ["Fuel Costs", "Surcharge Mechanism", "L1 FSC", "International Margins", "Middle East Conflict", "Diesel Prices"],
             "recommended_takeaways": [
                 {"action": "Audit and enforce L1 fuel surcharge compliance across enterprise contracts", "reasoning": "because 3% of enterprise contracts have waived surcharges — during sustained elevation, each waived surcharge directly erodes margin.", "impact": "Recovering the 3% waiver gap could add $15-25M annually to fuel surcharge revenue."},
                 {"action": "Review International fuel surcharge pass-through rates to close the 85-90% gap", "reasoning": "because the 10-15% pass-through gap on International lanes compounds weekly during sustained fuel elevation.", "impact": "Closing the pass-through gap to 95% protects International margins by an estimated 40-60 bps."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "EIA Weekly Diesel Data", "type": "External", "confidence": "Very High", "updated": "Weekly"},
                 {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — CEO statement on earnings call, EIA public data, internal compliance audit.",
             "context_questions": [
                 "Which enterprise contracts have waived fuel surcharges?",
                 "What's the current diesel price vs UPS's break-even surcharge level?",
                 "How long is the Middle East conflict expected to sustain elevated fuel costs?",
                 "Should we renegotiate International fuel surcharge terms on upcoming renewals?"
             ]
         }},
        {"time": "11:47 ET (Jun 7)", "type": "SMB", "title": "UPS SMB penetration reached record 34.5% of US volume — Digital Access Program driving acquisition",
         "source": "UPS Q1 2026 Earnings Call · Supply Chain Dive (Mar 2026)", "impact": "high", "conf": 1.0, "accounts": ["SMB segment"],
         "why": "B2B at 45.2% of US Domestic volume (6-year high). SMB ADV grew despite overall US Dom ADV down ~8% YoY. CFO Dykes: 'shippers in higher-value verticals demonstrate greater tolerance for price increases.'",
         "action": "Accelerate SMB acquisition motions; protect penetration via service-quality discipline.",
         "signal_enrichment": {
             "why_it_matters": "SMB penetration hitting 34.5% of US volume is the single strongest proof point that the Amazon replacement strategy is working. As Amazon volume exits (~500K ADV in Q1), SMB is backfilling with structurally higher-yield volume — SMB RPP is $18.40 vs Amazon's ~$8.50. B2B reached 45.2% of US Domestic volume (6-year high), confirming the mix shift. CFO Dykes's statement that 'shippers in higher-value verticals demonstrate greater tolerance for price increases' validates pricing power in the post-Amazon portfolio. DAP is the acquisition engine — 14,200 signups in Q1, 78% activation rate.",
             "metrics": [
                 {"value": "34.5%", "label": "SMB share of US volume (record)", "negative": False, "positive": True},
                 {"value": "45.2%", "label": "B2B share of US volume (6-yr high)", "negative": False, "positive": True},
                 {"value": "$18.40", "label": "SMB RPP (vs $8.50 Amazon)", "negative": False, "positive": True}
             ],
             "key_insight": "The SMB/B2B mix shift is the strategic dividend of the Amazon glide-down. At 34.5% SMB penetration and 45.2% B2B volume, UPS's US Domestic portfolio is structurally different from 2 years ago — higher-yield, more diversified, less dependent on a single customer. The pricing tolerance statement from the CFO is the most bullish signal for CCO strategy: it means the yield-over-volume approach has room to run. The risk is acquisition efficiency — CAC is rising 7.8% QoQ, meaning the cost of adding each new SMB shipper is increasing even as penetration grows.",
             "recent_activity": [
                 {"action": "SMB penetration reached record 34.5% of US volume — up from 32% a year ago", "actor": "Revenue Management", "time": "Q1"},
                 {"action": "B2B hit 45.2% of US Domestic volume — highest in 6 years", "actor": "UPS Finance", "time": "Q1"},
                 {"action": "CFO Dykes confirmed pricing tolerance in higher-value verticals on Q1 call", "actor": "UPS Earnings Call", "time": "Apr 28, 2026"},
                 {"action": "DAP signups hit 14,200 in Q1 with 78% activation rate", "actor": "Digital Commerce", "time": "Q1"}
             ],
             "related_topics": ["SMB Penetration", "B2B Growth", "Digital Access Program", "Pricing Power", "Amazon Replacement", "Mix Shift Strategy"],
             "recommended_takeaways": [
                 {"action": "Accelerate SMB acquisition through DAP while managing CAC discipline", "reasoning": "because 34.5% penetration proves the strategy works, but CAC rising 7.8% QoQ means acquisition efficiency must be monitored to keep the economics viable.", "impact": "Sustaining SMB growth trajectory toward 38% penetration by year-end while maintaining CAC below $120 per activated shipper."},
                 {"action": "Protect SMB pricing power through service-quality discipline", "reasoning": "because CFO Dykes confirmed pricing tolerance exists in higher-value verticals — but it's contingent on service quality. OTD drops would erode the premium.", "impact": "Maintains the $18.40 SMB RPP premium that makes the entire yield-over-volume strategy work."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Supply Chain Dive", "type": "External", "confidence": "High", "updated": "Mar 2026"},
                 {"name": "Digital Commerce Analytics", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — public earnings data confirmed by internal revenue management.",
             "context_questions": [
                 "What's the DAP activation rate trend — is 78% sustainable as volume grows?",
                 "Which SMB verticals show the highest pricing tolerance?",
                 "How does SMB churn rate compare to enterprise accounts?",
                 "What's the CAC breakdown by acquisition channel?"
             ]
         }},
        {"time": "09:22 ET (Jun 7)", "type": "Policy", "title": "USPS Ground Saver final-mile agreement formalized — 2026 launch; volume down 27.7% in Q1",
         "source": "UPS FY 2025 10-K · UPS Q1 2026 Earnings Call", "impact": "med", "conf": 1.0, "accounts": ["Ground Saver product"],
         "why": "Cost increases applied; Ground Saver ADV declined 27.7% in Q1. UPS retained higher-yield Ground Saver volume in-network; lower-cost USPS-delivered portion. Margin-led portfolio decision.",
         "action": "Track Ground Saver yield improvement; monitor SMB volume migration to UPS Ground.",
         "signal_enrichment": {
             "why_it_matters": "Ground Saver volume declined 27.7% in Q1 — a deliberately engineered outcome. UPS applied cost increases to the USPS-delivered final-mile portion, effectively pricing out low-margin volume while retaining higher-yield Ground Saver packages delivered on the UPS network. This is the yield-over-volume strategy applied at the product level: fewer packages, better margin per package. The retained Ground Saver volume has estimated RPP of $12.80 vs $7.20 for the USPS-delivered portion that exited. The risk is that some SMB shippers who relied on Ground Saver's low-cost option may migrate to FedEx SmartPost or regional alternatives.",
             "metrics": [
                 {"value": "-27.7%", "label": "Ground Saver ADV decline Q1", "negative": False, "positive": True},
                 {"value": "$12.80", "label": "Retained Ground Saver RPP", "negative": False, "positive": True},
                 {"value": "$7.20", "label": "Exited USPS-delivered RPP", "negative": False, "positive": False}
             ],
             "key_insight": "The 27.7% volume decline looks alarming on the surface but is actually a successful execution of margin-led portfolio pruning. The retained volume at $12.80 RPP generates nearly double the revenue per piece vs the exited $7.20 USPS-delivered portion. The insourcing of Ground Saver delivery onto UPS's own network also gives UPS full control over service quality — important for SMB customers who value reliability. Monitor for volume migration to FedEx SmartPost, which offers similar economics.",
             "recent_activity": [
                 {"action": "Ground Saver ADV declined 27.7% in Q1 as cost increases took effect", "actor": "Revenue Management", "time": "Q1"},
                 {"action": "USPS final-mile agreement formalized with new cost structure for 2026", "actor": "Strategy & Partnerships", "time": "Q1"},
                 {"action": "Ground Saver insourcing at 78% completion — ahead of mid-year target", "actor": "Network Operations", "time": "Current"},
                 {"action": "3 SMB accounts flagged considering FedEx SmartPost as Ground Saver alternative", "actor": "Enterprise Sales", "time": "This month"}
             ],
             "related_topics": ["Ground Saver", "USPS Partnership", "Product Portfolio", "Margin Optimization", "SMB Migration Risk", "Insourcing"],
             "recommended_takeaways": [
                 {"action": "Track Ground Saver yield improvement and ensure retained volume maintains $12.80+ RPP", "reasoning": "because the strategic value of the volume decline depends on the retained portfolio maintaining its yield premium.", "impact": "Confirms the margin-led portfolio decision is delivering expected results."},
                 {"action": "Monitor SMB migration to FedEx SmartPost or regional alternatives", "reasoning": "because 3 SMB accounts are already considering alternatives — early intervention prevents a trend.", "impact": "Retaining at-risk SMB accounts protects the Ground Saver yield improvement from being offset by customer losses."}
             ],
             "data_sources": [
                 {"name": "UPS FY 2025 10-K", "type": "External", "confidence": "Very High", "updated": "FY 2025"},
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Revenue Management", "type": "Internal", "confidence": "High", "updated": "Real-time"}
             ],
             "confidence_description": "Very high confidence — SEC filing and earnings call data, confirmed by internal revenue management.",
             "context_questions": [
                 "Which SMB customers are most at risk of migrating from Ground Saver?",
                 "What's the insourcing completion timeline for Ground Saver?",
                 "How does the retained Ground Saver RPP compare to UPS Ground?",
                 "Is FedEx SmartPost actively targeting our Ground Saver customer base?"
             ]
         }},
        {"time": "08:52 ET", "type": "Competitor", "title": "FedEx Auto Express launches NAAF Mexico cross-border lane — 8% below UPS list",
         "source": "FreightWaves (Jun 5, 2026)", "impact": "high", "conf": 0.90, "accounts": ["Ford", "Stellantis", "Honda", "Toyota", "Magna"],
         "why": "FedEx targeting USMCA-driven nearshoring volume with aggressive pricing. Direct threat on Ford BlueOval City inbound corridor, Stellantis Toluca outbound, Magna's Tier-1 NAAF expansion. UPS NAAF Mexico launches August — risk that FedEx pre-locks volume.",
         "action": "Pre-lock NAAF capacity for Ford and Stellantis within 5 business days; activate executive engagement on Magna.",
         "signal_enrichment": {
             "why_it_matters": "FedEx Auto Express is priced 8% below UPS list rates on Mexico cross-border lanes — a deliberate undercut targeting USMCA-driven nearshoring volume. Five of UPS's top automotive accounts (Ford, Stellantis, Honda, Toyota, Magna) are directly affected. FedEx launches August 4, six days before UPS NAAF Mexico (Aug 10). The combination of earlier launch timing AND lower pricing creates a significant first-mover risk. Ford's BlueOval City inbound corridor, Stellantis Toluca outbound, and Magna's Tier-1 NAAF expansion are the three most exposed lanes.",
             "metrics": [
                 {"value": "8%", "label": "FedEx price undercut vs UPS list", "negative": True, "positive": False},
                 {"value": "6 days", "label": "FedEx launch lead time", "negative": True, "positive": False},
                 {"value": "5", "label": "Top accounts directly threatened", "negative": True, "positive": False}
             ],
             "key_insight": "The 8% undercut is aggressive but not insurmountable — UPS's NAAF offers 1-/2-/3-day tiered service vs FedEx's 2-day only, plus integrated customs brokerage. The real risk is timing: if FedEx locks capacity commitments with Ford and Stellantis before Aug 10, UPS NAAF launches into a market where the premium accounts are already contracted. The counter-strategy: pre-lock capacity guarantees with top 5 accounts within 5 business days, emphasizing the multi-service integration that FedEx cannot match.",
             "recent_activity": [
                 {"action": "FreightWaves reported FedEx Auto Express pricing at 8% below UPS list on Mexico lanes", "actor": "FreightWaves", "time": "Jun 5, 2026"},
                 {"action": "FedEx pre-launch marketing targeting Ford, Stellantis, and Magna plant managers", "actor": "Competitive Intelligence", "time": "This week"},
                 {"action": "UPS NAAF Mexico capacity allocation at 85% readiness", "actor": "Network Planning", "time": "Current"},
                 {"action": "Honda North America logistics team requested competitive pricing comparison", "actor": "Enterprise Sales", "time": "Yesterday"}
             ],
             "related_topics": ["FedEx Auto Express", "NAAF Mexico", "Cross-Border Pricing", "Capacity Pre-Lock", "Automotive Accounts", "Competitive Response"],
             "recommended_takeaways": [
                 {"action": "Pre-lock NAAF capacity for Ford and Stellantis within 5 business days", "reasoning": "because FedEx launches 6 days ahead — capacity commitments made before Aug 4 prevent FedEx from locking these accounts first.", "impact": "Secures the two largest automotive corridor accounts before FedEx's competitive window opens."},
                 {"action": "Lead counter-proposals with 1-day express tier + customs brokerage integration", "reasoning": "because FedEx offers 2-day only without integrated customs — UPS's tiered service and same-day customs clearance are hard differentiators.", "impact": "Shifts competitive conversation from price (where FedEx is 8% lower) to capability (where UPS is superior)."},
                 {"action": "Activate executive engagement on Magna and Honda immediately", "reasoning": "because Honda is already requesting competitive pricing comparison and Magna's expansion creates an open carrier selection window.", "impact": "Proactive engagement at 2 additional accounts prevents FedEx from expanding beyond Ford/Stellantis."}
             ],
             "data_sources": [
                 {"name": "FreightWaves", "type": "External", "confidence": "High", "updated": "Jun 5, 2026"},
                 {"name": "Competitive Intelligence", "type": "Internal", "confidence": "Medium", "updated": "This week"},
                 {"name": "Enterprise Sales", "type": "Internal", "confidence": "High", "updated": "Yesterday"}
             ],
             "confidence_description": "Moderate-high confidence — pricing intel from trade publication, corroborated by competitive intelligence field reports.",
             "context_questions": [
                 "Can we soft-launch NAAF for top 3 accounts before the Aug 10 official date?",
                 "What's FedEx Auto Express's actual service level vs the marketing claims?",
                 "Should we match the 8% undercut selectively or hold premium pricing?",
                 "Which corridors does FedEx Auto Express NOT cover that NAAF does?"
             ]
         }},
        {"time": "07:48 ET", "type": "Board", "title": "Board pre-read due Jun 11 — FY26 mid-year revenue and margin recovery view",
         "source": "Corporate Secretary calendar · Board cadence", "impact": "high", "conf": 1.0, "accounts": ["Board · CCO submission"],
         "why": "Board meets Jun 18, 2026. CCO pre-read deck due Jun 11 covering: US Domestic margin recovery path, Healthcare $20B trajectory, SMB acquisition velocity, the 5 reversed-trend Auto accounts plan, FedEx Freight spin-off competitive response.",
         "action": "Finalize CCO board narrative this week — Automotive ABM plan + Enterprise pricing discipline are the two anchor stories.",
         "signal_enrichment": {
             "why_it_matters": "The June 18 board meeting is the mid-year checkpoint where the CCO's strategic narrative will be evaluated against results. The pre-read deck due June 11 must cover five critical areas: (1) US Domestic margin recovery from 4.0% toward the 7.5–8.5% Q2 target, (2) Healthcare's trajectory toward the $20B FY late-2026 target, (3) SMB acquisition velocity and DAP performance, (4) the Automotive ABM plan including the 5 reversed-trend accounts, and (5) the competitive response to FedEx Freight spin-off and Auto Express. This is Matt Guffey's opportunity to anchor the board around the yield-over-volume narrative with concrete Q1 proof points.",
             "metrics": [
                 {"value": "Jun 11", "label": "Pre-read deck deadline", "negative": False, "positive": False},
                 {"value": "Jun 18", "label": "Board meeting date", "negative": False, "positive": False},
                 {"value": "5", "label": "Critical narrative areas to cover", "negative": False, "positive": False}
             ],
             "key_insight": "The board narrative needs to accomplish two things: (1) explain why Q1 margin at 4.0% is transitional, not structural (cite the $350M one-time costs), and (2) demonstrate that the yield-over-volume strategy is producing durable results (cite $15.32 RPP, 34.5% SMB penetration, $3B healthcare quarter). The Automotive ABM plan and Enterprise pricing discipline are the two anchor stories because they show concrete commercial execution, not just financial metrics.",
             "recent_activity": [
                 {"action": "Board meeting confirmed for Jun 18, 2026 — CCO pre-read due Jun 11", "actor": "Corporate Secretary", "time": "Standing cadence"},
                 {"action": "Finance team prepared Q1 margin bridge showing $350M transitional cost breakdown", "actor": "Finance & Strategy", "time": "This week"},
                 {"action": "Healthcare team confirmed $3.04B Q1 milestone for board deck", "actor": "Healthcare Logistics", "time": "This week"},
                 {"action": "Automotive ABM team compiling 5 reversed-trend accounts summary", "actor": "ABM Strategy", "time": "In progress"}
             ],
             "related_topics": ["Board Meeting", "CCO Pre-Read", "Strategic Narrative", "Margin Recovery", "Healthcare Target", "Automotive ABM"],
             "recommended_takeaways": [
                 {"action": "Finalize the CCO board narrative with Automotive ABM + Enterprise pricing as anchor stories", "reasoning": "because these two areas demonstrate the most concrete commercial execution — the board wants proof of strategy execution, not just financial results.", "impact": "Strong CCO narrative maintains board confidence in the yield-over-volume strategy and secures continued investment in ABM and NAAF."},
                 {"action": "Include the FedEx competitive response plan in the pre-read deck", "reasoning": "because the FedEx Freight spin-off and Auto Express launch are the board's top competitive concern — addressing it proactively prevents a reactive Q&A dynamic.", "impact": "Board enters the meeting with confidence that UPS has a clear competitive counter-strategy."}
             ],
             "data_sources": [
                 {"name": "Corporate Secretary Calendar", "type": "Internal", "confidence": "Very High", "updated": "Standing"},
                 {"name": "Board Cadence", "type": "Internal", "confidence": "Very High", "updated": "Standing"}
             ],
             "confidence_description": "Very high confidence — board calendar is fixed, pre-read deadline confirmed.",
             "context_questions": [
                 "What's the status of the Automotive ABM 5 reversed-trend accounts summary?",
                 "Has finance finalized the Q1 margin bridge for the board deck?",
                 "What competitive response narrative should we lead with — NAAF or pricing discipline?",
                 "Are there any board member concerns we should proactively address?"
             ]
         }},
        {"time": "07:14 ET", "type": "Enterprise", "title": "Q2 Enterprise deal pipeline +18% sequentially — 4 strategic renewals due before Q3 close",
         "source": "Salesforce CRM · Deal Manager (AI)", "impact": "high", "conf": 0.95, "accounts": ["Toyota", "CVS Health", "Walgreens", "Boeing"],
         "why": "Toyota Renewal-2026 (Packet 10474, $185M), CVS Health Healthcare-2026 ($94M), Walgreens RFP ($72M), Boeing AOG-renewal ($58M) all touch DA L0/L1/L2 levers. Toyota S3 recommended +$10.5M profit; CVS at modeled TARGET 81.1%.",
         "action": "Run Deal Workbench against the 4-packet bundle; align L2 ceiling posture before Toyota counter-proposal due Jun 12.",
         "signal_enrichment": {
             "why_it_matters": "The Q2 enterprise deal pipeline grew 18% sequentially — the strongest pipeline growth in 4 quarters. Four strategic renewals collectively worth $409M in annual revenue must close before Q3: Toyota ($185M, Packet #10474), CVS Health ($94M), Walgreens ($72M), and Boeing ($58M). Each touches Deal Analyser pricing levers (L0 DIM Divisor, L1 Basic/Accessorials, L2 Tier Incentives). Toyota's recommended S3 scenario delivers +$10.5M incremental profit. CVS is at modeled TARGET 81.1%. These four deals will define Q3 enterprise revenue and margin trajectory.",
             "metrics": [
                 {"value": "+18%", "label": "Pipeline growth (sequential)", "negative": False, "positive": True},
                 {"value": "$409M", "label": "Combined renewal value", "negative": False, "positive": True},
                 {"value": "+$10.5M", "label": "Toyota S3 profit lift", "negative": False, "positive": True}
             ],
             "key_insight": "Four deals, $409M total, all closing before Q3 — this is the most concentrated strategic renewal window in 3 years. Toyota S3 (+$10.5M profit) sets the pricing benchmark: L0 DIM 150→156, L2 reshape, L4 raised. If Toyota accepts S3, the pricing posture validates and cascades to CVS and Walgreens. If Toyota counters below S3, it signals pricing resistance that will affect all four deals. The Jun 12 Toyota counter-proposal deadline is the inflection point for the entire Q3 enterprise strategy.",
             "recent_activity": [
                 {"action": "Q2 enterprise pipeline confirmed at +18% sequential growth — AI Deal Manager report", "actor": "Salesforce CRM / Deal Manager", "time": "This week"},
                 {"action": "Toyota counter-proposal expected by Jun 12 — S3 scenario (+$10.5M) recommended", "actor": "Enterprise Sales — Auto", "time": "Deadline Jun 12"},
                 {"action": "CVS Health Healthcare-2026 negotiations progressing — modeled at TARGET 81.1%", "actor": "Enterprise Sales — Healthcare", "time": "Active"},
                 {"action": "Boeing AOG-renewal under review — critical time-sensitive delivery requirements", "actor": "Enterprise Sales — Aerospace", "time": "Active"}
             ],
             "related_topics": ["Enterprise Pipeline", "Deal Analyser", "Toyota Renewal", "CVS Health", "Walgreens RFP", "Boeing AOG", "Pricing Levers"],
             "recommended_takeaways": [
                 {"action": "Run Deal Workbench against the 4-packet bundle to model combined impact", "reasoning": "because the four deals interact — Toyota's pricing posture sets the benchmark for CVS and Walgreens, and combined margin impact must be modeled holistically.", "impact": "Holistic 4-deal model enables coordinated pricing strategy that maximizes combined margin across $409M in revenue."},
                 {"action": "Align L2 ceiling posture before the Toyota counter-proposal due Jun 12", "reasoning": "because Toyota's response to S3 will cascade to the other three deals — the L2 ceiling position must be firm before the counter arrives.", "impact": "Firm L2 posture on Toyota protects the $10.5M profit lift and sets the pricing floor for CVS, Walgreens, and Boeing."}
             ],
             "data_sources": [
                 {"name": "Salesforce CRM", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                 {"name": "AI Deal Manager", "type": "Internal", "confidence": "High", "updated": "This week"},
                 {"name": "Enterprise Sales", "type": "Internal", "confidence": "High", "updated": "Active"}
             ],
             "confidence_description": "High confidence — CRM pipeline data confirmed by Deal Manager AI analysis and account team verification.",
             "context_questions": [
                 "What's Toyota's likely response to the S3 scenario?",
                 "How does CVS Healthcare-2026 pricing compare to the current contract?",
                 "What's Boeing's AOG delivery time sensitivity and how does it affect pricing?",
                 "Should we offer a multi-year discount on any of the four renewals?"
             ]
         }},
        {"time": "06:34 ET", "type": "Volume", "title": "Amazon glide-down on track — Q1 volume reduced 500K ADV; on path to ~half by Jun 2026",
         "source": "UPS Q1 2026 Earnings Call · Supply Chain Dive (May 2026)", "impact": "high", "conf": 1.0, "accounts": ["Portfolio · capacity"],
         "why": "Amazon was 10.6% of FY25 revenue; targeted to be roughly half by mid-2026. Freed network capacity (~700K ADV by end Q2) is the structural enabler for SMB / Healthcare / Automotive pricing power. CFO Dykes: pricing tolerance is the strategic dividend.",
         "action": "Confirm capacity reallocation hitting SMB and Healthcare growth engines; protect against Amazon volume re-entry overtures.",
         "signal_enrichment": {
             "why_it_matters": "This signal reinforces the Amazon glide-down trajectory with additional context on capacity reallocation. The ~700K ADV freed by end of Q2 is not just empty capacity — it's the structural enabler for everything else in the CCO strategy. Without freed capacity, UPS cannot selectively onboard higher-yield SMB and Healthcare volume. CFO Dykes's statement about 'pricing tolerance as the strategic dividend' is the clearest articulation of why the Amazon exit creates long-term value: the freed network capacity gives UPS the ability to be selective, which gives them pricing power.",
             "metrics": [
                 {"value": "500K ADV", "label": "Q1 Amazon volume reduced", "negative": False, "positive": True},
                 {"value": "~700K ADV", "label": "Total capacity freed by Q2 end", "negative": False, "positive": True},
                 {"value": "10.6%→~5%", "label": "Amazon revenue share trajectory", "negative": False, "positive": True}
             ],
             "key_insight": "The Amazon glide-down completion by June 2026 marks a structural inflection point for UPS. Post-completion, UPS will have permanently replaced its largest low-margin customer with a diversified, higher-yield portfolio. The key risk post-completion: Amazon may attempt to re-enter with volume commitments at better rates, especially as they expand Amazon Logistics capabilities. The CCO must maintain discipline against re-entry overtures.",
             "recent_activity": [
                 {"action": "Q1 earnings confirmed 500K ADV reduction — on track for ~50% Amazon reduction by June", "actor": "UPS Finance", "time": "Apr 28, 2026"},
                 {"action": "CFO Dykes: 'pricing tolerance is the strategic dividend' of capacity selectivity", "actor": "UPS Earnings Call", "time": "Apr 28, 2026"},
                 {"action": "Network planning confirmed 700K ADV capacity will be available by end of Q2", "actor": "Network Planning", "time": "Last week"},
                 {"action": "Amazon Logistics expanding same-day capabilities in 15 metro areas", "actor": "Competitive Intelligence", "time": "This month"}
             ],
             "related_topics": ["Amazon Glide-Down", "Capacity Freedom", "Pricing Power", "SMB Backfill", "Network Selectivity", "Amazon Re-Entry Risk"],
             "recommended_takeaways": [
                 {"action": "Confirm capacity reallocation plans are actively filling freed Amazon lanes with SMB/Healthcare", "reasoning": "because freed capacity without reallocation becomes fixed-cost drag — each empty lane erodes margins.", "impact": "Active reallocation protects US Domestic margin trajectory and validates the yield-over-volume strategy."},
                 {"action": "Establish a formal policy against Amazon volume re-entry at below-threshold rates", "reasoning": "because Amazon will likely attempt to re-enter with volume commitments — a formal policy prevents reactive decision-making.", "impact": "Protects the strategic dividend of pricing selectivity that the entire FY26 strategy is built on."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Supply Chain Dive", "type": "External", "confidence": "High", "updated": "May 2026"},
                 {"name": "Network Planning", "type": "Internal", "confidence": "High", "updated": "Last week"}
             ],
             "confidence_description": "Very high confidence — earnings call data, SEC filings, and internal network planning alignment.",
             "context_questions": [
                 "What percentage of freed Amazon capacity has been reallocated so far?",
                 "Has Amazon made any volume re-entry overtures since Q1?",
                 "Which metro areas are Amazon Logistics expanding into and does it affect UPS?",
                 "What's the minimum acceptable rate if Amazon wants to keep volume?"
             ]
         }},
        {"time": "05:48 ET", "type": "SMB", "title": "Digital Access Program acquired record SMB count in Q1 — 34.5% penetration, +260 bps QoQ",
         "source": "UPS Q1 2026 Earnings Call · Supply Chain Dive (Mar 2026)", "impact": "high", "conf": 1.0, "accounts": ["SMB segment"],
         "why": "B2B at 45.2% (6-year high). SMB ADV grew despite total US Dom ADV down 8% YoY. Higher-yield mix shift accelerating. Customers in healthcare + auto verticals showing greater pricing tolerance — RPP +6.5% YoY.",
         "action": "Accelerate SMB acquisition motions through Digital Access Program; protect penetration via service-quality discipline and field-level engagement.",
         "signal_enrichment": {
             "why_it_matters": "The Digital Access Program achieved record SMB acquisition in Q1 — 14,200 new signups, 78% 14-day activation rate, and 34.5% US volume penetration (+260 bps QoQ). DAP is the most efficient acquisition channel at $58 CAC vs $142 for field sales and $94 for paid digital. Shopify integration v2 launched with 3× v1 adoption. Amazon Seller Central integration approved for Q3 — projected 3,000-5,000 new shippers in 90 days. RPP across the SMB segment grew 6.5% YoY to $18.40, confirming pricing power in higher-value verticals.",
             "metrics": [
                 {"value": "14,200", "label": "Q1 DAP signups (record)", "negative": False, "positive": True},
                 {"value": "78%", "label": "14-day activation rate", "negative": False, "positive": True},
                 {"value": "+6.5%", "label": "SMB RPP growth YoY", "negative": False, "positive": True}
             ],
             "key_insight": "DAP is compounding — 28% QoQ signup growth with improving unit economics ($58 CAC vs $142 field sales). The Shopify v2 integration is the breakout channel (3× v1 adoption), and the Amazon Seller Central integration (Q3 launch) could add 3,000-5,000 new shippers — the largest single-channel addition possible. At +260 bps QoQ penetration growth, SMB will reach 38% by Q4 if momentum holds, fundamentally reshaping UPS's volume mix away from Amazon dependency.",
             "recent_activity": [
                 {"action": "DAP achieved record 14,200 signups in Q1 — 28% QoQ growth", "actor": "Digital Commerce", "time": "Q1"},
                 {"action": "Shopify integration v2 launched with 3× v1 early adoption", "actor": "Platform Partnerships", "time": "1 week ago"},
                 {"action": "Amazon Seller Central integration approved for Q3 launch", "actor": "Product Development", "time": "2 weeks ago"},
                 {"action": "SMB RPP reached $18.40 — +6.5% YoY, driven by healthcare and auto verticals", "actor": "Revenue Management", "time": "Q1"}
             ],
             "related_topics": ["Digital Access Program", "SMB Acquisition", "Shopify Integration", "Amazon Seller Central", "RPP Growth", "Marketplace Partnerships"],
             "recommended_takeaways": [
                 {"action": "Fast-track the Amazon Seller Central integration for Q3 launch", "reasoning": "because 3,000-5,000 projected new shippers in 90 days represents the single largest DAP growth lever available.", "impact": "Pulls forward the biggest single-channel acquisition opportunity for Amazon volume replacement."},
                 {"action": "Approve the $4.2M field-to-DAP budget reallocation", "reasoning": "because DAP delivers 2.4× marginal ROI vs field sales — every dollar shifted accelerates SMB penetration growth at lower cost.", "impact": "Funds 6,000+ additional incentivized activations before peak season."}
             ],
             "data_sources": [
                 {"name": "UPS Q1 2026 Earnings Call", "type": "External", "confidence": "Very High", "updated": "Apr 28, 2026"},
                 {"name": "Digital Commerce Analytics", "type": "Internal", "confidence": "High", "updated": "Real-time"},
                 {"name": "Platform Partnerships", "type": "Internal", "confidence": "High", "updated": "Current"}
             ],
             "confidence_description": "Very high confidence — DAP platform data confirmed by earnings disclosure and internal analytics.",
             "context_questions": [
                 "What's the Amazon Seller Central integration timeline and expected ramp curve?",
                 "How does DAP shipper 90-day retention compare to field-sales acquired accounts?",
                 "Which Shopify verticals show the highest DAP activation rates?",
                 "What first-shipment incentive level ($25 vs $50-75) optimizes lifetime value?"
             ]
         }},
    ]
    for sig in market_signals:
        db.add(AutoMarketSignal(**sig))

    # ── Automotive Initiatives ──
    auto_initiatives = [
        {"title": "NAAF Mexico Readiness", "pct": 72, "items": [
            {"label": "Lane capacity allocation", "done": True},
            {"label": "Customs brokerage integration", "done": True},
            {"label": "Pricing models loaded into DA", "done": False},
            {"label": "Sales enablement complete", "done": False},
        ], "cta": "View NAAF dashboard"},
        {"title": "Ground Freight Pricing", "pct": 45, "items": [
            {"label": "Threshold analysis complete", "done": True},
            {"label": "Segment eligibility defined", "done": False},
            {"label": "DA scenario templates built", "done": False},
            {"label": "Pilot accounts selected", "done": False},
        ], "cta": "Review pricing model"},
        {"title": "Industry Expert Deployment", "pct": 60, "items": [
            {"label": "Detroit hub staffed (4/6)", "done": True},
            {"label": "Monterrey hub staffed (2/4)", "done": True},
            {"label": "Training certification", "done": False},
            {"label": "Account assignments finalized", "done": False},
        ], "cta": "View staffing plan"},
    ]
    for ini in auto_initiatives:
        db.add(AutoInitiative(**ini))

    # ── Enterprise KPIs ──
    ent_kpis = [
        {"label": "Enterprise Revenue, YTD", "value": "$9.42B", "delta": "+1.4%", "delta_label": "vs PY · FY on track", "status": "ok", "sub": "Adj. for Amazon glide-down", "sort_order": 1},
        {"label": "Enterprise ADV", "value": "2.18M", "delta": "-2.1%", "delta_label": "pieces/day", "status": "warn", "sub": "Mix shift to higher-margin", "sort_order": 2},
        {"label": "Enterprise RPP", "value": "$23.84", "delta": "+6.5%", "delta_label": "vs PY · pricing power", "status": "ok", "sub": "Lifts driving quality of rev", "sort_order": 3},
        {"label": "Enterprise Op. Margin", "value": "6.2%", "delta": "-180 bps", "delta_label": "rebuild path Q3", "status": "warn", "sub": "Concession leakage is fixable", "sort_order": 4},
        {"label": "Win Rate (90d)", "value": "68%", "delta": "+4 pp", "delta_label": "Deal Mgr AI · 92% adopt.", "status": "ok", "sub": "New Logo 51% · Renewal 84%", "sort_order": 5},
        {"label": "Deal Pipeline · QTD", "value": "$1.42B", "delta": "+8.6%", "delta_label": "$ in negotiation", "status": "ok", "sub": "$684M closed · $112M slipped", "sort_order": 6},
    ]
    for k in ent_kpis:
        db.add(EnterpriseKPI(**k))

    # ── DA Packets ──
    da_packets = [
        {"packet_id": 10474, "customer": "Toyota Motor North America", "hierarchy": "Parent", "ref_num": "0000018472", "sub_ind": "Automotive - OEM", "analyst": "P. Subramaniam (Sr.)", "pld_source": "52 weeks - GCPR", "construct": "Daily",
         "bids": ["P200041288 - TMC-Renewal-2026", "P200041315 - TMC-NAAF-MX-Addendum"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "52-week history - current terms", "adv": 8.4, "baseDisc": 64.2, "totalDisc": 65.8, "rpp": 24.18, "rev": 168.4, "or": 0.58, "profit": 70.7, "modeledTier": "TARGET 81.1%"},
             {"name": "S1 - Renewal lift +2pp", "desc": "L2 Tier ceiling raised", "adv": 8.4, "baseDisc": 64.2, "totalDisc": 65.8, "rpp": 24.62, "rev": 171.4, "or": 0.57, "profit": 73.7, "modeledTier": "TARGET 83.0%"},
             {"name": "S2 - NAAF capacity bundle", "desc": "L1 + L4 floor adjustment", "adv": 8.5, "baseDisc": 63.8, "totalDisc": 65.0, "rpp": 24.84, "rev": 175.6, "or": 0.56, "profit": 77.3, "modeledTier": "TARGET 83.0%"},
             {"name": "S3 - Recommended", "desc": "L0 DIM 150-156 - L2 reshape - L4 raised", "adv": 8.4, "baseDisc": 62.0, "totalDisc": 63.5, "rpp": 24.92, "rev": 184.6, "or": 0.56, "profit": 81.2, "modeledTier": "TARGET 83.0%", "isBest": True},
         ],
         "delta_profit": 10.5, "bid_value": 185, "levers_touched": ["L0","L1-Zone","L1-FSC","L2","L4"], "status": "Pricing Review", "urgency": "med", "last_update": "Jun 6, 16:42", "workstream": "Renewal"},

        {"packet_id": 10892, "customer": "Magna International", "hierarchy": "Parent", "ref_num": "0000045129", "sub_ind": "Automotive - Tier-1", "analyst": "L. Park", "pld_source": "52 weeks + Opportunity PLD", "construct": "Daily",
         "bids": ["NEW - Magna-NAAF-Mexico-Pen"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "Existing penetration baseline", "adv": 0, "baseDisc": 0, "totalDisc": 0, "rpp": 0, "rev": 0, "or": 0, "profit": 0, "modeledTier": "-"},
             {"name": "S1 - NAAF premium pricing", "desc": "L0 DIM 162 - L1 zone floors", "adv": 3.8, "baseDisc": 41.2, "totalDisc": 44.5, "rpp": 27.20, "rev": 24.6, "or": 0.64, "profit": 8.9, "modeledTier": "TARGET 66.8%"},
             {"name": "S2 - Recommended", "desc": "L0 162 - L1 + L4 - brokerage bundle", "adv": 4.2, "baseDisc": 38.8, "totalDisc": 41.5, "rpp": 28.40, "rev": 28.1, "or": 0.62, "profit": 10.7, "modeledTier": "TARGET 81.1%", "isBest": True},
         ],
         "delta_profit": 10.7, "bid_value": 28, "levers_touched": ["L0","L1-Zone","L2","L4"], "status": "Customer Counter", "urgency": "low", "last_update": "Jun 7, 09:08", "workstream": "Penetration"},

        {"packet_id": 11034, "customer": "Stellantis North America", "hierarchy": "Parent", "ref_num": "0000028119", "sub_ind": "Automotive - OEM", "analyst": "R. Goyal", "pld_source": "Opportunity PLD only", "construct": "Daily",
         "bids": ["NEW - Stellantis-Toluca-Corridor"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "No existing baseline", "adv": 0, "baseDisc": 0, "totalDisc": 0, "rpp": 0, "rev": 0, "or": 0, "profit": 0, "modeledTier": "-"},
             {"name": "S1 - Aggressive entry", "desc": "L0 DIM 145 - L1 FSC -25% - L2 stretched", "adv": 6.2, "baseDisc": 71.4, "totalDisc": 73.8, "rpp": 22.40, "rev": 48.6, "or": 0.71, "profit": 14.1, "modeledTier": "TARGET 119%"},
             {"name": "S2 - Parity posture", "desc": "L0 DIM 150 - L1 zone-tight - L4 floor", "adv": 6.2, "baseDisc": 66.1, "totalDisc": 68.4, "rpp": 23.80, "rev": 51.7, "or": 0.68, "profit": 16.5, "modeledTier": "TARGET 81.1%", "isBest": True},
             {"name": "S3 - Premium NAAF-led", "desc": "L0 156 - L1 NAAF surcharge intact", "adv": 5.4, "baseDisc": 58.2, "totalDisc": 60.4, "rpp": 26.10, "rev": 42.8, "or": 0.64, "profit": 15.4, "modeledTier": "TARGET 66.8%"},
         ],
         "delta_profit": 16.5, "bid_value": 48, "levers_touched": ["L0","L1-Zone","L1-FSC","L2","L4"], "status": "Building Scenarios", "urgency": "high", "last_update": "Jun 7, 18:14", "workstream": "New Logo"},

        {"packet_id": 10755, "customer": "Lear Corporation", "hierarchy": "Parent", "ref_num": "0000038201", "sub_ind": "Automotive - Tier-1", "analyst": "M. Chen", "pld_source": "52 weeks - GCPR", "construct": "Daily",
         "bids": ["P200040611 - Lear 2024", "P200041422 - Lear Save-Play"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "Customer is comparing to FedEx counter", "adv": 4.8, "baseDisc": 68.4, "totalDisc": 70.1, "rpp": 22.10, "rev": 76.2, "or": 0.64, "profit": 27.4, "modeledTier": "TARGET 81.1%"},
             {"name": "S1 - Match counter", "desc": "L1 FSC -3pp - L2 tier raise - L4 unchanged", "adv": 4.8, "baseDisc": 71.2, "totalDisc": 73.0, "rpp": 21.20, "rev": 73.4, "or": 0.66, "profit": 24.9, "modeledTier": "TARGET 119%"},
             {"name": "S2 - Recommended save", "desc": "L0 158 - L1-DAS only - L4 raised", "adv": 4.9, "baseDisc": 67.8, "totalDisc": 68.4, "rpp": 22.50, "rev": 78.2, "or": 0.63, "profit": 28.9, "modeledTier": "TARGET 81.1%", "isBest": True},
         ],
         "delta_profit": 1.5, "bid_value": 76, "levers_touched": ["L0","L1-FSC","L1-DAS","L2","L4"], "status": "Customer Counter", "urgency": "med", "last_update": "Jun 7, 14:33", "workstream": "Retention"},

        {"packet_id": 10612, "customer": "Aptiv PLC", "hierarchy": "Parent", "ref_num": "0000051840", "sub_ind": "Automotive - Tier-1", "analyst": "L. Park", "pld_source": "52 weeks + Opportunity PLD", "construct": "Daily",
         "bids": ["P200040918 - Aptiv 2024", "NEW - Aptiv-Capital-Bundle"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "Existing terms", "adv": 3.1, "baseDisc": 59.2, "totalDisc": 60.8, "rpp": 26.40, "rev": 18.4, "or": 0.59, "profit": 7.5, "modeledTier": "TARGET 81.1%"},
             {"name": "S1 - Bundle attach", "desc": "L1 zone reshape + Capital cross-sell", "adv": 3.4, "baseDisc": 57.8, "totalDisc": 59.4, "rpp": 27.10, "rev": 22.0, "or": 0.58, "profit": 9.2, "modeledTier": "TARGET 81.1%", "isBest": True},
         ],
         "delta_profit": 1.7, "bid_value": 22, "levers_touched": ["L1-Zone","L2"], "status": "Approved", "urgency": "low", "last_update": "Jun 7, 11:50", "workstream": "Penetration"},

        {"packet_id": 10941, "customer": "AutoZone", "hierarchy": "Parent", "ref_num": "0000067577", "sub_ind": "Automotive - Aftermarket", "analyst": "T. Whitaker", "pld_source": "52 weeks - GCPR", "construct": "Daily",
         "bids": ["P200040711 - AZO 2024 Renewal", "P960040887 - Returns Program"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "Matches against FedEx counter offer", "adv": 5.1, "baseDisc": 66.3, "totalDisc": 66.8, "rpp": 31.62, "rev": 41.2, "or": 0.66, "profit": 14.0, "modeledTier": "TARGET 81.1%"},
             {"name": "S1 - Match FedEx", "desc": "L1 zone -3pp - L2 tier ceiling +5pp - L4 lowered", "adv": 5.1, "baseDisc": 68.8, "totalDisc": 69.4, "rpp": 30.80, "rev": 40.1, "or": 0.68, "profit": 12.8, "modeledTier": "TARGET 119%"},
             {"name": "S2 - Save + bundle", "desc": "L1 zone -2pp - L2 ceiling +3pp - Happy Returns attach", "adv": 5.3, "baseDisc": 67.6, "totalDisc": 68.4, "rpp": 31.10, "rev": 43.4, "or": 0.67, "profit": 14.4, "modeledTier": "TARGET 81.1%"},
             {"name": "S3 - OVERRIDE pending", "desc": "Analyst-recommended floor breached - CCO sign-off", "adv": 5.1, "baseDisc": 69.5, "totalDisc": 70.2, "rpp": 30.40, "rev": 39.4, "or": 0.70, "profit": 11.8, "modeledTier": "TARGET 143%", "isOverride": True, "isBest": True},
         ],
         "delta_profit": -2.2, "bid_value": 41, "levers_touched": ["L1-Zone","L1-FSC","L2","L4"], "status": "Override Flag", "urgency": "critical", "last_update": "Jun 7, 17:21", "workstream": "Retention"},

        {"packet_id": 10883, "customer": "Tesla, Inc.", "hierarchy": "Parent", "ref_num": "0000071204", "sub_ind": "Automotive - EV", "analyst": "R. Goyal", "pld_source": "Opportunity PLD only", "construct": "Daily",
         "bids": ["NEW - TSLA-Austin-Hub"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "No baseline - greenfield", "adv": 0, "baseDisc": 0, "totalDisc": 0, "rpp": 0, "rev": 0, "or": 0, "profit": 0, "modeledTier": "-"},
             {"name": "S1 - NAAF-premium pilot", "desc": "L0 DIM 162 - L1 zone-tight - L4 floor", "adv": 2.8, "baseDisc": 32.4, "totalDisc": 35.1, "rpp": 29.80, "rev": 14.2, "or": 0.62, "profit": 5.4, "modeledTier": "TARGET 66.8%", "isBest": True},
         ],
         "delta_profit": 5.4, "bid_value": 14, "levers_touched": ["L0","L1-Zone","L4"], "status": "Building Scenarios", "urgency": "low", "last_update": "Jun 7, 20:45", "workstream": "New Logo"},

        {"packet_id": 10708, "customer": "Rivian Automotive", "hierarchy": "Parent", "ref_num": "0000084412", "sub_ind": "Automotive - EV", "analyst": "M. Chen", "pld_source": "Opportunity PLD only", "construct": "Daily",
         "bids": ["NEW - RIVN-Normal-Pilot"],
         "scenarios": [
             {"name": "S0 - Current", "desc": "No baseline", "adv": 0, "baseDisc": 0, "totalDisc": 0, "rpp": 0, "rev": 0, "or": 0, "profit": 0, "modeledTier": "-"},
             {"name": "S1 - Pilot terms", "desc": "L0 158 - L1 zone average - L4 standard", "adv": 1.6, "baseDisc": 42.1, "totalDisc": 44.0, "rpp": 24.80, "rev": 8.4, "or": 0.68, "profit": 2.7, "modeledTier": "TARGET 52.5%", "isBest": True},
         ],
         "delta_profit": 2.7, "bid_value": 8, "levers_touched": ["L0","L1-Zone"], "status": "Sourced", "urgency": "low", "last_update": "Jun 7, 13:02", "workstream": "New Logo"},
    ]
    for pkt in da_packets:
        db.add(DAPacket(**pkt))

    # ── Live Deals ──
    live_deals = [
        # Renewals
        {"workstream": "Renewal", "account": "Toyota Motor NA", "val": 185, "end_date": "Aug 31, 2026", "margin": 10.6, "risk": "Low", "action": "On track — Pricing Committee", "owner": "K. Tate"},
        {"workstream": "Renewal", "account": "Aptiv PLC", "val": 98, "end_date": "Sep 15, 2026", "margin": 9.8, "risk": "Low", "action": "Bundled penetration draft", "owner": "K. Tate"},
        {"workstream": "Renewal", "account": "AutoZone", "val": 41, "end_date": "Jul 30, 2026", "margin": 6.4, "risk": "High", "action": "Save-play in motion", "owner": "D. Ruiz"},
        {"workstream": "Renewal", "account": "O'Reilly Automotive", "val": 36, "end_date": "Oct 10, 2026", "margin": 8.1, "risk": "Medium", "action": "Renewal pre-call set", "owner": "D. Ruiz"},
        {"workstream": "Renewal", "account": "BorgWarner", "val": 32, "end_date": "Aug 18, 2026", "margin": 10.1, "risk": "Low", "action": "EV penetration overlay", "owner": "K. Tate"},
        # Retention
        {"workstream": "Retention", "account": "AutoZone", "val": 41, "churn": 0.62, "at_risk": 26, "stage": "Negotiation", "action": "Pricing override pending — Matt review", "owner": "D. Ruiz"},
        {"workstream": "Retention", "account": "Lear Corporation", "val": 76, "churn": 0.41, "at_risk": 31, "stage": "Counter Received", "action": "Customer counter — re-modeling", "owner": "K. Tate"},
        {"workstream": "Retention", "account": "NAPA / GPC", "val": 28, "churn": 0.38, "at_risk": 11, "stage": "Discovery", "action": "Field marketing activation", "owner": "D. Ruiz"},
        # Penetration
        {"workstream": "Penetration", "account": "Magna International", "val": 28, "whitespace": "NAAF - Brokerage - UPS Capital", "stage": "Solution", "action": "Pricing in Packet #10892", "owner": "S. Patel"},
        {"workstream": "Penetration", "account": "Aptiv PLC", "val": 22, "whitespace": "UPS Capital - Premier", "stage": "Negotiation", "action": "Approved Packet #10612", "owner": "S. Patel"},
        {"workstream": "Penetration", "account": "Bosch NA", "val": 18, "whitespace": "Healthcare cold-chain (adjacent)", "stage": "Qualify", "action": "Discovery scheduled", "owner": "S. Patel"},
        {"workstream": "Penetration", "account": "Denso NA", "val": 14, "whitespace": "NAAF - Roadie last-mile", "stage": "Discovery", "action": "Industry briefing this week", "owner": "S. Patel"},
        # New Logo
        {"workstream": "New Logo", "account": "Stellantis NA — Toluca", "val": 48, "source": "ABM 1-to-1", "competitor": "FedEx", "stage": "Solution", "action": "Packet #11034 draft", "owner": "J. Brennan"},
        {"workstream": "New Logo", "account": "Tesla Austin Hub", "val": 14, "source": "ABM 1-to-1", "competitor": "In-house", "stage": "Discovery", "action": "Packet #10883 draft", "owner": "J. Brennan"},
        {"workstream": "New Logo", "account": "Rivian — Normal IL", "val": 8, "source": "Event referral", "competitor": "Regional 3PL", "stage": "Qualify", "action": "Packet #10708 pilot", "owner": "J. Brennan"},
        {"workstream": "New Logo", "account": "Hyundai-Kia Metaplant", "val": 22, "source": "ABM 1-to-1", "competitor": "FedEx + DHL", "stage": "Discovery", "action": "Plant manager briefing booked", "owner": "J. Brennan"},
    ]
    for d in live_deals:
        db.add(LiveDeal(**d))

    # ── Pricing Rollup Bridge ──
    bridge = [
        {"label": "Enterprise revenue — current actuals", "val": 9.42, "type": "base"},
        {"label": "+ Renewals priced (modeled close)", "val": 0.34, "type": "up"},
        {"label": "+ Retention saves (modeled close)", "val": 0.18, "type": "up"},
        {"label": "+ Penetration wins (modeled close)", "val": 0.21, "type": "up"},
        {"label": "+ New-logo wins (modeled close)", "val": 0.14, "type": "up"},
        {"label": "- Modeled discount leakage", "val": -0.06, "type": "down"},
        {"label": "Modeled Enterprise revenue, FY26", "val": 10.23, "type": "total"},
    ]
    for b in bridge:
        db.add(PricingBridge(**b))

    # ── Strategic Parent Deals (Objective 2) ──
    strat_deals = [
        {"deal_id":"D-TMC-2026R","customer":"Toyota Motor NA","workstream":"Renewal","packet_id":10474,"value":185,"stage":"Pricing Review","urgency":"med","current_or":0.58,"modeled_or":0.56,"current_margin":84,"days_to_close":84,"owner":"P. Subramaniam (Sr.)","playbook":"on-track","note":"L0 DIM 150-156 · L2 reshape · L4 raised. S3 recommended at TARGET 83%."},
        {"deal_id":"D-MGA-2026R","customer":"Magna International","workstream":"Penetration","packet_id":10892,"value":28,"stage":"Customer Counter","urgency":"low","current_or":0.62,"modeled_or":0.62,"current_margin":91,"days_to_close":42,"owner":"L. Park","playbook":"on-track","note":"NAAF Mexico bundle · brokerage cross-sell. Customer counter accepted S2."},
        {"deal_id":"D-STLA-2026N","customer":"Stellantis North America","workstream":"New Logo","packet_id":11034,"value":48,"stage":"Building Scenarios","urgency":"high","current_or":0.68,"modeled_or":0.68,"current_margin":78,"days_to_close":120,"owner":"R. Goyal","playbook":"on-track","note":"S2 parity posture preferred · $312M Detroit-Toluca RFP · NAAF Mexico positioning."},
        {"deal_id":"D-AZO-2026X","customer":"AutoZone","workstream":"Retention","packet_id":10941,"value":62,"stage":"Pricing Review · OVERRIDE","urgency":"high","current_or":0.70,"modeled_or":0.70,"current_margin":71,"days_to_close":14,"owner":"T. Whitaker","playbook":"deviating","note":"Analyst staged S3 to match FedEx counter. Breaches L2 Tier ceiling (143% vs 81% policy). CCO override required."},
        {"deal_id":"D-LEAR-2026R","customer":"Lear Corporation","workstream":"Renewal","packet_id":10755,"value":48,"stage":"Approved","urgency":"low","current_or":0.59,"modeled_or":0.59,"current_margin":88,"days_to_close":0,"owner":"M. Chen","playbook":"on-track","note":"Renewal closed at modeled. +$8M vs prior contract."},
        {"deal_id":"D-TSLA-2026N","customer":"Tesla, Inc.","workstream":"New Logo","packet_id":10883,"value":22,"stage":"Building Scenarios","urgency":"med","current_or":0.66,"modeled_or":0.66,"current_margin":82,"days_to_close":96,"owner":"L. Park","playbook":"watch","note":"Austin parts hub RFP imminent. S2 entry pricing under review. Risk: FedEx incumbent."},
        {"deal_id":"D-APTV-2026P","customer":"Aptiv PLC","workstream":"Penetration","packet_id":10612,"value":18,"stage":"Pricing Review","urgency":"med","current_or":0.61,"modeled_or":0.61,"current_margin":86,"days_to_close":60,"owner":"R. Goyal","playbook":"watch","note":"New VP Logistics (ex-Penske). Penetration deal under review - re-engagement needed."},
        {"deal_id":"D-RIVN-2026N","customer":"Rivian Automotive","workstream":"New Logo","packet_id":10708,"value":14,"stage":"Customer Counter","urgency":"low","current_or":0.65,"modeled_or":0.65,"current_margin":80,"days_to_close":32,"owner":"M. Chen","playbook":"on-track","note":"EV pure-play. Customer accepted S2 with Class-9 hazmat capability."},
    ]
    for d in strat_deals:
        db.add(EntStrategicDeal(**d))

    # ── Margin Trajectory (Plan vs Actual chart) ──
    margin_traj = [
        {"quarter":"Q3 24","sort_order":1,"plan_margin":7.4,"actual_margin":7.2,"recovery_margin":None},
        {"quarter":"Q4 24","sort_order":2,"plan_margin":7.6,"actual_margin":7.4,"recovery_margin":None},
        {"quarter":"Q1 25","sort_order":3,"plan_margin":7.8,"actual_margin":7.6,"recovery_margin":None},
        {"quarter":"Q2 25","sort_order":4,"plan_margin":7.6,"actual_margin":7.3,"recovery_margin":None},
        {"quarter":"Q3 25","sort_order":5,"plan_margin":7.7,"actual_margin":7.0,"recovery_margin":None},
        {"quarter":"Q4 25","sort_order":6,"plan_margin":7.5,"actual_margin":5.8,"recovery_margin":None},
        {"quarter":"Q1 26","sort_order":7,"plan_margin":7.5,"actual_margin":4.0,"recovery_margin":None},
        {"quarter":"Q2 26","sort_order":8,"plan_margin":7.8,"actual_margin":6.2,"recovery_margin":6.2},
        {"quarter":"Q3 26 (proj)","sort_order":9,"plan_margin":8.0,"actual_margin":None,"recovery_margin":7.4},
        {"quarter":"Q4 26 (proj)","sort_order":10,"plan_margin":8.2,"actual_margin":None,"recovery_margin":8.0},
    ]
    for m in margin_traj:
        db.add(EntMarginTrajectory(**m))

    # ── Market Signal → Deal Causal Effects ──
    signal_effects = [
        {"dot":"red","sig_type":"Competitor","title":"FedEx 'Auto Express' launches Aug 4 - 6 days ahead of NAAF","linked_packets":"#11034 Stellantis · #10892 Magna · #10474 Toyota","effect":"Cross-border pricing pressure on Detroit-Toluca lane. Analysts staging more aggressive L2 stretched-tier in Stellantis S1.","dollar":"-$14M","color":"brick","sort_order":1},
        {"dot":"red","sig_type":"Earnings","title":"AutoZone Q3: 'reviewing carrier diversification'","linked_packets":"#10941 AutoZone (OVERRIDE)","effect":"Analyst T. Whitaker staged S3 at L2 143% to match FedEx counter. Breaches CCO ceiling - override request pending.","dollar":"-$17M","color":"brick","sort_order":2},
        {"dot":"amber","sig_type":"RFP","title":"Stellantis opens $312M Detroit-Toluca review","linked_packets":"#11034 Stellantis (New Logo)","effect":"Sourcing window Jul 1. NAAF Mexico positioning critical - S2 parity posture preferred to keep margin.","dollar":"+$48M","color":"gold","sort_order":3},
        {"dot":"amber","sig_type":"M&A","title":"Magna acquires Mexico Tier-2 - adds $80M logistics spend","linked_packets":"#10892 Magna (Penetration)","effect":"Customer accepted S2 with NAAF + Brokerage + Capital bundle. Penetration deal value lifts.","dollar":"+$28M","color":"gold","sort_order":4},
        {"dot":"amber","sig_type":"Production","title":"Toyota Georgetown KY +12% Q3 production cadence","linked_packets":"#10474 Toyota (Renewal)","effect":"Inbound JIT volume lifts Aug-Oct. S3 recommended with L0 DIM 156 - captures margin on density lift.","dollar":"+$11M","color":"gold","sort_order":5},
        {"dot":"red","sig_type":"Tariff","title":"10% USMCA cross-border surcharge extended Sep 30","linked_packets":"All Auto OEM packets","effect":"Lane economics compress on Detroit-MX. Recommend L0 DIM floor raised across portfolio to protect RPP.","dollar":"-$11M","color":"brick","sort_order":6},
    ]
    for s in signal_effects:
        db.add(EntSignalEffect(**s))

    # ── Deal Workbench Lever Definitions (7 levers) ──
    deal_levers = [
        {"lever_key":"l2Ceiling","category":"L2 · Tier ceiling","color_key":"green","title":"L2 Tier Incentive ceiling","description":"Maximum % Modeled bracket allowed without escalation. DA brackets: 0% · 38.2% · 52.5% · 66.8% · 81.1% TARGET · 119.3% · 143.1%.","unit":"","min_val":0,"max_val":3,"step":1,"default_val":1,"options":["66.8%","81.1% TARGET","119.3%","143.1%"],"constraint":"CFO + Pricing Committee","sort_order":1},
        {"lever_key":"l0Floor","category":"L0 · DIM Divisor floor","color_key":"blue","title":"L0 DIM Divisor floor (portfolio)","description":"Minimum DIM Divisor allowable across all in-flight packets. Higher = better RPP on low-density freight. Range: 139-166.","unit":"","min_val":139,"max_val":166,"step":1,"default_val":150,"options":None,"constraint":"CFO sign-off","sort_order":2},
        {"lever_key":"l1AccCeiling","category":"L1 · Accessorial ceiling","color_key":"gold","title":"L1 Accessorial concession ceiling","description":"Maximum % Off across FSC, RES, DAS, Returns, Other. Today's policy ceiling is 20% Off - #1 leakage source.","unit":"% Off","min_val":10,"max_val":30,"step":0.5,"default_val":20,"options":None,"constraint":"VP Revenue Mgmt + CFO","sort_order":3},
        {"lever_key":"l4ZoneMin","category":"L4 · Zone Minimums","color_key":"brick","title":"L4 Zone Minimums posture","description":"Floor pricing per zone. Three-state: Lower 5% · Hold current · Raise 5%.","unit":"","min_val":0,"max_val":2,"step":1,"default_val":1,"options":["Lower 5%","Hold current","Raise 5%"],"constraint":"CFO sign-off","sort_order":4},
        {"lever_key":"scenarioRigor","category":"Process · Scenario rigor","color_key":"gold","title":"Scenario rigor mandate","description":"Minimum scenarios required per Analyser Packet. More scenarios = better recommendations but higher analyst load.","unit":" min/packet","min_val":2,"max_val":6,"step":1,"default_val":3,"options":None,"constraint":"VP Revenue Mgmt (operational)","sort_order":5},
        {"lever_key":"seniorAnalyst","category":"Capacity · Senior analyst overlay","color_key":"green","title":"Senior Pricing Analyst overlay","description":"Number of highest-value packets paired with a senior analyst. Capacity: 5 Senior FTE × ~6 packets each.","unit":" packets","min_val":10,"max_val":50,"step":5,"default_val":20,"options":None,"constraint":"Capacity-bound (35 ceiling without hiring)","sort_order":6},
        {"lever_key":"macroPosture","category":"Strategy · Macro posture","color_key":"blue","title":"Macro pricing posture","description":"Sets analyst defaults across all four lever levels. Aggressive captures share at margin cost; Premium protects margin at win-rate cost.","unit":"","min_val":0,"max_val":2,"step":1,"default_val":1,"options":["Aggressive","Parity","Premium"],"constraint":"CEO sign-off (board-level signal)","sort_order":7},
    ]
    for l in deal_levers:
        db.add(DealLeverDefinition(**l))

    # ── Past Enterprise Pricing Initiatives ──
    ent_initiatives = [
        {"initiative_id":"PINI-2025-08","name":"L1 Accessorial concession ceiling tightened 22% → 20%","scope":"Portfolio · all Enterprise packets","status":"completed","stage":"Outcome measured · steady state","owner":"R. Patel (VP Revenue Management)","created_date":"Aug 7, 2025","end_date":"Mar 31, 2026","modeled_profit":36,"actual_profit":42,"modeled_margin":1.4,"actual_margin":1.6,"notes":"Outperformed. Closed-won margin realization recovered 6pp. Some win-rate compression on Retention saves (~-1.2pp) - within policy tolerance.","levers":["L1 Accessorial · FSC/RES/DAS"],"affected_packets":172},
        {"initiative_id":"PINI-2025-11","name":"L2 Tier ceiling held at TARGET 81.1% (committee escalation for >TARGET)","scope":"Portfolio · all Enterprise packets","status":"completed","stage":"Outcome measured · policy permanent","owner":"R. Patel (VP Revenue Management) · CFO co-sign","created_date":"Nov 12, 2025","end_date":"Apr 30, 2026","modeled_profit":48,"actual_profit":46,"modeled_margin":1.9,"actual_margin":1.8,"notes":"On plan. Blocked 23 packets from auto-stretching above TARGET; 7 of those proceeded via committee approval. Margin recovery solid.","levers":["L2 Tier ceiling"],"affected_packets":187},
        {"initiative_id":"PINI-2026-03","name":"Senior Pricing Analyst overlay - Top-20 packets","scope":"Top-20 by bid value","status":"in-execution","stage":"Quarter 3 of 4 in-flight","owner":"R. Patel (VP Revenue Management)","created_date":"Feb 1, 2026","end_date":"Jan 31, 2027","modeled_profit":18,"actual_profit":14,"modeled_margin":0.8,"actual_margin":0.6,"notes":"Leading indicator strong - average scenarios/packet up 2.4 → 3.6 on covered set. Capacity at 18/20 - 2 senior analysts on parental leave Q2.","levers":["Capacity · Senior analyst overlay"],"affected_packets":20},
        {"initiative_id":"PINI-2026-06","name":"AutoZone Packet 10941 · L2 single-use override · committee escalation","scope":"Single packet · AutoZone","status":"pending-approval","stage":"Routed for committee sign-off (3 days)","owner":"M. Guffey (CCO) · pending CFO + Pricing Cmte","created_date":"Jun 7, 2026","end_date":None,"modeled_profit":0,"actual_profit":0,"modeled_margin":0,"actual_margin":0,"notes":"Analyst T. Whitaker staged S3 to match FedEx counter. Breaches L2 ceiling 81% → 143%. Modeled retention = $62M revenue saved · margin OR 0.70. Recommended approval pending committee.","levers":["L2 Tier ceiling · single-use override"],"affected_packets":1},
        {"initiative_id":"PINI-2026-04","name":"L0 DIM Divisor floor raised 145 → 150 (portfolio)","scope":"Portfolio · all Enterprise packets","status":"in-execution","stage":"Quarter 2 of 4 in-flight","owner":"R. Patel (VP Revenue Management) · CFO co-sign","created_date":"Mar 14, 2026","end_date":"Mar 31, 2027","modeled_profit":22,"actual_profit":18,"modeled_margin":0.9,"actual_margin":0.7,"notes":"RPP recovery visible on low-density freight (auto parts, EV batteries). Some friction on aggressive new-logo entry - 3 packets requested 145 exception.","levers":["L0 DIM Divisor"],"affected_packets":187},
    ]
    for i in ent_initiatives:
        db.add(EntInitiative(**i))

    # ── DA Lever Activity Heatmap ──
    lever_activity = [
        {"lvl":"L0","name":"DIM Divisor","description":"Volumetric pricing - protects RPP on low-density freight","packets":64,"pct_touched":34,"color_key":"blue","examples":"Most common: 150 → 156, 162. Magna NAAF lifted to 162.","sort_order":1},
        {"lvl":"L1","name":"Basic Incentives - Zones","description":"Service zones (Daily zones 2-8) · weight breaks · base zone discounts","packets":142,"pct_touched":76,"color_key":"gold","examples":"Ground Commercial · Cell-by-Cell common · Weight breaks at 1/6/11/21/41/51+ lbs.","sort_order":2},
        {"lvl":"L1","name":"Basic Incentives - Accessorials","description":"FSC (Fuel) · RES (Residential) · DAS · Returns · Other Charges","packets":118,"pct_touched":63,"color_key":"gold","examples":"FSC dominant: 20% Off avg · RES + DAS together 41 packets · Returns active 28.","sort_order":3},
        {"lvl":"L2","name":"Tier Incentives","description":"Performance-tier % Modeled brackets (0% · 38% · 52% · 67% · 81% TARGET · 119% · 143%)","packets":97,"pct_touched":52,"color_key":"green","examples":"23 packets requesting TARGET ceiling raise from 81.1% to 119.3% - flag candidates.","sort_order":4},
        {"lvl":"L4","name":"Zone Minimums","description":"Floor pricing per zone · protects short-zone profitability","packets":38,"pct_touched":20,"color_key":"brick","examples":"Most often raised on EV pure-play and aftermarket packets.","sort_order":5},
    ]
    for la in lever_activity:
        db.add(EntLeverActivity(**la))

    # ── DA Pipeline Stages ──
    pipeline_stages = [
        {"stage":"Sourced","count":22,"color_key":"muted","sort_order":1},
        {"stage":"Building Scenarios","count":48,"color_key":"blue","sort_order":2},
        {"stage":"Pricing Review","count":67,"color_key":"amber","sort_order":3},
        {"stage":"Customer Counter","count":31,"color_key":"brick","sort_order":4},
        {"stage":"Approved","count":19,"color_key":"green","sort_order":5},
    ]
    for ps in pipeline_stages:
        db.add(EntPipelineStage(**ps))

    # ── CXO Attention Items — 6 Signal Story Cards ──
    # Content sourced from UPS_Signal_Flow_Content.pdf specification.
    # Each story has: home card, investigation payload (left panel AI chat),
    # right_panel_views (analytics, evidence, invite-team, story-specific),
    # and typed follow_ups (chat prompts vs panel-switch CTAs).
    attention = [
        # ── STORY 1: Automotive Account Growth Gap ──
        {"cxo_id":1, "priority_rank":1, "is_cxo_priority":True, "sort_order":1,
         "tone":"urgent", "tag":"HIGH PRIORITY", "strategy_tag":"Retain",
         "category":"customer", "signal_type":"Account", "group_key":"signals",
         "source_url":None, "source_date":"UPS Q1 2025 Earnings · Apr 29, 2025",
         "title":"5 Auto Accounts $116M Below Plan — ABM Intervention Required",
         "body":"Ford ($30M gap, RFP Aug 12) and Stellantis ($24M gap, review open now) are most urgent. Apply GM ABM playbook.",
         "impact":"high",
         "source":"Q1 2026 Earnings · Internal CRM",
         "cta_label":"Investigate Growth Gap",
         "cta_action":"investigate",
         "related_packet_id":None,
         "related_account":"Auto Segment · 5 accounts",
         "delta_value":"−$116M vs plan",
         "confidence":"HIGH",
         "recommended_action_summary":"Activate 1-to-1 ABM for Ford + Stellantis · Restore account team coverage · Pre-lock NAAF capacity.",
         "analysis_by":"TwinX AI · Automotive Intelligence",
         "investigation_payload":{
            "seed_question":"Why are five automotive accounts $116M below plan, and what's the recovery path?",
            "ai_response":"The automotive segment is growing overall — ADV is up 4.1% and margin is strong at 9.2%. But the revenue gap is concentrated in five specific parent accounts, not the segment broadly. Combined, these five accounts are **$116M below YTD plan**, against a total automotive plan of $1.84B.\n\nThe strongest drivers of the gap are: **FedEx Express** gaining ground on lighter-weight auto parts shipments following their Q3 FY26 revenue surge; two accounts (**Ford, Honda**) facing production schedule disruptions that softened inbound volume; and **account coverage reductions** in the January 2026 reorganization that widened relationship gaps at exactly the wrong moment.\n\nThe good news: UPS has a proven playbook from analogous situations. The **GM ABM motion** (CCO briefings, dedicated Industry Expert, NAAF capacity lock) delivered a modeled $22M lift. The **Magna cross-border bundle** turned a procurement-org change into a SOW expansion from 24% to 31%. These patterns are directly transferable.\n\nTwo of the five accounts have active contract windows: **Ford's battery logistics RFP closes August 12** and **Toyota's renewal is due August 31**. Intervening now — not after the summer — is the decision.",
            "kpis":[
                {"label":"Auto Revenue YTD","val":"$1.84B","sub":"+8.2% vs plan","neg":False},
                {"label":"Auto ADV Growth","val":"+4.1%","sub":"+2.5pp vs prior Q","neg":False},
                {"label":"Auto Op. Margin","val":"9.2%","sub":"+140 bps vs PY","neg":False},
                {"label":"Pipeline Coverage","val":"2.8x","sub":"target 3.5x","neg":True},
                {"label":"Gap Accounts","val":"5","sub":"$116M combined gap","neg":True},
                {"label":"Renewal Windows","val":"2","sub":"close before Sep 1","neg":True},
            ],
            "follow_ups":[
                {"type":"panel","label":"Why we believe this","panel_key":"evidence"},
                {"type":"panel","label":"Account-by-account breakdown","panel_key":"account-breakdown"},
                {"type":"chat","label":"Show ABM playbook options","prompt":"What ABM playbook options are available to recover the 5 underperforming automotive accounts?"},
                {"type":"panel","label":"Go to ABM Experimentation Workbench","panel_key":"abm-simulation"},
                {"type":"panel","label":"Invite team to investigate","panel_key":"invite-team"},
            ],
            "affected_accounts":["Ford Motor Company","Stellantis North America","Honda","Tesla, Inc.","AutoZone"],
            "context_summary":"5 strategic auto accounts · $116M below plan · 2 renewal windows",
            "recommended_action":"Replicate GM ABM playbook (CCO briefings + Industry Expert + NAAF lock) at Ford and Stellantis before August renewal windows close.",
            "right_panel_views":[
                {"key":"evidence","label":"Why we believe this","title":"Why we believe this — Evidence view","subtitle":"Signals supporting the automotive account gap diagnosis.",
                 "content_sections":[
                    {"heading":"Ford Motor Company — Root Cause Evidence","body":"BlueOval City TN production start delayed to Aug 2026 (confirmed Ford 8-K) — softening Detroit-Memphis inbound volume by ~14% in UPS network.\n\nFedEx Federal Express Q3 FY26 US domestic revenue +10% — capturing share at lighter-weight auto parts bands where Ford aftermarket volume sits.\n\nUPS dedicated account team coverage at Ford reduced from 2.5 FTE to 1.0 FTE in Jan 2026 reorganization — 38% YoY decline in executive-level touchpoints.\n\n**Confidence: HIGH.** Deviation has held outside expected range for 11 consecutive weeks."},
                    {"heading":"Stellantis North America — Root Cause Evidence","body":"FedEx Freight spin-off June 1, 2026 refocuses FedEx Express on small-parcel exactly where Stellantis-Toluca cross-border volume sits.\n\n2025 trade policy shifts rerouted Asia-to-Mexico flows — Stellantis is second-most exposed Detroit-3 OEM.\n\nStellantis procurement reorg late 2025 moved logistics decisions into central Procurement — weakening UPS relationships built with prior commercial team.\n\nCarrier-mix review window is NOW OPEN for the Detroit-Toluca corridor.\n\n**Confidence: HIGH.** Three independent signal sources corroborate."},
                    {"heading":"Proven Analog Patterns (Why the Playbook Works)","body":"**GM:** 1-to-1 ABM with monthly CCO briefings + Detroit Industry Expert + NAAF capacity lock. Engagement frequency up 47%, modeled $22M lift trending. 4 quarters in execution.\n\n**Magna:** Industry-event ABM (NAFA + Auto Logistics Summit) + CCO briefings + multi-service bundle (NAAF + Brokerage + Capital). Actual +$21M vs +$18M modeled. SOW lifted 24% → 31% in 3 quarters.\n\n**Rivian:** Class-9 hazmat capability demo + thought leadership + free 8-week pilot + advisory board seat. +$11M revenue, preferred-carrier status secured for 5 quarters."},
                 ],
                 "metrics":[
                    {"label":"Ford Gap","val":"−$30M","sub":"largest single account"},
                    {"label":"Stellantis Gap","val":"−$24M","sub":"procurement reorg"},
                    {"label":"Honda Gap","val":"−$21M","sub":"production schedule"},
                    {"label":"Tesla Gap","val":"−$20M","sub":"Austin rebalance"},
                    {"label":"AutoZone","val":"−$21M","sub":"FedEx counter offer"},
                 ]},
                {"key":"account-breakdown","label":"Account-by-account breakdown","title":"Automotive Account Health — Top 12","subtitle":"Plan vs. actual for top 12 strategic automotive accounts.",
                 "tables":[
                    {"title":"Account Health — Top 12 Automotive",
                     "columns":["Account","Type","YTD Spend","SoW%","Headroom","Opps","Health","Notes"],
                     "rows":[
                        ["General Motors","OEM","$142M","24%","$78M","4","Green",""],
                        ["Ford Motor Company","OEM","$118M","21%","$92M","3","Amber","Battery RFP — Aug 12"],
                        ["Toyota Motor NA","OEM","$104M","19%","$81M","2","Green","Renewal due Aug 31"],
                        ["Stellantis NA","OEM","$86M","16%","$124M","5","Amber","Sourcing review open"],
                        ["Magna International","Tier-1","$76M","31%","$42M","3","Green",""],
                        ["Honda","OEM","$62M","15%","$58M","3","Amber","Production schedule shift"],
                        ["Lear Corporation","Tier-1","$58M","26%","$38M","2","Amber","Save-play active"],
                        ["Aptiv PLC","Tier-1","$51M","24%","$34M","4","Green",""],
                        ["BorgWarner","Tier-1","$38M","22%","$26M","2","Green",""],
                        ["Tesla, Inc.","EV","$22M","11%","$68M","3","Amber",""],
                        ["Rivian","EV","$14M","18%","$32M","2","Green",""],
                        ["AutoZone","Aftermarket","$41M","17%","$48M","1","Amber","FedEx counter"],
                        ["O'Reilly","Aftermarket","$36M","19%","$38M","2","Green",""],
                     ]},
                 ],
                 "content_sections":[],
                 "metrics":[
                    {"label":"Total YTD","val":"$1.84B","sub":"auto segment"},
                    {"label":"Avg SoW","val":"21%","sub":"top 12 accounts"},
                    {"label":"Total Headroom","val":"$719M","sub":"addressable"},
                    {"label":"Active Opps","val":"31","sub":"across 12 accounts"},
                 ]},
                {"key":"abm-simulation","label":"Go to ABM Experimentation Workbench","title":"ABM Experiment Workbench — Automotive Segment","subtitle":"Configure marketing and sales levers. Model the revenue and win-rate impact before committing budget.",
                 "content_sections":[
                    {"heading":"Pre-Loaded Account: Ford Motor Company","body":"**Gap vs Plan:** –$30M (–20.3% YTD)\n**Quarters Declining:** 3 consecutive\n**Contract Window:** Battery logistics RFP closes Aug 12, 2026\n**Current ABM Spend:** $0.62M/yr — blended ROI $3.0 vs benchmark $4.8"},
                    {"heading":"As-Is vs Recommended Lever Comparison","body":"• **ABM Budget:** $0.62M → $1.4M (+$0.78M investment)\n• **Executive Sponsor Engagement:** 1 session/quarter → 3 sessions/quarter (monthly CCO briefings)\n• **Account Team FTE:** 1.0 → 2.0 (restore coverage to pre-reorg level)\n• **Industry Expert deployment:** 1 (general) → 2 (Detroit auto specialist added)\n• **High-Touch Channel Mix:** 40% → 65% (shift from digital to executive briefings + events)\n• **Industry Events:** 2/yr → 4/yr (add NAFA and Automotive Logistics Summit)\n• **NAAF Capacity Guarantee:** 0 → 2 routes guaranteed for Ford battery logistics corridor"},
                 ],
                 "metrics":[
                    {"label":"Modeled Revenue Lift","val":"+$24M","sub":"P50 estimate"},
                    {"label":"Confidence Range","val":"$11M–$38M","sub":"P10 to P90"},
                    {"label":"Win Rate Change","val":"+6.2pp","sub":"improvement"},
                    {"label":"Sales Cycle Impact","val":"–14%","sub":"shorter"},
                 ]},
                {"key":"invite-team","label":"Invite team to investigate","title":"Invite team to investigate — Working Group","subtitle":"Automotive Account Growth Recovery",
                 "content_sections":[
                    {"heading":"Who to Include (Pre-populated)","body":"• **VP Automotive Sales — K. Tate** (account ownership for T1 OEMs)\n• **VP Revenue Management — R. Patel** (pricing lever authority)\n• **Head of ABM** — Marketing lead for Automotive segment campaigns\n• **Industry Expert, Automotive** — Detroit-based field specialist\n• **UPS Capital** — Trade-finance attach for Aptiv and Stellantis plays"},
                    {"heading":"Share Preview — What Gets Sent","body":"**Priority:** HIGH | **Last observed:** YTD\n\n**Observed Issue:** 5 strategic automotive accounts are $116M below YTD plan. Ford (–$30M), Stellantis (–$24M), Honda (–$21M), Tesla (–$20M), AutoZone (–$21M at risk). FedEx competitive pressure and coverage gaps are primary drivers.\n\n**Suspected Drivers:** FedEx Express Q3 surge capturing auto parts volume (~38%), Coverage reduction in Jan 2026 reorg (~28%), Production schedule disruptions at Ford and Honda (~21%), Procurement reorg at Stellantis (~13%)."},
                    {"heading":"Suggested Questions for Team","body":"• Can the GM ABM playbook (CCO briefings + Industry Expert + NAAF lock) be replicated at Ford and Stellantis before August renewal windows close?\n• What is the current state of UPS executive-level access at Ford — who is the new decision-maker after the coverage reduction?\n• Is the Stellantis-Toluca corridor carrier review window formally open? Who owns the carrier negotiation?\n• What is the lead time to deploy a Detroit-based Industry Expert to Ford and Honda simultaneously?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"Automotive Account Growth Analytics",
                "subtitle":"Plan vs. actual for top 12 strategic automotive accounts. Five accounts with reversed trends are highlighted.",
                "tables":[
                    {"title":"Account Health — Top 12 Automotive Accounts",
                     "columns":["Account","Sub-segment","YTD Spend","SoW%","Headroom","Opps","Health","Key Milestone"],
                     "rows":[
                        ["General Motors","OEM","$142M","24%","$78M","4","Green","Q3 NAAF Mexico review"],
                        ["Ford Motor Company","OEM","$118M","21%","$92M","3","Amber","Battery RFP — Aug 12"],
                        ["Stellantis NA","OEM","$86M","16%","$124M","5","Amber","Sourcing review open"],
                        ["Toyota Motor NA","OEM","$104M","19%","$81M","2","Green","Renewal due Aug 31"],
                        ["Magna International","Tier-1","$76M","31%","$42M","3","Green","Mexico T-2 +$28M opp"],
                        ["Honda","OEM","$62M","15%","$58M","3","Amber","Production schedule shift"],
                        ["Lear Corporation","Tier-1","$58M","26%","$38M","2","Amber","Save-play active"],
                        ["Aptiv PLC","Tier-1","$51M","24%","$34M","4","Green","UPS Capital penetration"],
                        ["BorgWarner","Tier-1","$38M","22%","$26M","2","Green","EV transition play"],
                        ["Tesla, Inc.","EV","$22M","11%","$68M","3","Amber","Austin rebalance — $4M"],
                        ["Rivian","EV","$14M","18%","$32M","2","Green","Atlanta tradeshow follow-up"],
                        ["AutoZone","Aftermarket","$41M","17%","$48M","1","Amber","Renewal at risk — FedEx"],
                        ["O'Reilly Automotive","Aftermarket","$36M","19%","$38M","2","Green","Happy Returns cross-sell"],
                     ]},
                ],
                "charts":[
                    {"type":"bar","title":"Plan vs Actual — Monthly Automotive Revenue ($M)","x_key":"month",
                     "data_keys":["plan","actual"],"colors":["#C8C0B8","#FFB500"],
                     "legend_names":["Plan","Actual"],
                     "data":[
                        {"month":"Jan","plan":305,"actual":298},
                        {"month":"Feb","plan":310,"actual":294},
                        {"month":"Mar","plan":318,"actual":302},
                        {"month":"Apr","plan":315,"actual":306},
                        {"month":"May","plan":320,"actual":308},
                        {"month":"Jun (P)","plan":325,"actual":312},
                     ]},
                ],
                "narrative_sections":[],
            },
         }},

        # ── STORY 2: Counter FedEx Auto Express on NAAF Mexico ──
        {"cxo_id":1, "priority_rank":2, "is_cxo_priority":True, "sort_order":2,
         "tone":"urgent", "tag":"COMPETITOR ACTION", "strategy_tag":"Retain",
         "category":"competitive", "signal_type":"Competitor", "group_key":"signals",
         "source_url":None,
         "source_date":"FreightWaves Jun 5, 2026 + account team Jun 6-7",
         "title":"FedEx Auto Express Is 8% Below UPS List on NAAF Corridors",
         "body":"FedEx is quoting Ford and Stellantis on the same corridors UPS NAAF Mexico launches in August. 6-day timing gap.",
         "impact":"high",
         "source":"FedEx 8-K · Competitor Signal · Account Intelligence",
         "cta_label":"Stage Competitive Counter",
         "cta_action":"investigate",
         "related_packet_id":None,
         "related_account":"Ford Motor Company · Stellantis North America",
         "delta_value":"5-day pre-lock window",
         "confidence":"HIGH",
         "recommended_action_summary":"Pre-lock NAAF routes for Ford (2) + Stellantis (3) within 5 days before FedEx secures commitments.",
         "analysis_by":"TwinX AI · Competitive Intelligence",
         "investigation_payload":{
            "seed_question":"What is the FedEx Auto Express threat and how should we counter it?",
            "ai_response":"The risk here is not that FedEx is better — it is that they are earlier. UPS NAAF Mexico launches in August. FedEx Auto Express is already quoting Ford and Stellantis sourcing teams at 8% below UPS current list. The margin of competitive disadvantage is not large, but the timing is. If FedEx secures a 12-month commitment before NAAF launches, UPS cannot displace them with NAAF during the window when it would matter most.\n\nThe two accounts at highest risk are **Ford Motor Company** and **Stellantis North America**. Ford's BlueOval City TN production corridor involves high-frequency inbound from Michigan and Ohio suppliers — exactly the cross-border-adjacent volume FedEx Auto Express is quoting. Stellantis's Detroit-Toluca corridor is the most direct USMCA exposure in the automotive portfolio — and Stellantis's carrier-mix review window is open right now. FedEx knows this.\n\nThe UPS response is not to lower price. The response is to **pre-lock NAAF capacity** as a commercial commitment to these two accounts before FedEx's window of access closes. A NAAF capacity pre-commitment — 2 dedicated routes for Ford, 3 for Stellantis — eliminates FedEx's timing advantage. It converts NAAF from a future launch into a present competitive offer.\n\nFor the broader portfolio, the **DIM Divisor floor** needs to be reviewed. FedEx Auto Express pricing at 8% below list likely includes aggressive DIM treatment on low-density auto parts freight. A floor increase from 150 to 156 recovers modeled RPP of +$0.44 per piece on automotive and EV freight — without touching the account-level pricing relationship.",
            "kpis":[
                {"label":"FedEx Price Gap","val":"−8%","sub":"below UPS list rate","neg":True},
                {"label":"FedEx Time Lead","val":"6 days","sub":"ahead of NAAF launch","neg":True},
                {"label":"Ford Gap","val":"−$30M","sub":"BlueOval City corridor","neg":True},
                {"label":"Stellantis Gap","val":"−$24M","sub":"carrier review open NOW","neg":True},
                {"label":"NAAF Pre-Lock","val":"5 routes","sub":"2 Ford + 3 Stellantis","neg":False},
                {"label":"Modeled Lift","val":"+$40M","sub":"P50 combined recovery","neg":False},
            ],
            "follow_ups":[
                {"type":"panel","label":"Why we believe this","panel_key":"evidence"},
                {"type":"panel","label":"Show impacted accounts","panel_key":"impacted-accounts"},
                {"type":"panel","label":"Stage NAAF pre-lock for Ford & Stellantis","panel_key":"naaf-prelock"},
                {"type":"panel","label":"Review DIM Divisor guardrail response","panel_key":"dim-guardrails"},
                {"type":"panel","label":"Invite team to investigate","panel_key":"invite-team"},
            ],
            "affected_accounts":["Ford Motor Company","Stellantis North America","Honda North America","Magna International","Aptiv PLC"],
            "context_summary":"FedEx Auto Express · NAAF corridor overlap · 5-day pre-lock window",
            "recommended_action":"Pre-lock NAAF capacity for Ford (2 routes) and Stellantis (3 routes) within 5 business days. Raise L0 DIM Divisor floor from 150 to 156.",
            "right_panel_views":[
                {"key":"evidence","label":"Why we believe this","title":"Why we believe this — Evidence view","subtitle":"Signals supporting the FedEx Auto Express threat diagnosis and NAAF pre-lock urgency.",
                 "content_sections":[
                    {"heading":"Primary Evidence","body":"**FedEx Auto Express launch confirmed by FreightWaves (Jun 5, 2026):** FedEx Federal Express launched a dedicated USMCA automotive cross-border product. Pricing confirmed at 8% below UPS current list rate. Initial corridors: Detroit-Tennessee, Detroit-Toluca, Midwest-Monterrey — all direct overlaps with UPS automotive T1 account corridors.\n\n**FedEx Freight spin-off (June 1, 2026):** FedEx Express is now a leaner, single-focus competitor. Management attention and capital previously allocated to the Freight business is now available to invest in small-parcel cross-border product development. Auto Express is the first product manifestation of this reallocation.\n\n**USMCA nearshoring volume signal:** Per CFO Dykes (UPS Q1 2026 earnings, Apr 28): UPS 'capitalized on trade lane shifts resulting from 2025 trade policy changes.' International Q1 revenue +3.8% on +10.7% RPP. FedEx is targeting exactly the same USMCA nearshoring trend.\n\n**FedEx DIM application rate at 90% (industry confirmed):** On low-density automotive and EV parts freight — the dominant freight type in cross-border USMCA corridors — FedEx is applying DIM pricing aggressively. At UPS's current DIM floor of 150, there is a structural per-piece RPP gap vs FedEx on this freight type.\n\n**Confidence: HIGH** — Source: FreightWaves primary reporting (Jun 5, 2026), UPS Q1 2026 earnings call and 8-K, FedEx Freight spin-off 8-K (Jun 1, 2026)."},
                    {"heading":"Account-Level Corroboration","body":"**Ford:** Account team intelligence (Jun 6, 2026) reports FedEx Auto Express quoting directly to Ford's BlueOval City TN logistics team. Ford's battery logistics RFP closes August 12 — FedEx is specifically positioning for this window.\n\n**Stellantis:** Carrier-mix review for the Detroit-Toluca corridor opened in late May 2026 following Stellantis's procurement reorg. FedEx Auto Express launch timing is not coincidental — they know the review window is open. UPS relationships weakened in Jan–Mar 2026 as coverage was reduced; FedEx is moving into the gap.\n\n**Honda:** Account team (Jun 7) reports FedEx quoting on Honda's Marysville-Monterrey inbound JIT corridor. Honda's Marysville plant schedule ramps Q3 2026.\n\n**Confidence: HIGH** on Ford and Stellantis. MEDIUM on Honda — FedEx quote not yet confirmed in deal workbench."},
                 ],
                 "metrics":[
                    {"label":"FedEx Price Gap","val":"−8%","sub":"below UPS list"},
                    {"label":"Time Lead","val":"6 days","sub":"ahead of NAAF"},
                    {"label":"DIM Application","val":"90%","sub":"FedEx shipments"},
                    {"label":"Confidence","val":"HIGH","sub":"FreightWaves + 8-K"},
                 ]},
                {"key":"impacted-accounts","label":"Show impacted accounts","title":"Accounts with Confirmed Corridor Overlap","subtitle":"Accounts where FedEx Auto Express is directly targeting UPS NAAF Mexico corridors.",
                 "content_sections":[
                    {"heading":"Corridor Overlap Map","body":"• **Ford Motor Company** — Detroit → BlueOval City TN. Gap to plan: –$30M. NAAF opportunity: battery logistics pre-lock. FedEx risk: HIGH — RFP closes Aug 12.\n• **Stellantis North America** — Detroit ↔ Toluca MX. Gap: –$24M. NAAF opportunity: Toluca outbound lane guarantee. FedEx risk: CRITICAL — carrier review open NOW.\n• **Honda North America** — Marysville OH → Monterrey. Gap: –$21M. NAAF opportunity: Mexico inbound JIT. FedEx risk: MEDIUM — FedEx quoting.\n• **Magna International** — Multiple MX corridors. +$21M (above plan). NAAF opportunity: expand NAAF attach. FedEx risk: LOW — relationship strong.\n• **Aptiv PLC** — Juarez ↔ Indiana. In-flight. NAAF opportunity: Capital cross-sell + NAAF. FedEx risk: MEDIUM — new VP Logistics."},
                 ],
                 "metrics":[
                    {"label":"Ford Impact","val":"−$30M","sub":"RFP closes Aug 12"},
                    {"label":"Stellantis","val":"−$24M","sub":"review open NOW"},
                    {"label":"Honda","val":"−$21M","sub":"FedEx quoting"},
                    {"label":"Magna","val":"+$21M","sub":"above plan"},
                 ]},
                {"key":"naaf-prelock","label":"Stage NAAF pre-lock","title":"NAAF Mexico Pre-Lock — Competitive Counter Staging","subtitle":"Pre-load configuration for the ABM Workbench. Route to Ford and Stellantis account teams for execution within 48 hours.",
                 "content_sections":[
                    {"heading":"What a NAAF Pre-Lock Commitment Does","body":"A NAAF capacity pre-commitment converts the August 2026 launch from a 'coming soon' promise into a present commercial offer with contractual capacity backing. It removes FedEx's only advantage — timing — because the customer can sign a UPS commitment today that activates at NAAF launch without waiting. FedEx cannot match a guaranteed capacity commitment on a network that does not exist yet."},
                    {"heading":"Combined Modeled Impact (Ford + Stellantis)","body":"• **Total modeled revenue lift:** +$40M (P50) — P10: +$22M / P90: +$58M\n• **Gap recovery** (Ford + Stellantis combined gap: $54M): 74% of gap recovered at P50\n• **NAAF capacity cost:** 5 dedicated routes — within August launch capacity (2 routes Ford + 3 routes Stellantis)\n• **Net competitive posture:** FedEx's 8% price advantage neutralized by capacity guarantee and SLA specificity\n• **Time to route:** 48 hours to account teams; execution within 5 business days"},
                 ],
                 "metrics":[
                    {"label":"Modeled Lift","val":"+$40M","sub":"P50 combined"},
                    {"label":"Gap Recovery","val":"74%","sub":"of $54M gap"},
                    {"label":"Routes","val":"5","sub":"2 Ford + 3 Stellantis"},
                    {"label":"Time to Route","val":"48 hrs","sub":"to account teams"},
                 ]},
                {"key":"dim-guardrails","label":"Review DIM Divisor","title":"DIM Divisor Review — Competitive Pricing Response","subtitle":"FedEx Auto Express pricing posture implies aggressive DIM treatment on low-density auto freight. UPS L0 floor review recommended.",
                 "content_sections":[
                    {"heading":"The Structural Pricing Gap","body":"FedEx Auto Express is pricing at 8% below UPS list on cross-border automotive freight. Much of this is USMCA auto parts: low-density, high-value, irregular dimensional weight — exactly the freight type where DIM pricing has the highest RPP impact. FedEx applies DIM to 90% of their shipment base. If UPS maintains its current DIM Divisor floor at 150 while FedEx prices with DIM at 90% application, UPS is structurally undercharging on the same freight — and the RPP gap compounds over volume."},
                    {"heading":"Recommended Guardrail Adjustments","body":"• **L0 DIM Divisor Floor:** 150 → Raise to 156. +$0.44 per piece RPP on automotive and EV freight. Across automotive T1 portfolio, modeled at +$8.2M annualized. CFO co-sign required.\n• **L1 Accessorial Discount Cap:** 20% Off max → Tighten to 18% Off. +~$12M portfolio-wide per 2pp tightening. VP Revenue Mgmt + CFO.\n• **L2 Tier Incentive Ceiling:** Hold TARGET 81.1%. Do not loosen in response to FedEx. AutoZone Packet 10941 is a single-use exception.\n• **NAAF Cross-Border Pricing Posture:** Not yet set → NAAF premium: 3–5% above standard Ground list. VP Revenue Mgmt."},
                 ],
                 "metrics":[
                    {"label":"L0 DIM Floor","val":"150 → 156","sub":"+$8.2M annualized"},
                    {"label":"L1 Cap","val":"20% → 18%","sub":"+$12M per 2pp"},
                    {"label":"L2 Ceiling","val":"Hold","sub":"81.1% TARGET"},
                    {"label":"NAAF Premium","val":"3–5%","sub":"above Ground list"},
                 ]},
                {"key":"invite-team","label":"Invite team to investigate","title":"Invite team to investigate — Working Group","subtitle":"FedEx Auto Express Competitive Counter — NAAF Pre-Lock Execution",
                 "content_sections":[
                    {"heading":"Who to Include","body":"• **VP Automotive Sales — K. Tate** (Ford and Stellantis account ownership; routes the pre-lock offer to account teams)\n• **Head of NAAF Mexico** — Commercial launch lead; confirms capacity allocation for pre-lock commitment\n• **VP Revenue Management — R. Patel** (DIM Divisor guardrail authority; approves L0 floor change to 156)\n• **Industry Expert, Automotive (Detroit-based)** — Deploy to Ford and Stellantis immediately for executive engagement\n• **UPS Capital** — Trade-finance attach for Stellantis; confirms $2.8M incremental ARR modeling\n• **Competitive Intelligence Analyst** — FedEx Auto Express product monitoring and corridor expansion tracking"},
                    {"heading":"Suggested Questions for Team","body":"• Is the August NAAF launch capacity firm enough to support 5 pre-committed routes across Ford and Stellantis? What is the contingency if the August date slips?\n• Does Stellantis procurement have a formal decision timeline for the carrier-mix review? Who is the new decision-maker post-reorg?\n• Is the customs brokerage bundle feasible to include in the Stellantis offer within the 5-day window, or does it require a separate proposal track?\n• What is FedEx's track record on cross-border SLA performance? Is the UPS 98.5–99.0% SLA commitment defensible operationally at NAAF Mexico launch?\n• If Ford signs a NAAF pre-commitment, does that satisfy the battery logistics RFP (Aug 12) or is a separate formal RFP response still required?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"FedEx Auto Express — Competitive Intelligence & NAAF Exposure Map",
                "subtitle":"Account-level exposure, NAAF corridor overlap, and pricing posture analysis for the Detroit-Mexico cross-border automotive corridor.",
                "tables":[
                    {"title":"Competitive Signal — What We Know",
                     "columns":["Metric","Value"],
                     "rows":[
                        ["FedEx Auto Express launch","Confirmed — FreightWaves Jun 5, 2026"],
                        ["FedEx Auto Express pricing","8% below UPS current list rate"],
                        ["Corridors targeted","Detroit→Tennessee, Detroit↔Toluca, Midwest→Monterrey"],
                        ["UPS NAAF Mexico launch","August 2026 — confirmed"],
                        ["Time gap (FedEx lead)","~6 days ahead of UPS NAAF in market"],
                        ["FedEx DIM application rate","90% of shipments"],
                        ["FedEx Freight spin-off","Completed June 1, 2026"],
                     ]},
                    {"title":"Accounts with Confirmed Corridor Overlap",
                     "columns":["Account","Corridor","Gap to Plan","NAAF Opportunity","FedEx Risk"],
                     "rows":[
                        ["Ford Motor Company","Detroit → BlueOval City TN","–$30M","Battery logistics pre-lock","HIGH — RFP closes Aug 12"],
                        ["Stellantis NA","Detroit ↔ Toluca MX","–$24M","Toluca outbound lane guarantee","CRITICAL — review open NOW"],
                        ["Honda NA","Marysville OH → Monterrey","–$21M","Mexico inbound JIT","MEDIUM — FedEx quoting"],
                        ["Magna International","Multiple MX corridors","+$21M","Expand NAAF attach","LOW — relationship strong"],
                        ["Aptiv PLC","Juarez ↔ Indiana","In-flight","Capital cross-sell + NAAF","MEDIUM — new VP Logistics"],
                     ]},
                ],
                "charts":[],
                "narrative_sections":[
                    {"heading":"NAAF Mexico Pre-Lock Window","bullets":[
                        "UPS NAAF Mexico launches August 2026. FedEx Auto Express is in market now.",
                        "The 5-business-day pre-lock window means Ford and Stellantis account teams must be given a commercial NAAF commitment by June 16, 2026.",
                        "Ford pre-lock: 2 dedicated routes — Detroit↔BlueOval City TN battery logistics + Ford Michigan inbound. Modeled: +$18M P50.",
                        "Stellantis pre-lock: 3 dedicated routes — Detroit↔Toluca outbound + Toluca→Texas import corridor + Monterrey buffer lane. Modeled: +$22M P50.",
                        "Combined modeled revenue lift: +$40M (P50). Gap recovery: 74% of $54M combined gap.",
                    ]},
                ],
            },
         }},

        # ── STORY 3: Board Meeting Preparedness ──
        {"cxo_id":1, "priority_rank":3, "is_cxo_priority":True, "sort_order":3,
         "tone":"amber", "tag":"UPCOMING EVENT", "strategy_tag":"Board Prep",
         "category":"customer", "signal_type":"Earnings", "group_key":"signals",
         "source_url":None, "source_date":"Board meeting in 21 days",
         "title":"Board Meeting in 3 Weeks — Commercial Strategy Review",
         "body":"Board probes: Q1 margin drag, $89.7B path, NAAF $50M ROI, FedEx posture. Deck due June 11.",
         "impact":"high",
         "source":"Internal · Board Calendar · Q1 2026 Earnings",
         "cta_label":"Prepare for Board Meeting",
         "cta_action":"investigate",
         "related_packet_id":None,
         "related_account":"Portfolio-wide",
         "delta_value":"21 days out",
         "confidence":"HIGH",
         "recommended_action_summary":"Anchor on what's working — SMB record, Healthcare $3B, Amazon exit on track. Frame Q1 as transitional.",
         "analysis_by":"TwinX AI · Strategy & Board Prep",
         "investigation_payload":{
            "seed_question":"What should my Board narrative look like, and what hard questions should I expect?",
            "ai_response":"Board prep for this cycle is more consequential than usual. Q1 2026 landed at **4.0% US Domestic adjusted operating margin**, and the Q2 guide of **7.5–8.5%** implies a significant recovery that needs a clear, credible explanation. The Board will not accept a narrative that blames transitional costs without a specific recovery mechanism.\n\nLooking at the last four board meeting transcripts and the questions raised at each, there are **four themes that will almost certainly come up**: (1) The **commercial revenue recovery path** — specifically, what closes the gap between the $89.7B FY guide and the $14.2B Q1 pace. (2) The **automotive strategy** — $50M in NAAF investment, when does it convert to revenue, and what is the win rate on the five underperforming accounts. (3) The **FedEx competitive posture** — the Board has access to FedEx public earnings data and will notice the +10% growth vs UPS decline. (4) **Capital allocation** — the $3B cost-out is on track, but dividends at $5.4B require FCF confidence; the Board will probe operating leverage visibility.\n\nThe strongest narrative architecture for Matt is: **Lead with what is structurally working** (SMB record penetration, Healthcare first $3B quarter, B2B at 6-year high, Amazon exit complete). Frame Q1 margin as planned transitional drag — 250 bps from one-time costs that are 'largely behind us' per CFO language. Then pivot to the forward-looking commercial story: NAAF Mexico launch in August, automotive T1 account recovery plan, and Enterprise pricing discipline restoring margin realization from 84% to 90%+. End with capital discipline confidence.",
            "kpis":[
                {"label":"Consol Revenue","val":"$89.7B","sub":"FY target · 23.7% done","neg":False},
                {"label":"Consol Adj Margin","val":"9.6%","sub":"FY target · Q1 at 6.2%","neg":True},
                {"label":"US Dom Margin","val":"4.0%","sub":"Q2 guide 7.5–8.5%","neg":True},
                {"label":"Healthcare Rev","val":"$3.0B","sub":"first $3B quarter","neg":False},
                {"label":"$3B Cost Reduce","val":"28%","sub":"complete · on track","neg":False},
                {"label":"Board Meeting","val":"21 days","sub":"Q2 2026 cycle","neg":True},
            ],
            "follow_ups":[
                {"type":"panel","label":"Show anticipated board questions","panel_key":"board-questions"},
                {"type":"chat","label":"Draft commercial metrics narrative","prompt":"Draft a concise commercial metrics narrative for the Board that leads with structural wins (SMB, Healthcare, B2B) and frames Q1 margin as transitional."},
                {"type":"panel","label":"Pull prior board action items","panel_key":"prior-actions"},
                {"type":"panel","label":"Invite team to prepare","panel_key":"invite-team"},
            ],
            "affected_accounts":["Portfolio-wide"],
            "context_summary":"Board prep · Q2 2026 · 4 anticipated hard questions",
            "recommended_action":"Lead with structural wins, frame Q1 as transitional, pivot to NAAF + auto recovery + pricing discipline for forward story.",
            "right_panel_views":[
                {"key":"board-questions","label":"Anticipated board questions","title":"Anticipated Board Questions — Preparation Briefs","subtitle":"Four questions virtually certain to arise at the Q2 2026 Board meeting.",
                 "content_sections":[
                    {"heading":"Q1: How does 4.0% become 7.5–8.5% in one quarter?","body":"**Recommended Answer Framework:**\nThe 4.0% Q1 margin includes 250 bps of transitional drag from three one-time costs: MD-11 aircraft retirement, Ground Saver insourcing transition, and weather + casualty events. These costs are 'largely behind us' per CFO Dykes and do not repeat in Q2.\n\nNetwork reconfiguration is delivering: 28% lower cost-per-piece in automated facilities; 25,000 operational position reductions; 50 facility closures in H1 at targeted cost base.\n\nRevenue quality is improving: RPP +6.5% YoY even as volume declined. SMB and B2B mix-shift is structural, not seasonal.\n\nThe Q2 guide range of 7.5–8.5% is the operating leverage release as transitional costs clear plus the full quarter of network savings."},
                    {"heading":"Q2: FedEx grew +10% while UPS declined 2.3%. What is the response?","body":"**Recommended Answer Framework:**\nOur response is three-pronged: (1) Tighten DIM Divisor floor to match FedEx's 90% application rate on low-density freight. (2) Accelerate Tier-1 automotive ABM motions where FedEx encroachment is confirmed — Ford, Stellantis, AutoZone. (3) Protect SMB penetration record with service quality, not price discounting.\n\nWe are not chasing FedEx volume. We are protecting margin-positive accounts. That is the strategy."},
                    {"heading":"Q3: Five automotive accounts below plan — is NAAF at risk?","body":"**Recommended Answer Framework:**\nThe five account gaps are account-specific, not segment-wide. Automotive segment ADV is up 4.1% and margin is 9.2% — above the US Domestic guide.\n\nNAAF Mexico launches August 2026. The accounts most at risk (Ford, Stellantis) are precisely the accounts for whom NAAF creates the most compelling value proposition — cross-border US-Mexico auto parts corridors. We have two contract windows closing before September.\n\nThe $50M investment is not at risk — it is the primary tool to recover these accounts."},
                    {"heading":"Q4: Enterprise margin realization at 84% — is this structural?","body":"**Recommended Answer Framework:**\nThe leakage is identifiable and addressable. The primary source is post-approval accessorial concessions added after deals close. The L1 Accessorial cap — currently 20% Off — will be tightened to 18% in the next guardrail cycle. Every 2pp tightened recovers approximately $12M.\n\nThe Digital Deal Analyser gives me real-time visibility into all 187 in-flight pricing packets — I can see guardrail breaches before they become margin leakage, not after.\n\nThe target is 90%+ margin realization within two quarters. We have the tooling to get there."},
                 ],
                 "metrics":[
                    {"label":"Margin Gap","val":"350–450 bps","sub":"Q1 vs FY guide"},
                    {"label":"Transitional Drag","val":"250 bps","sub":"one-time costs"},
                    {"label":"Margin Realization","val":"84%","sub":"target 90%+"},
                    {"label":"Hard Questions","val":"4","sub":"virtually certain"},
                 ]},
                {"key":"prior-actions","label":"Prior board action items","title":"Prior Board Meeting Action Items — Status Tracker","subtitle":"Actions committed at Q4 2025 and Q1 2026 board meetings. Status as of June 8, 2026.",
                 "content_sections":[
                    {"heading":"Q4 2025 Board — Actions Committed","body":"• Amazon exit complete by mid-2026 → **STATUS: On track.** ADV reduced 500K in Q1.\n• SMB penetration to record level → **STATUS: DELIVERED.** 34.5% in Q1 2026 — highest in UPS history.\n• Healthcare revenue toward $20B FY target → **STATUS: On track.** First $3B quarter delivered in Q1.\n• Initiate network reconfiguration — 50 facilities in H1 → **STATUS:** 23 closed Q1, 27 on track for Q2."},
                    {"heading":"Q1 2026 Board — Actions Committed","body":"• Automotive segment growth plan — NAAF Mexico by August 2026 → **STATUS: On track.** Launch confirmed August 2026.\n• Enterprise pricing discipline — margin realization improvement plan → **STATUS: In progress.** L0 DIM raised 145→150.\n• FedEx competitive response plan → **STATUS: Being developed.** ABM acceleration for exposed accounts.\n• $3B cost-out on track → **STATUS:** 28% complete. Network and workforce reductions on plan."},
                 ],
                 "metrics":[
                    {"label":"Q4 Actions","val":"4/4","sub":"on track or delivered"},
                    {"label":"Q1 Actions","val":"4/4","sub":"in progress"},
                 ]},
                {"key":"invite-team","label":"Invite team to prepare","title":"Invite team to prepare — Board Prep Working Group","subtitle":"Board Meeting Preparation",
                 "content_sections":[
                    {"heading":"Who to Include","body":"• **CFO / Finance Lead** — Revenue and margin recovery narrative alignment\n• **VP Revenue Management — R. Patel** (Enterprise pricing metrics, guardrail status)\n• **VP Automotive Sales — K. Tate** (automotive account recovery status, NAAF pre-sell progress)\n• **Head of Strategy & Corporate Communications** — Board narrative crafting\n• **Competitive Intelligence** — FedEx response slides"},
                    {"heading":"Suggested Questions for Team","body":"• Is the Q2 7.5–8.5% margin recovery path fully supported by the current cost-out trajectory?\n• Can we confirm the NAAF August launch timeline is firm before the board meeting?\n• Do we have a specific number for projected margin realization improvement from the L1 guardrail tightening?\n• What is the right level of specificity on the FedEx response — account-level or portfolio-level narrative?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"Board Meeting Preparation — Commercial Dashboard",
                "subtitle":"Key metrics, narrative anchors, and risk areas for the Q2 2026 Board review.",
                "tables":[
                    {"title":"FY26 Goal Tracker — Board-Visible Metrics",
                     "columns":["Metric","Target","Q1 Actual","Status"],
                     "rows":[
                        ["Consolidated Revenue","$89.7B","$21.2B (23.7% of year)","On pace if H2 accelerates"],
                        ["Consolidated Adj. Op. Margin","9.6%","6.2%","Gap: ~350 bps — H2 recovery required"],
                        ["US Domestic Margin","Q2 guide 7.5–8.5%","4.0%","$350M transitional costs clearing"],
                        ["Healthcare Revenue","$20B FY","$3.0B — first $3B quarter","On track"],
                        ["$3B Cost Reduction","FY26","28% complete — 23/50 facilities, 25K positions","On track"],
                     ]},
                ],
                "charts":[],
                "narrative_sections":[
                    {"heading":"Strategic Narrative Anchors — What Is Working","bullets":[
                        "SMB Penetration: 34.5% of US volume — record high in UPS history",
                        "B2B Share: 45.2% — highest in 6 years",
                        "Healthcare: First $3B quarter. Andlauer + Frigo-Trans fully integrated",
                        "Amazon glide-down: Complete. Freed capacity reallocating to higher-yield segments",
                        "Network reconfiguration: 23 facilities closed Q1, 27 more in H1. 28% lower cost-per-piece in automated facilities",
                    ]},
                    {"heading":"Anticipated Hard Questions — Risk Areas","bullets":[
                        "Q: The Q2 margin guide of 7.5–8.5% requires a 350–450 bps recovery in one quarter. What specifically makes that achievable?",
                        "Q: FedEx reported +10% US Domestic revenue growth in the same quarter UPS declined. What is UPS's competitive response?",
                        "Q: Five of your largest automotive accounts are running below plan. Is the $50M NAAF investment at risk?",
                        "Q: Margin realization on Enterprise deals is 84% of modeled. Is pricing discipline a structural problem?",
                    ]},
                ],
            },
         }},

        # ── STORY 4: SMB Segment Acceleration ──
        {"cxo_id":1, "priority_rank":4, "is_cxo_priority":True, "sort_order":4,
         "tone":"green", "tag":"OPPORTUNITY", "strategy_tag":"Grow",
         "category":"opportunities", "signal_type":"Volume", "group_key":"signals",
         "source_url":None, "source_date":"UPS Q1 2026 Earnings · Apr 28, 2026",
         "title":"SMB at Record 34.5% — 6-Week Window Before FedEx Targets This Segment",
         "body":"B2B at 45.2% (6-year high). FedEx post-spin will move into SMB Digital Access in Q3.",
         "impact":"high",
         "source":"Q1 2026 Earnings · Internal CRM · Promotions Data",
         "cta_label":"Explore SMB Opportunity",
         "cta_action":"investigate",
         "related_packet_id":None,
         "related_account":"SMB Segment",
         "delta_value":"34.5% record",
         "confidence":"HIGH",
         "recommended_action_summary":"Launch Healthcare SMB + Auto Aftermarket SMB campaigns now to lock cohorts before FedEx enters.",
         "analysis_by":"TwinX AI · SMB Intelligence",
         "investigation_payload":{
            "seed_question":"How do we capitalize on record SMB penetration before FedEx targets this space?",
            "ai_response":"The SMB record is structurally significant, not a one-quarter artifact. It reflects two things happening simultaneously: **UPS made space** — the Amazon exit freed capacity that is being reallocated to higher-yield SMB shippers. And **UPS built the muscle** — the Digital Access Program created the acquisition infrastructure that is now converting at scale.\n\nBut record penetration is not the ceiling. Three SMB verticals are under-penetrated relative to their TAM: **Healthcare SMB** (pharmacy chains, medical device SMBs, lab-to-hospital supply chains — all benefiting from Andlauer and Frigo-Trans acquisitions, now fully integrated); **Automotive Aftermarket SMB** (NAPA-style independents, collision repair supply chains — natural extension of the enterprise automotive strategy); and **High-Tech SMB** (component manufacturers and chip distributors benefiting from re-shoring trends).\n\nThe urgency is the **FedEx factor**. FedEx historically punted on SMB — their product infrastructure was built around large shippers and the Freight business. With Freight spun off, a leaner FedEx Express will be looking for growth vectors. SMB via digital channels is the most obvious move. CFO Dykes noted in Q1 earnings that 'shippers in higher-value verticals demonstrate greater tolerance for price increases' — this is the exact SMB segment UPS needs to defend.\n\nThe **6-week intervention window** is: new Digital Access Program cohorts, healthcare SMB lifecycle campaigns, and a targeted automotive aftermarket SMB push.",
            "kpis":[
                {"label":"SMB Penetration","val":"34.5%","sub":"US Dom vol — record","neg":False},
                {"label":"B2B Share","val":"45.2%","sub":"6-year high","neg":False},
                {"label":"SMB ADV Growth","val":"+4.2%","sub":"vs prior quarter","neg":False},
                {"label":"Healthcare SMB","val":"$380M","sub":"modeled headroom","neg":False},
                {"label":"Auto Aftermarket","val":"$210M","sub":"modeled headroom","neg":False},
                {"label":"High-Tech SMB","val":"$155M","sub":"modeled headroom","neg":False},
            ],
            "follow_ups":[
                {"type":"panel","label":"Why we believe this","panel_key":"evidence"},
                {"type":"chat","label":"Show SMB vertical breakdown","prompt":"Break down the SMB opportunity by vertical — Healthcare, Auto Aftermarket, High-Tech. Show TAM, current penetration, and addressable accounts for each."},
                {"type":"chat","label":"Model acquisition scenarios","prompt":"Model the impact of increasing Digital Access Program acquisition rate by 15% in Q3 — what's the revenue uplift and what's the gating constraint?"},
                {"type":"panel","label":"Invite team to investigate","panel_key":"invite-team"},
            ],
            "affected_accounts":["SMB Segment","Healthcare SMB","Auto Aftermarket SMB","High-Tech SMB"],
            "context_summary":"Record SMB penetration · 3 verticals with headroom · FedEx threat emerging",
            "recommended_action":"Launch Healthcare SMB lifecycle campaigns + auto aftermarket SMB push. Increase DAP acquisition rate 15% before FedEx reloads.",
            "right_panel_views":[
                {"key":"evidence","label":"Why we believe this","title":"Why we believe this — Evidence view","subtitle":"Signals supporting the SMB growth opportunity and FedEx threat window.",
                 "content_sections":[
                    {"heading":"Record SMB Performance — Source Data","body":"**UPS Q1 2026 Earnings Call (Apr 28, 2026):** CEO Tomé confirmed SMB penetration at 34.5% — 'record high.' B2B at 45.2% 'highest in 6 years.'\n\n**CFO Dykes on SMB pricing power:** 'Shippers in higher-value verticals demonstrate greater tolerance for price increases.'\n\nUS Domestic RPP +6.5% YoY — driven by SMB and B2B mix-shift, not volume.\n\nAmazon glide-down releasing ~500K ADV in Q1 — capacity now available for SMB reallocation.\n\n**Confidence: HIGH.** Source: UPS direct public disclosures."},
                    {"heading":"FedEx SMB Threat Assessment","body":"FedEx Freight spin-off June 1, 2026: FedEx Express is now a leaner business with freed management attention and capital.\n\nFedEx Digital Access equivalent (FedEx Ship Manager) historically inferior to UPS Digital Access Program in SMB acquisition capability.\n\nFedEx Q3 FY26 +10% US Domestic: Volume and yield growing — competing at every level of the market.\n\n**Risk window:** 6–8 weeks before FedEx completes post-spin integration and begins aggressive SMB digital acquisition campaigns.\n\n**Confidence: MEDIUM-HIGH.** Based on structural competitive analysis, not confirmed FedEx SMB campaign signals yet."},
                 ],
                 "metrics":[
                    {"label":"SMB Record","val":"34.5%","sub":"confirmed CEO"},
                    {"label":"B2B High","val":"45.2%","sub":"6-year high"},
                    {"label":"RPP Growth","val":"+6.5%","sub":"YoY mix-shift"},
                    {"label":"Threat Window","val":"6–8 wks","sub":"before FedEx moves"},
                 ]},
                {"key":"invite-team","label":"Invite team to investigate","title":"Invite team to investigate — Working Group","subtitle":"SMB Segment Acceleration",
                 "content_sections":[
                    {"heading":"Who to Include","body":"• **Head of SMB Marketing** — Digital Access Program lead\n• **VP Healthcare Logistics** — Andlauer / Frigo-Trans integration and healthcare SMB go-to-market\n• **Head of Automotive ABM** — Automotive aftermarket SMB downstream extension\n• **Digital Product Lead** — Digital Access Program acquisition funnel optimisation\n• **Competitive Intelligence** — FedEx SMB threat monitoring"},
                    {"heading":"Share Preview","body":"**Priority:** OPPORTUNITY | **Window:** 6 weeks\n\n**Observed:** SMB penetration at record 34.5%. Three verticals with modeled headroom: Healthcare SMB ($380M), Automotive Aftermarket SMB ($210M), High-Tech SMB ($155M). FedEx post-spin-off SMB threat emerging within 6–8 weeks.\n\n**Suggested Questions:**\n• What is the current Digital Access Program conversion rate for healthcare SMB cohorts vs the record benchmark?\n• Can the automotive aftermarket SMB play be launched as a downstream extension of the T1 ABM motion?\n• What would it take to increase the Digital Access Program acquisition rate by 15% in Q3?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"SMB Segment Analytics — Penetration and Opportunity",
                "subtitle":"Current SMB performance, vertical breakdown, and modeled headroom by segment.",
                "tables":[
                    {"title":"Top 3 SMB Verticals with Headroom",
                     "columns":["Vertical","Description","Modeled Headroom"],
                     "rows":[
                        ["Healthcare SMB","Pharmacy chains, medical device SMBs, lab supply chains. Andlauer + Frigo-Trans cold-chain fully integrated.","$380M"],
                        ["Automotive Aftermarket SMB","Independent collision repair, NAPA-style distributors, 3PL sub-tier. 1,498 Tier-3 accounts addressable via 1-to-many ABM.","$210M"],
                        ["High-Tech SMB","Component manufacturers, chip distributors, IoT device makers. Re-shoring trends driving domestic logistics needs.","$155M"],
                     ]},
                ],
                "charts":[
                    {"type":"bar","title":"SMB Vertical Headroom ($M)","x_key":"vertical",
                     "data_keys":["headroom"],"colors":["#FFB500"],
                     "legend_names":["Modeled Headroom"],
                     "data":[
                        {"vertical":"Healthcare","headroom":380},
                        {"vertical":"Auto Aftermarket","headroom":210},
                        {"vertical":"High-Tech","headroom":155},
                     ]},
                ],
                "narrative_sections":[
                    {"heading":"Competitive Watch","bullets":[
                        "FedEx Express historically weak in SMB. Post-Freight spin-off, FedEx Express has freed capacity and management attention.",
                        "Amazon Shipping Services (3P carrier) growing in SMB digital channel. UPS Digital Access Program must stay the easier, higher-quality option.",
                        "USPS Ground Saver: UPS retaining higher-yield Ground Saver volume in-network. ADV declined 27.7% Q1 (margin-led decision). Monitor SMB migration to UPS Ground.",
                    ]},
                ],
            },
         }},

        # ── STORY 5: Amazon Exit — Capacity Reallocation ──
        {"cxo_id":1, "priority_rank":5, "is_cxo_priority":True, "sort_order":5,
         "tone":"amber", "tag":"STRATEGY & EXECUTION", "strategy_tag":"Grow",
         "category":"network", "signal_type":"Volume", "group_key":"signals",
         "source_url":"https://about.ups.com/us/en/newsroom/press-releases/strategy/ups-takes-strategic-actions.html",
         "source_date":"UPS Q4 2024 Earnings · Jan 30, 2025",
         "title":"Amazon Exit Completing June 2026 — Is Capacity Reallocation On Track?",
         "body":"~500K ADV freed in Q1. SMB + Healthcare absorbing well. Enterprise Automotive is the pace risk.",
         "impact":"high",
         "source":"Q1 2026 Earnings · Competitor Signal Data",
         "cta_label":"Investigate Reallocation Status",
         "cta_action":"investigate",
         "related_packet_id":None,
         "related_account":"Portfolio · All Segments",
         "delta_value":"~500K ADV freed",
         "confidence":"HIGH",
         "recommended_action_summary":"Confirm auto accounts close the $116M gap — freed capacity must convert to margin, not vacancy.",
         "analysis_by":"TwinX AI · Network & Capacity Intelligence",
         "investigation_payload":{
            "seed_question":"Is the Amazon capacity reallocation executing at the pace the FY guide requires?",
            "ai_response":"The Amazon exit is the most consequential revenue decision in UPS's recent history. Amazon was the single largest customer — **10.6% of FY25 revenue, approximately $9.5B**. Choosing to exit that volume on strategic grounds required a credible thesis that higher-yield replacement volume could be won faster than Amazon volume was lost.\n\n**Three indicators show the thesis is executing:** SMB penetration at a record **34.5%** demonstrates the Digital Access Program is filling the void in the small-shipper segment. Healthcare delivered its first **$3B quarter** — Andlauer and Frigo-Trans acquisitions are generating the premium-yield volume the strategy needed. And RPP is up **6.5% YoY** — the replacement volume is genuinely higher-yield per piece than the Amazon volume it replaced.\n\n**The one pace risk is the Enterprise segment.** Amazon's volume was low-margin but it filled the network efficiently — the replacement Enterprise volume needs to be at higher yield and comparable network utilisation. The five underperforming automotive accounts represent a specific gap: these were accounts that should have been filling the Amazon-freed Enterprise capacity but are running below plan due to FedEx competition and coverage gaps.\n\nThe **network reconfiguration** is the structural enabler: 23 facilities closed in Q1, 27 more in H1. The automated facilities running at 28% lower cost-per-piece need to be fed with higher-yield volume. The Q2 margin recovery (7.5–8.5% guide) depends on this happening.",
            "kpis":[
                {"label":"Amazon FY25 Share","val":"10.6%","sub":"~$9.5B revenue","neg":False},
                {"label":"Q1 ADV Released","val":"~500K","sub":"from network","neg":False},
                {"label":"Glide-Down","val":"Jun 2026","sub":"on track","neg":False},
                {"label":"SMB Penetration","val":"34.5%","sub":"record — working","neg":False},
                {"label":"Healthcare Q1","val":"$3.0B","sub":"first $3B quarter","neg":False},
                {"label":"RPP Growth","val":"+6.5%","sub":"higher-yield mix","neg":False},
            ],
            "follow_ups":[
                {"type":"panel","label":"Why we believe this","panel_key":"evidence"},
                {"type":"chat","label":"Show replacement volume progress","prompt":"Break down the replacement volume by segment — SMB, Healthcare, B2B, Automotive. Show actual vs. plan for each."},
                {"type":"chat","label":"Identify pace risk accounts","prompt":"Which Enterprise accounts are behind on absorbing freed Amazon capacity? Show the gap between expected and actual volume replacement."},
                {"type":"panel","label":"Invite team to investigate","panel_key":"invite-team"},
            ],
            "affected_accounts":["Portfolio · SMB","Portfolio · Healthcare","Portfolio · Enterprise","Portfolio · Automotive"],
            "context_summary":"Amazon exit completing · capacity reallocation · Enterprise pace risk",
            "recommended_action":"Prioritise SMB onboarding fix + Healthcare cold-chain expansion. Accelerate automotive ABM to fill Enterprise gap.",
            "right_panel_views":[
                {"key":"evidence","label":"Why we believe this","title":"Why we believe this — Evidence view","subtitle":"Signals supporting the capacity reallocation assessment.",
                 "content_sections":[
                    {"heading":"Evidence the Reallocation Is Working","body":"**UPS Q1 2026 Earnings Call:** CEO Tomé explicitly framed Amazon exit as 'freed capacity reallocating to higher-yield SMB, Healthcare, B2B, Automotive.'\n\n**SMB at record 34.5%:** CFO Dykes attributed SMB growth to Digital Access Program — not a cyclical effect. Structural acquisition channel now operating at scale.\n\n**Healthcare $3.0B quarter:** Andlauer (Canadian cold-chain) + Frigo-Trans (European cold-chain) fully integrated. Healthcare Q1 on track toward $20B FY target.\n\n**RPP +6.5% YoY:** Revenue per piece up while overall volume declined — definitively proves replacement mix is higher-yield.\n\n**Confidence: HIGH.** Source: UPS Q1 2026 earnings call and 8-K."},
                    {"heading":"Evidence of Pace Risk — Enterprise Gap","body":"Five automotive enterprise accounts $116M below plan — these are precisely the accounts that should absorb freed Enterprise capacity.\n\nAmazon's network utilisation was efficient (large, regular, predictable volumes). Enterprise replacement volume requires higher sales effort per ADV unit.\n\nQ2 margin recovery (7.5–8.5%) requires both cost clearing AND yield improvement from mix-shift. If Enterprise replacement pace slips, the margin leverage is compressed.\n\n**Confidence: MEDIUM.** The risk is real but recoverable if automotive account interventions execute before September contract windows close."},
                 ],
                 "metrics":[
                    {"label":"Reallocation","val":"Working","sub":"3 of 4 indicators"},
                    {"label":"Pace Risk","val":"Enterprise","sub":"auto accounts lagging"},
                    {"label":"Confidence","val":"HIGH","sub":"Q1 earnings source"},
                    {"label":"Recovery Window","val":"Before Sep","sub":"contract windows"},
                 ]},
                {"key":"invite-team","label":"Invite team to investigate","title":"Invite team to investigate — Working Group","subtitle":"Amazon Exit — Capacity Reallocation Review",
                 "content_sections":[
                    {"heading":"Who to Include","body":"• **VP Network Operations** — Capacity reallocation and facility utilisation post-Amazon exit\n• **VP Enterprise Sales — K. Tate** (Enterprise volume pace against Amazon replacement targets)\n• **VP Healthcare Logistics** — Healthcare SMB and enterprise acquisition pace\n• **Head of SMB Marketing** — Digital Access Program throughput and capacity absorption\n• **Finance / Revenue Forecasting** — Q2 margin recovery model sensitivity"},
                    {"heading":"Suggested Questions","body":"• Is the automated facility network running at sufficient utilisation post-Amazon exit, or is there capacity being underused?\n• What is the modeled revenue requirement from Enterprise accounts in Q2 to hit the 7.5–8.5% margin guide?\n• If the five underperforming automotive accounts close their gap by $60M in Q2, does that restore margin to the guide range?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"Amazon Exit — Capacity Reallocation Tracker",
                "subtitle":"Tracking the replacement of Amazon volume with higher-yield SMB, Healthcare, Automotive, and B2B volume.",
                "tables":[
                    {"title":"Replacement Volume — Leading Indicators",
                     "columns":["Indicator","Value","Status"],
                     "rows":[
                        ["SMB Penetration","34.5% — record","Working ✓"],
                        ["Healthcare Q1 Revenue","$3.0B — first $3B quarter","Working ✓"],
                        ["B2B Share","45.2% — 6-year high","Working ✓"],
                        ["RPP Growth","+6.5% YoY — higher-yield mix","Working ✓"],
                        ["Enterprise Auto Gap","5 T1 accounts $116M below plan","Pace Risk ⚠"],
                        ["Ground Saver ADV","–27.7% Q1 (margin-led)","Monitoring"],
                     ]},
                ],
                "charts":[
                    {"type":"stacked_bar","title":"US Domestic ADV by Customer Type (K)","x_key":"quarter",
                     "data_keys":["amazon","enterprise","smb","healthcare"],"colors":["#B0443A","#4A2E1C","#FFB500","#2E7D5B"],
                     "legend_names":["Amazon","Enterprise","SMB","Healthcare"],
                     "data":[
                        {"quarter":"Q3 2025","amazon":580,"enterprise":420,"smb":310,"healthcare":190},
                        {"quarter":"Q4 2025","amazon":520,"enterprise":430,"smb":330,"healthcare":200},
                        {"quarter":"Q1 2026","amazon":400,"enterprise":440,"smb":360,"healthcare":210},
                        {"quarter":"Q2 2026P","amazon":200,"enterprise":460,"smb":390,"healthcare":225},
                     ]},
                ],
                "narrative_sections":[
                    {"heading":"Amazon Exit Status","bullets":[
                        "Amazon FY25 Revenue Share: 10.6% of consolidated revenue (~$9.5B)",
                        "Q1 2026 ADV Reduction: ~500K ADV released from network",
                        "Glide-Down Completion Target: June 2026 — on track",
                        "Prior Amazon Target Revenue Share (FY26): ~5% (halved from FY25)",
                    ]},
                    {"heading":"Pace Risk — Where Reallocation May Be Lagging","bullets":[
                        "Enterprise Automotive Gap: Five T1 accounts $116M below plan — FedEx competition and coverage gaps slowing Enterprise volume replacement",
                        "Q2 Margin Recovery: 4.0% → 7.5–8.5% requires transitional costs clearing AND replacement volume at modeled yield — both must hold",
                        "Ground Saver ADV: –27.7% in Q1 (margin-led retention of high-yield, USPS for lower-yield) — watch SMB migration timing",
                    ]},
                ],
            },
         }},

        # ── STORY 6: Enterprise Pricing & Deal Analyser ──
        {"cxo_id":1, "priority_rank":6, "is_cxo_priority":True, "sort_order":6,
         "tone":"urgent", "tag":"ACTION REQUIRED", "strategy_tag":"Retain",
         "category":"margin", "signal_type":"Override", "group_key":"signals",
         "source_url":None, "source_date":"Jun 7, 2026 · Live",
         "title":"AutoZone Packet 10941 Needs Your Sign-Off — $36M Recoverable",
         "body":"FedEx counter-offer triggered save-play. S2 (Happy Returns bundle) retains at OR 0.67 within guardrails — better than S3.",
         "impact":"high",
         "source":"Digital Deal Analyser · Internal Pricing Data",
         "cta_label":"Review Packet",
         "cta_action":"investigate",
         "cta2_label":"Go to Deal Analyser",
         "cta2_action":"deep-enterprise",
         "related_packet_id":10941,
         "related_account":"AutoZone · Enterprise Portfolio",
         "delta_value":"$36M recoverable",
         "confidence":"HIGH",
         "recommended_action_summary":"Approve S2 (not S3 override) + tighten L1 Accessorial cap 20%→18% portfolio-wide.",
         "analysis_by":"TwinX AI · Pricing Intelligence",
         "investigation_payload":{
            "seed_question":"What are the two pricing decisions sitting with me, and what's the right call on each?",
            "ai_response":"There are two distinct pricing decisions sitting with you this morning. They are related but should be handled separately.\n\n**Decision One — AutoZone Packet 10941 override:** Analyst T. Whitaker has staged S3 on AutoZone's renewal to match FedEx's counter-offer. The scenario technically saves the **$41M account** but breaches the L2 Tier Incentive ceiling by 62 percentage points (81.1% → 143%). At those terms, the operating ratio is **0.70 against your target of 0.62**. The question is: do you approve the override as a single-use exception to retain the account, send it back for a re-work (there is a viable S2 that saves the account at an operating ratio of 0.67 with a bundle — Happy Returns attach), or decline and let FedEx have it?\n\n**Decision Two — L1 Accessorial cap portfolio-wide:** The accessorial discount ceiling is currently **20% Off**. This is the single biggest driver of the 84% → 100% margin realization gap. Every 2 percentage points you tighten the cap recovers approximately **$12M** across the portfolio. Tightening from 20% to 16% — a single guardrail change — recovers approximately **$36M**. It affects all 187 in-flight packets. Three accounts will likely push back: those already at or near the current ceiling.\n\nTogether, these two decisions — the AutoZone override call and the L1 cap tightening — determine whether Enterprise margin realization moves from 84% toward the 90%+ target this quarter or next.",
            "kpis":[
                {"label":"In-Flight Packets","val":"187","sub":"active Analyser Packets","neg":False},
                {"label":"Margin Realization","val":"84%","sub":"target 90%+","neg":True},
                {"label":"Leakage Source","val":"L1 Accessorial","sub":"post-approval concessions","neg":True},
                {"label":"Packets Above OR","val":"23","sub":"require intervention","neg":True},
                {"label":"AutoZone Risk","val":"$41M","sub":"retention decision","neg":True},
                {"label":"L1 Cap Recovery","val":"$36M","sub":"if tightened 20→16%","neg":False},
            ],
            "follow_ups":[
                {"type":"panel","label":"Why we believe this","panel_key":"evidence"},
                {"type":"panel","label":"Show all 187 packets overview","panel_key":"packets-overview"},
                {"type":"chat","label":"Go to Deal Workbench — AutoZone Packet 10941","prompt":"Show me the full scenario comparison for AutoZone Packet 10941: S0 (current terms), S2 (bundle save with Happy Returns), and S3 (override to match FedEx). Include operating ratio, profit, and tier ceiling for each."},
                {"type":"chat","label":"Model L1 guardrail scenarios","prompt":"Model the impact of tightening the L1 Accessorial cap from 20% to 16% across all 187 packets. Which 3 accounts would be above the new ceiling and what are the options for each?"},
                {"type":"panel","label":"Invite team to investigate","panel_key":"invite-team"},
            ],
            "affected_accounts":["AutoZone","Enterprise Portfolio · 187 packets"],
            "context_summary":"Two pricing decisions · AutoZone override + L1 cap tightening · $36M recovery",
            "recommended_action":"Approve AutoZone S2 bundle (not S3 override). Tighten L1 Accessorial cap from 20% to 16% to recover $36M.",
            "right_panel_views":[
                {"key":"evidence","label":"Why we believe this","title":"Why we believe this — Evidence view","subtitle":"Signals supporting the pricing margin leakage diagnosis and L1 guardrail recommendation.",
                 "content_sections":[
                    {"heading":"Margin Leakage — Root Cause Evidence","body":"**Deal Analyser portfolio audit (internal, Q1 2026):** Primary leakage source identified as post-approval accessorial concessions. Analysts and field sales are adding fuel surcharge and delivery area surcharge discounts after the core pricing scenario is approved — outside the formal packet approval process.\n\nCurrent L1 Accessorial cap: 20% Off maximum. Benchmark vs peer carriers and prior UPS pricing cycles suggests 16–18% Off is the appropriate ceiling for the current market.\n\nEvery 2pp tighter: Modeled recovery ~$12M across the 187-packet portfolio. Tightening from 20% to 16% = ~$36M recovery.\n\nAutoZone Packet 10941 provides a live example: The save-play scenario S3 required a 69.5% base discount + accessorial concessions to match FedEx — this is exactly the type of deal that pulls margin realization below modeled.\n\n**Confidence: HIGH.** Root cause corroborated by deal-level data across multiple analysts."},
                    {"heading":"AutoZone Packet 10941 — Override Request Evidence","body":"Analyst T. Whitaker, staged Jun 7, 2026 17:21.\n\n**S0 (Current terms):** OR 0.66, profit $14.0M, Tier TARGET 81.1%.\n**S2 (Recommended bundle save):** OR 0.67, profit $14.4M, Tier TARGET 81.1%. Includes Happy Returns attach that increases ADV by 0.2K and improves overall account economics.\n**S3 (Override requested):** OR 0.70, profit $11.8M, Tier TARGET 143%. Matches FedEx counter. Is the minimum needed to retain AutoZone if no bundle attach is accepted.\n\n**Key question for CCO:** Is S2 (bundle) still on the table with AutoZone? If yes, S3 is not needed. S2 saves the account at better economics than S3.\n\n**Confidence: HIGH.** Source: Live Deal Analyser packet data."},
                 ],
                 "metrics":[
                    {"label":"S0 Profit","val":"$14.0M","sub":"current terms"},
                    {"label":"S2 Profit","val":"$14.4M","sub":"bundle save"},
                    {"label":"S3 Profit","val":"$11.8M","sub":"override match"},
                    {"label":"L1 Recovery","val":"$36M","sub":"20→16% cap"},
                 ]},
                {"key":"packets-overview","label":"Show all 187 packets overview","title":"Enterprise Portfolio — All In-Flight Packets","subtitle":"Bird's eye view of all in-flight Analyser Packets by workstream.",
                 "content_sections":[
                    {"heading":"Portfolio by Workstream","body":"• **Renewals:** 5 packets | Total bid value: $391M | Avg margin: 9.1% | Risk: 1 High (AutoZone), 4 Low\n• **Retention (Save-Plays):** 3 packets | Total bid value: $175M | Avg margin: 7.8% | Risk: 2 Medium, 1 High\n• **Penetration:** 4 packets | Total bid value: $140M | New volume — modeled yield above portfolio average\n• **New Logo:** 4 packets | Total bid value: $94M | All Building Scenarios or Sourced — low urgency"},
                    {"heading":"Packets Requiring CCO Attention","body":"• **CRITICAL:** AutoZone Packet 10941 — L2 override flag. CCO sign-off required. Options: Approve S3, send back with S2 bundle instruction, or decline.\n• **HIGH:** Stellantis Packet 11034 — $48M new logo. Scenario building in progress. Urgency driven by carrier-mix review window being open now.\n• **MEDIUM:** Toyota Packet 10474 — $185M renewal due Aug 31. S3 recommended. All levers within guardrails — timeline tight.\n• **MEDIUM:** Lear Packet 10755 — $76M save-play. FedEx counter active. S2 recommended. Monitoring needed."},
                    {"heading":"CCO Guardrail Control Panel","body":"• **L0 DIM Divisor Floor:** Currently 150. Raised from 145 in Mar 2026. Next review: Sep 2026.\n• **L1 Accessorial Discount Cap:** Currently 20% Off. RECOMMENDATION: Tighten to 16% Off. Recovers $36M. 3 packets affected above new ceiling.\n• **L2 Tier Incentive Ceiling:** Currently TARGET 81.1%. 8 packets requesting above-TARGET — 7 can be resolved without override; AutoZone S3 requires explicit sign-off.\n• **L4 Zone Minimum Posture:** Currently Hold. No change recommended this cycle."},
                 ],
                 "metrics":[
                    {"label":"Total Packets","val":"187","sub":"in-flight"},
                    {"label":"Total Bid Value","val":"$800M","sub":"across workstreams"},
                    {"label":"CCO Attention","val":"4","sub":"packets flagged"},
                    {"label":"L1 Recovery","val":"$36M","sub":"if cap tightened"},
                 ]},
                {"key":"invite-team","label":"Invite team to investigate","title":"Invite team to investigate — Working Group","subtitle":"Enterprise Pricing Discipline & AutoZone Save-Play",
                 "content_sections":[
                    {"heading":"Who to Include","body":"• **VP Revenue Management — R. Patel** (guardrail authority, L1 cap change approval)\n• **Analyst T. Whitaker** — AutoZone Packet 10941 (direct author of the override request)\n• **VP Enterprise Sales** — AutoZone relationship owner (is S2 bundle still on the table?)\n• **CFO / Finance** — L1 cap tightening financial impact sign-off ($36M recovery)\n• **Pricing Committee** — For formal L2 override approval on AutoZone if S3 is chosen"},
                    {"heading":"Share Preview","body":"**Priority:** ACTION REQUIRED | **Observed:** Jun 7, 2026\n\n**Observed Issues:** (1) AutoZone Packet 10941 — analyst T. Whitaker staged S3 to match FedEx counter. Breaches L2 ceiling 81.1% → 143%. OR 0.70 vs target 0.62. $41M account retention decision required. (2) L1 Accessorial cap at 20% Off is primary driver of 84% margin realization. Tightening to 16% recovers ~$36M.\n\n**Suggested Questions:**\n• Is S2 (bundle save with Happy Returns attach) still a viable offer to AutoZone?\n• If S3 is approved, what is the message to the other pricing analysts about L2 ceiling exceptions?\n• Which 3 packets would be above the new L1 ceiling if it moves to 16%?\n• What is the CFO's view on the $36M margin recovery timeline?"},
                 ],
                 "metrics":[]},
            ],
            "default_analytics":{
                "title":"Enterprise Pricing Analytics — Deal Analyser Snapshot",
                "subtitle":"Bird's eye view of all in-flight Analyser Packets. Guardrail adherence, margin realization trajectory, and workstream breakdown.",
                "tables":[
                    {"title":"In-Flight Packets — Top 8 (Automotive)",
                     "columns":["Account","Packet","Bid","Type","Status","Scenario","Delta Profit","Urgency"],
                     "rows":[
                        ["Toyota Motor NA","10474","$185M","Renewal","Pricing Review","S3: L0+L2+L4","+$10.5M","Medium"],
                        ["Magna International","10892","$28M","Penetration","Customer Counter","S2: L0+L4+bundle","+$10.7M","Low"],
                        ["Stellantis NA","11034","$48M","New Logo","Building Scenarios","S2 recommended","+$16.5M","HIGH"],
                        ["Lear Corporation","10755","$76M","Retention","Customer Counter","S2: save vs FedEx","+$1.5M","Medium"],
                        ["Aptiv PLC","10612","$22M","Penetration","APPROVED","S1: bundle attach","+$1.7M","Low"],
                        ["AutoZone","10941","$41M","Retention","OVERRIDE FLAG","S3 breaches L2 (143%)","−$2.2M","CRITICAL"],
                        ["Tesla, Inc.","10883","$14M","New Logo","Building Scenarios","S1: NAAF-premium pilot","+$5.4M","Low"],
                        ["Rivian","10708","$8M","New Logo","Sourced","S1: pilot terms","+$2.7M","Low"],
                     ]},
                    {"title":"CCO Guardrail Control Panel",
                     "columns":["Guardrail","Current","Recommendation","Impact"],
                     "rows":[
                        ["L0 DIM Divisor Floor","150","Next review Sep 2026","Raised from 145 Mar 2026"],
                        ["L1 Accessorial Cap","20% Off","Tighten to 16% Off","Recovers $36M"],
                        ["L2 Tier Incentive Ceiling","TARGET 81.1%","Hold — handle exceptions","8 packets requesting above"],
                        ["L4 Zone Minimum","Hold","No change this cycle","—"],
                     ]},
                ],
                "charts":[
                    {"type":"line","title":"Margin Realization Trajectory (% of Modeled)","x_key":"quarter",
                     "data_keys":["actual","target"],"colors":["#FFB500","#2E7D5B"],
                     "legend_names":["Actual","Target"],
                     "data":[
                        {"quarter":"Q4 FY24","actual":88,"target":90},
                        {"quarter":"Q1 FY25","actual":87,"target":90},
                        {"quarter":"Q2 FY25","actual":86,"target":90},
                        {"quarter":"Q3 FY25","actual":85,"target":90},
                        {"quarter":"Q4 FY25","actual":84,"target":90},
                        {"quarter":"Q1 FY26","actual":84,"target":90},
                        {"quarter":"Q2 FY26P","actual":86,"target":90},
                        {"quarter":"Q3 FY26P","actual":90,"target":90},
                     ]},
                ],
                "narrative_sections":[],
            },
         }},
    ]
    for a in attention:
        db.add(AttentionItem(**a))

    # ── Memory Items (imported from seed_memory.py) ──────────────
    from app.seed_memory import SEED_MEMORY
    for card in SEED_MEMORY:
        db.add(MemoryItem(
            created_at=datetime(2026, 6, 14, 10, 0),
            **card,
        ))

    # ── ABM Account Details (rich per-account data for chat context) ──
    abm_account_details = [
        ABMAccountDetail(
            account_id="FORD", name="Ford Motor Company", tier="T1", subvertical="OEM", abm_tier="1-to-1",
            plan_rev=148, actual_rev=118, gap=-30, gap_pct=-20.3, headroom=92, sow=21, quarters_declining=3,
            root_cause="Ford's first-quarter US production was disrupted by the BlueOval City Tennessee start-up timing slip (now Aug 2026, originally Jun) — softening Detroit-Memphis inbound volume by an estimated 14% in our network. Compounded by FedEx Federal Express segment's 10% Q3 FY26 US domestic revenue growth (Mar 19 8-K) capturing share at lighter weight bands where Ford's aftermarket parts dominate. UPS dedicated account team coverage at Ford was reduced from 2.5 FTE to 1.0 FTE in the Jan 2026 reorganization that accompanied the broader $3B cost-out program — coverage gap visible in 38% YoY decline in executive-level touchpoints.",
            signals=[{"type":"Plant","title":"Ford BlueOval City TN production start delayed to Aug 2026 (per Ford 8-K)","weight":"high"},{"type":"Competitor","title":"FedEx Q3 FY26: US domestic revenue +10%, package volume growing","weight":"high"},{"type":"Coverage","title":"Ford account team coverage reduced 2.5 → 1.0 FTE in Jan 2026 reorg","weight":"high"},{"type":"Fuel","title":"Middle East conflict drove fuel cost spike — Ford inbound corridor exposed","weight":"med"}],
            analog={"name":"General Motors","traits":"Comparable size ($142M actual UPS revenue vs Ford's plan $148M), same Detroit-3 OEM sub-segment, identical JIT inbound logistics dependency, same Tier-1 supplier overlap pattern (Magna, Lear, Aptiv).","behavior":"GM also experienced FedEx encroachment in Q4 2025 but UPS executed a targeted 1-to-1 ABM motion (initiative INI-2025-027, still in-flight) with monthly CCO briefings, dedicated Industry Expert in Detroit, and NAAF capacity lock. Result through Q3 of 4: engagement frequency up 47%, modeled $22M lift trending.","whyResonates":"Same sub-segment, comparable size, identical competitive threat vector. The GM playbook is the most directly transferable — and Ford's procurement reorg makes them more receptive to executive-led engagement right now.","outcomeLift":"+$22M modeled · +4pp win rate · 14% engagement frequency improvement","outcomeQuarters":4},
            marketing={"annualSpend":0.62,"mixHighTouchPct":40,"channels":[{"name":"Executive briefings (1-to-1)","spend":0.14,"roi":5.4,"status":"under-invested"},{"name":"Industry events sponsorship","spend":0.12,"roi":4.1,"status":"baseline"},{"name":"Co-marketing & content","spend":0.08,"roi":3.2,"status":"baseline"},{"name":"Digital ABM (programmatic + LinkedIn)","spend":0.18,"roi":1.8,"status":"over-invested"},{"name":"Field marketing (Detroit)","spend":0.10,"roi":2.6,"status":"baseline"}],"blendedROI":3.0,"benchmarkROI":4.8},
            as_is={"abmBudget":0.62,"execSponsor":1,"accountTeam":1,"industryExpert":1,"channelMix":40,"industryEvents":2,"thoughtLeadership":1,"coMarketing":0,"naafGuarantee":0,"bundle":0,"pilotOffer":0,"peakGuarantee":0},
            recommended={"abmBudget":1.4,"execSponsor":3,"accountTeam":2,"industryExpert":2,"channelMix":65,"industryEvents":4,"thoughtLeadership":2,"coMarketing":2,"naafGuarantee":2,"bundle":2,"pilotOffer":0,"peakGuarantee":1},
            recommended_lift={"rev":24,"winRate":6.2,"cycle":-14,"marketingDelta":0.78,"confidence":"P50 · P10 +$11M / P90 +$38M"},
            play_bullets=["Restore Ford account team coverage from 1.0 FTE to 2.0 FTE; deploy 2nd Industry Expert dedicated to Detroit corridor.","Shift channel mix from 40% high-touch to 65% high-touch — reduce digital programmatic spend, lift executive briefings + industry events.","SVP-level executive sponsorship cadence (monthly), modeled after GM 1-to-1 playbook (initiative INI-2025-027 in-flight).","Hard NAAF Mexico capacity lock + multi-service bundle (NAAF + Brokerage + Capital + Premier) + peak-season SLA-backed guarantee."],
            status="declining",
        ),
        ABMAccountDetail(
            account_id="STLA", name="Stellantis North America", tier="T1", subvertical="OEM", abm_tier="1-to-1",
            plan_rev=110, actual_rev=86, gap=-24, gap_pct=-21.8, headroom=124, sow=16, quarters_declining=2,
            root_cause="Stellantis is the second-most exposed Detroit-3 OEM to the 2025 trade policy shifts that rerouted Asia-to-Mexico flows, and FedEx Freight's June 1, 2026 spin-off has refocused FedEx Federal Express on small-parcel competition exactly where Stellantis-Toluca cross-border volume sits. UPS share-of-wallet at Stellantis is structurally low because the procurement reorg in late 2025 moved logistics decision-making into central Procurement — weakening UPS relationships built with the prior commercial team. Carrier-mix review window now open for the Detroit↔Toluca corridor.",
            signals=[{"type":"Competitive","title":"FedEx Freight spin-off Jun 1, 2026 — FedEx Express refocuses on small-parcel","weight":"high"},{"type":"Trade Policy","title":"2025 trade policy shifts continue rerouting Asia→Americas flows","weight":"high"},{"type":"Customer-org","title":"Stellantis procurement reorg late 2025 — logistics moved to central Procurement","weight":"high"}],
            analog={"name":"Magna International","traits":"Both are heavily exposed to USMCA cross-border (Mexico Tier-1/Tier-2 supplier ecosystem). Magna's UPS revenue is ~$76M actual vs Stellantis $86M actual — comparable scale, comparable Mexico-corridor dependency.","behavior":"UPS turned Magna around (initiative INI-2024-031, Aug 2024 – Mar 2025) with industry-event-led ABM (NAFA + Automotive Logistics Summit sponsorship) paired with CCO-level monthly briefings AND a multi-service bundle (NAAF + Brokerage + Capital). Outcome: +$21M actual revenue vs +$18M modeled, SOW lifted from 24% to 31%.","whyResonates":"Same cross-border exposure, comparable size, same procurement-reorganization vulnerability. The Magna playbook is well-rehearsed and transferable — and UPS Capital trade-finance attach (which worked at Magna) is directly applicable to Stellantis-Toluca.","outcomeLift":"+$21M actual · +9pp win rate · SOW 24% → 31%","outcomeQuarters":3},
            marketing={"annualSpend":0.48,"mixHighTouchPct":35,"channels":[{"name":"Executive briefings (1-to-1)","spend":0.10,"roi":5.8,"status":"under-invested"},{"name":"Industry events sponsorship","spend":0.08,"roi":6.2,"status":"under-invested"},{"name":"Co-marketing & content","spend":0.06,"roi":3.4,"status":"baseline"},{"name":"Digital ABM","spend":0.16,"roi":1.6,"status":"over-invested"},{"name":"Trade-finance pursuit (UPS Capital)","spend":0.08,"roi":7.2,"status":"under-invested"}],"blendedROI":2.8,"benchmarkROI":4.8},
            as_is={"abmBudget":0.48,"execSponsor":1,"accountTeam":1,"industryExpert":0,"channelMix":35,"industryEvents":1,"thoughtLeadership":1,"coMarketing":0,"naafGuarantee":0,"bundle":0,"pilotOffer":0,"peakGuarantee":0},
            recommended={"abmBudget":1.6,"execSponsor":3,"accountTeam":2,"industryExpert":2,"channelMix":70,"industryEvents":4,"thoughtLeadership":2,"coMarketing":2,"naafGuarantee":3,"bundle":3,"pilotOffer":0,"peakGuarantee":0},
            recommended_lift={"rev":28,"winRate":8.4,"cycle":-18,"marketingDelta":1.12,"confidence":"P50 · P10 +$14M / P90 +$44M"},
            play_bullets=["Re-establish executive relationships at central Procurement (post-reorg) — SVP cadence + monthly CCO briefings.","Industry-event-led ABM (NAFA + Automotive Logistics Summit) modeled after Magna playbook (INI-2024-031, +$21M actual).","Premium NAAF Mexico capacity (exclusive lanes) + multi-service bundle including UPS Capital trade-finance attach for Detroit↔Toluca corridor.","2nd Industry Expert deployed to Monterrey · cross-border customs brokerage included in proposal."],
            status="declining",
        ),
        ABMAccountDetail(
            account_id="TSLA", name="Tesla, Inc.", tier="T1", subvertical="EV", abm_tier="1-to-1",
            plan_rev=42, actual_rev=22, gap=-20, gap_pct=-47.6, headroom=68, sow=11, quarters_declining=4,
            root_cause="Tesla's logistics strategy continues shifting toward in-house and regional 3PLs across all production hubs (Fremont, Austin, Sparks NV). Tesla is not exposed to FedEx in the same way as legacy OEMs — Tesla's competitive logistics threat is a build-versus-buy thesis, not carrier substitution. UPS engagement with Tesla supply chain leadership has been transactional rather than strategic, missing the Austin parts hub rebalance opportunity in late 2025.",
            signals=[{"type":"Customer Demand","title":"Tesla Austin parts hub rebalance — preferred-carrier RFP imminent (Q3 timing)","weight":"high"},{"type":"Engagement","title":"UPS engagement at Tesla supply chain has been ad-hoc, not strategic","weight":"high"},{"type":"Healthcare/cold-chain","title":"UPS cold-chain capabilities (Andlauer + Frigo-Trans) relevant to EV battery thermal sensitivity","weight":"med"}],
            analog={"name":"Rivian Automotive","traits":"Both are EV pure-plays with $14–22M UPS revenue (similar small base). Both have in-house logistics aspirations but limited internal capability. Both run lean procurement teams that buy on solution-fit, not pricing.","behavior":"UPS won preferred-carrier status at Rivian through: Class-9 hazmat capability demonstration for battery shipping, cold-chain-adjacent thought leadership, free 8-week pilot program, and customer advisory board seat offered to Rivian's VP Supply Chain. Result: +$11M actual UPS revenue, preferred-carrier status retained 5 quarters.","whyResonates":"Same EV pure-play DNA, comparable small base, same in-house/3PL competitive vector (not FedEx). The Rivian playbook is the only directly proven pattern UPS has for converting an EV manufacturer at this scale.","outcomeLift":"+$11M actual · preferred-carrier status secured · 5 quarter retention","outcomeQuarters":5},
            marketing={"annualSpend":0.18,"mixHighTouchPct":25,"channels":[{"name":"Executive briefings (1-to-1)","spend":0.03,"roi":6.4,"status":"under-invested"},{"name":"Industry events sponsorship","spend":0.02,"roi":5.8,"status":"under-invested"},{"name":"Thought leadership (cold-chain)","spend":0.04,"roi":7.8,"status":"under-invested"},{"name":"Digital ABM","spend":0.06,"roi":1.4,"status":"over-invested"},{"name":"Capability demo (Class-9 hazmat)","spend":0.03,"roi":8.6,"status":"under-invested"}],"blendedROI":4.4,"benchmarkROI":5.6},
            as_is={"abmBudget":0.18,"execSponsor":0,"accountTeam":0.5,"industryExpert":0,"channelMix":25,"industryEvents":1,"thoughtLeadership":1,"coMarketing":0,"naafGuarantee":0,"bundle":0,"pilotOffer":0,"peakGuarantee":0},
            recommended={"abmBudget":0.95,"execSponsor":2,"accountTeam":1.5,"industryExpert":1,"channelMix":60,"industryEvents":3,"thoughtLeadership":3,"coMarketing":2,"naafGuarantee":0,"bundle":1,"pilotOffer":8,"peakGuarantee":0},
            recommended_lift={"rev":18,"winRate":12.4,"cycle":-22,"marketingDelta":0.77,"confidence":"P50 · P10 +$8M / P90 +$32M (high variance)"},
            play_bullets=["Class-9 hazmat capability demonstration for EV battery shipping (Rivian-pattern; we have the credentials).","Cold-chain-adjacent thought leadership (relevant to EV thermal sensitivity) — leverage Andlauer + Frigo-Trans capabilities.","Free 8-week NAAF pilot offer on the Austin corridor + Customer Advisory Board seat for Tesla VP Supply Chain.","VP-level executive sponsorship (Rivian-scale, not CCO) — relationship-and-capability-driven, not pricing-driven."],
            status="declining",
        ),
        ABMAccountDetail(
            account_id="HMNA", name="Honda North America", tier="T1", subvertical="OEM", abm_tier="1-to-1",
            plan_rev=88, actual_rev=67, gap=-21, gap_pct=-23.9, headroom=74, sow=18, quarters_declining=2,
            root_cause="Marysville plant Civic-Accord production schedule shift to Q3 ramp (confirmed via Wards Auto) created a 3-month inbound parts logistics gap that Yusen Logistics — Honda's traditional JIT partner — captured aggressively under an expanded contract. UPS account team coverage at Honda Marysville was reduced from 1.5 FTE to 0.5 FTE in the Jan 2026 reorg, accelerating the relationship erosion. Fuel cost spike from March 2026 Middle East conflict further pressured Honda's already-thin inbound corridor margins.",
            signals=[{"type":"Production","title":"Honda Marysville Civic-Accord schedule shift — Q3 ramp confirmed (Wards Auto)","weight":"high"},{"type":"Competitor","title":"Yusen Logistics expanded JIT contract with Honda Marysville","weight":"high"},{"type":"Coverage","title":"UPS Marysville coverage reduced 1.5 → 0.5 FTE in Jan 2026 reorg","weight":"high"},{"type":"Fuel","title":"Middle East conflict March 2026 — diesel cost pressure on inbound corridor","weight":"med"}],
            analog={"name":"Toyota Motor NA","traits":"Both are Japanese transplant OEMs with ~$70–100M UPS revenue range (Toyota actual $104M, Honda actual $67M). Both run JIT-intensive operations from US assembly plants (Toyota Georgetown KY vs Honda Marysville OH).","behavior":"UPS executed a production-cadence-aligned 1-to-1 ABM motion at Toyota (initiative INI-2025-014, completed Sep 2025): dedicated Industry Expert deployed to Georgetown, JIT operational playbook delivered, multi-year contract incentive with growth-triggered rebate. Result: +$14M actual revenue (vs +$16M modeled), +4.4pp win rate.","whyResonates":"Same Japanese transplant DNA, comparable JIT dependency, same plant-cadence-driven inbound logistics shape. Honda has the same conditions for the playbook to work, and the Marysville Q3 ramp creates a natural moment to deploy.","outcomeLift":"+$14M actual · +4.4pp win rate · +$2.90 RPP","outcomeQuarters":4},
            marketing={"annualSpend":0.34,"mixHighTouchPct":32,"channels":[{"name":"Executive briefings (1-to-1)","spend":0.06,"roi":5.2,"status":"under-invested"},{"name":"Industry events sponsorship","spend":0.04,"roi":4.4,"status":"baseline"},{"name":"JIT operational playbook (custom)","spend":0.08,"roi":6.8,"status":"under-invested"},{"name":"Digital ABM","spend":0.10,"roi":1.4,"status":"over-invested"},{"name":"Field marketing (Marysville)","spend":0.06,"roi":3.6,"status":"baseline"}],"blendedROI":3.2,"benchmarkROI":4.6},
            as_is={"abmBudget":0.34,"execSponsor":1,"accountTeam":0.5,"industryExpert":0,"channelMix":32,"industryEvents":1,"thoughtLeadership":1,"coMarketing":0,"naafGuarantee":0,"bundle":0,"pilotOffer":0,"peakGuarantee":0},
            recommended={"abmBudget":1.2,"execSponsor":2,"accountTeam":2,"industryExpert":1,"channelMix":62,"industryEvents":4,"thoughtLeadership":2,"coMarketing":1,"naafGuarantee":1,"bundle":2,"pilotOffer":0,"peakGuarantee":1},
            recommended_lift={"rev":21,"winRate":5.8,"cycle":-12,"marketingDelta":0.86,"confidence":"P50 · P10 +$10M / P90 +$34M"},
            play_bullets=["Restore Marysville coverage from 0.5 FTE to 2.0 FTE ahead of Q3 Civic-Accord ramp.","Production-cadence-aligned JIT operational playbook (Toyota analog, INI-2025-014 +$14M actual).","Industry Expert dedicated to Marysville · multi-year contract incentive with growth-triggered rebate.","Soft NAAF capacity guarantee + multi-service bundle + SLA-backed peak-season performance guarantee."],
            status="declining",
        ),
        ABMAccountDetail(
            account_id="AZO", name="AutoZone", tier="T2", subvertical="Aftermarket", abm_tier="1-to-few",
            plan_rev=58, actual_rev=41, gap=-17, gap_pct=-29.3, headroom=48, sow=17, quarters_declining=3,
            root_cause="AutoZone's Q3 2025 earnings call explicit signal of carrier-diversification review created an immediate FedEx counter-offer cycle, and FedEx's 8.5% base discount with 24-month lock pressured UPS pricing posture below the L2 Tier ceiling. UPS treated AutoZone as 1-to-few ABM tier despite the carrier-mix review being a 1-to-1 strategic event — marketing investment misallocated to digital programmatic instead of executive engagement. Approaching aftermarket peak season (Aug-Oct) is the last retention window.",
            signals=[{"type":"Customer Demand","title":"AutoZone Q3 2025 earnings: 'reviewing carrier diversification'","weight":"high"},{"type":"Competitor","title":"FedEx counter-offer at -8.5% base disc with 24-mo lock","weight":"high"},{"type":"ABM-tier","title":"AutoZone treated as 1-to-few ABM tier despite 1-to-1 strategic event","weight":"high"},{"type":"Seasonality","title":"Aftermarket peak Aug-Oct — retention window narrowing","weight":"med"}],
            analog={"name":"O'Reilly Automotive","traits":"Direct comparable in T2 aftermarket distribution — O'Reilly actual UPS revenue $36M vs AutoZone $41M, both have identical national distribution footprint, both run reverse-logistics-intensive operations.","behavior":"UPS retained O'Reilly through a 1-to-1 ABM re-tier with: Happy Returns reverse-logistics bundle promotion, executive sponsorship from CCO + VP Aftermarket Sales, peak-season capacity guarantee. Result: +$8M ADV, retention secured, +$1.80 RPP.","whyResonates":"Same T2 aftermarket sub-vertical, comparable size, identical reverse-logistics need (which Happy Returns acquisition uniquely addresses). The O'Reilly playbook is the most directly applicable retention pattern — and the peak-season timing aligns naturally.","outcomeLift":"+$8M ADV · retention secured · +$1.80 RPP","outcomeQuarters":2},
            marketing={"annualSpend":0.22,"mixHighTouchPct":30,"channels":[{"name":"Executive briefings","spend":0.02,"roi":5.4,"status":"under-invested"},{"name":"Happy Returns reverse logistics ABM","spend":0.04,"roi":7.2,"status":"under-invested"},{"name":"Co-marketing & content","spend":0.04,"roi":3.8,"status":"baseline"},{"name":"Digital ABM","spend":0.08,"roi":1.6,"status":"over-invested"},{"name":"Field marketing","spend":0.04,"roi":2.4,"status":"baseline"}],"blendedROI":3.0,"benchmarkROI":4.4},
            as_is={"abmBudget":0.22,"execSponsor":0,"accountTeam":0.5,"industryExpert":0,"channelMix":30,"industryEvents":1,"thoughtLeadership":0,"coMarketing":0,"naafGuarantee":0,"bundle":0,"pilotOffer":0,"peakGuarantee":0},
            recommended={"abmBudget":0.85,"execSponsor":3,"accountTeam":1.5,"industryExpert":1,"channelMix":60,"industryEvents":2,"thoughtLeadership":1,"coMarketing":2,"naafGuarantee":0,"bundle":3,"pilotOffer":0,"peakGuarantee":1},
            recommended_lift={"rev":14,"winRate":9.6,"cycle":-8,"marketingDelta":0.63,"confidence":"P50 · P10 +$7M / P90 +$24M"},
            play_bullets=["Re-tier AutoZone from 1-to-few to 1-to-1 ABM — escalate to SVP-level executive sponsorship (Matt + VP Aftermarket Sales).","Happy Returns reverse-logistics bundle promotion (O'Reilly-pattern, +$8M actual; addresses AutoZone's aftermarket peak need).","Peak-season SLA-backed capacity guarantee (Aug–Oct) — direct counter to FedEx 24-month lock offer.","Co-marketing case study + Industry Expert paired with the account · 1 Industry Expert assigned to the aftermarket cohort."],
            status="declining",
        ),
    ]
    for ad in abm_account_details:
        db.add(ad)

    # ── ABM Initiative Details (historical + in-flight initiatives) ──
    abm_initiative_details = [
        ABMInitiativeDetail(
            initiative_id="INI-2024-031", name="Magna 1-to-1 ABM + NAFA event sponsorship", account="Magna International",
            status="completed", stage="Outcome measured", owner="Sreekar Pothula (Sr. Director, Auto Mktg)",
            created_date="Aug 12, 2024", end_date="Mar 28, 2025", modeled_rev=18, actual_rev=21, modeled_win_rate=8.0, actual_win_rate=9.2,
            notes="Outperformed. Magna lifted SOW from 24% to 31%. Industry-event-led ABM scored highly.",
            levers=["Industry events (4)","1-to-1 ABM ($1.2M)","CCO sponsorship","Bundle promotion"],
            what_worked="NAFA NACFE event sponsorship + CCO appearance unlocked C-suite engagement that direct 1-to-1 ABM wasn't reaching. Pipeline qualified above modeled by 18%.",
            what_didnt_work="Bundle promotion underperformed by ≈15% vs. modeled — cannibalized standalone service revenue rather than expanding wallet. Net-new revenue from the bundle was thin.",
            lesson_learned="For OEM Tier-1, lead with industry events + CCO sponsorship (highest ROI lever). Treat bundle promo as a secondary, not primary, motion.",
        ),
        ABMInitiativeDetail(
            initiative_id="INI-2025-014", name="Toyota production-cadence-aligned ABM playbook", account="Toyota Motor NA",
            status="completed", stage="Outcome measured", owner="Hashir Khan (VP, NA Strategic Mktg)",
            created_date="Mar 5, 2025", end_date="Sep 22, 2025", modeled_rev=16, actual_rev=14, modeled_win_rate=5.0, actual_win_rate=4.4,
            notes="Slightly below plan. JIT operational playbook landed well but cycle was longer than modeled.",
            levers=["Industry expert deployment","Multi-year contract incentive","Production-aligned cadence"],
            what_worked="JIT operational playbook resonated with logistics ops · monthly engagement frequency up 38%. Industry expert in Aichi territory built durable relationships.",
            what_didnt_work="Production-cadence alignment stretched sales cycle by ≈3 months vs. modeled. Multi-year incentive economics weren't compelling enough to compress timing.",
            lesson_learned="When aligning to customer production cadence, plan for 25–30% cycle drag in the modeled outcome. Reserve multi-year incentives for incremental capture only — not for closing speed.",
        ),
        ABMInitiativeDetail(
            initiative_id="INI-2025-027", name="GM Detroit corridor — CCO + VP-Sales executive cadence", account="General Motors",
            status="in-execution", stage="Quarter 3 of 4 in-flight", owner="Pankaj Verma (Director, OEM Marketing)",
            created_date="Oct 14, 2025", end_date="Jul 30, 2026", modeled_rev=22, actual_rev=18, modeled_win_rate=4.0, actual_win_rate=3.2,
            notes="On track at quarter 3 of 4. Leading indicators positive (engagement frequency +47%).",
            levers=["Monthly CCO briefing","Industry expert (2)","NAAF capacity lock","Field marketing Detroit"],
            what_worked="Monthly CCO briefings + Detroit Industry Expert deployment lifted engagement frequency +47% — the single most powerful leading indicator. Closed-won pipeline conversion visibly trending toward plan.",
            what_didnt_work="NAAF capacity lock alone didn't unlock new volume in Q1–Q2 — it protected existing share but didn't generate net-new without a bundled commercial offer attached.",
            lesson_learned="CCO briefing cadence is the highest-leverage lever for OEM Tier-1 — keep it as the spine of any ABM ramp. Pair NAAF capacity with explicit commercial action; don't expect capacity protection to drive lift on its own.",
        ),
        ABMInitiativeDetail(
            initiative_id="INI-2026-002", name="Aptiv penetration play — UPS Capital cross-sell ABM", account="Aptiv PLC",
            status="in-execution", stage="Quarter 2 of 3 in-flight", owner="Sreekar Pothula (Sr. Director, Auto Mktg)",
            created_date="Feb 18, 2026", end_date="Nov 30, 2026", modeled_rev=8, actual_rev=6, modeled_win_rate=6.0, actual_win_rate=4.8,
            notes="Cross-sell traction below plan; Capital attach slower than modeled.",
            levers=["Co-marketing (case study)","Solution architect overlay","Cross-sell bundle"],
            what_worked="Solution architect overlay opened CFO-level conversations that direct sales hadn't reached. Case-study co-marketing earned strong Aptiv-side advocacy.",
            what_didnt_work="Capital cross-sell attach rate at 40% of target. New VP Logistics (ex-Penske) brought a different buying committee dynamic that the original playbook didn't account for.",
            lesson_learned="When a key buyer changes at the customer, refresh the playbook before continuing — new buying committee dynamics can change cross-sell economics materially. Build a buyer-change trigger into ABM review cadence.",
        ),
    ]
    for ini in abm_initiative_details:
        db.add(ini)

    # ── Wargame Competitors ──────────────────────────────────────
    wargame_competitors = [
        WargameCompetitor(
            name="FedEx",
            market_share="29%",
            threat_level="HIGH",
            tier="T1",
            positioning="Largest US parcel competitor. Consolidating Ground/Express into unified network (Network 2.0) to cut $4B in costs by 2027. Aggressive on B2B pricing and automotive-specific services.",
            strengths=[
                "Global air network with 700+ aircraft",
                "Ground economy scale — largest US ground fleet",
                "SmartPost density for lightweight e-commerce",
                "Strong automotive parts logistics (Auto Express launch)"
            ],
            weaknesses=[
                "Integration complexity post-TNT acquisition",
                "Margin pressure from Ground yield compression",
                "Network 2.0 execution risk — driver reclassification lawsuits",
                "Lagging behind on healthcare cold-chain infrastructure"
            ],
            recent_moves=[
                "Launched 'FedEx Auto Express' — dedicated automotive parts service, 6 days ahead of NAAF",
                "Network 2.0 restructuring: consolidating Ground and Express into single operating unit",
                "Aggressive RPP discounting on Top 50 lanes targeting UPS enterprise accounts",
                "Expanded Sunday delivery to 95% of US population"
            ],
            scenarios=[
                {"title": "FedEx undercuts RPP by 8% on Top 50 enterprise lanes", "impact_assessment": "Could erode $180M in annual revenue from T1 accounts. Ford, GM, and Stellantis all have multi-carrier contracts making them vulnerable to price-based switching.", "recommended_response": "Activate retention playbooks on at-risk T1 accounts. Lead with service differentiation (on-time performance, dedicated reps) rather than matching price. Consider targeted RPP adjustments on top 10 at-risk lanes only."},
                {"title": "Network 2.0 consolidation succeeds — FedEx achieves $4B cost advantage", "impact_assessment": "A unified FedEx network with 15-20% lower operating costs fundamentally changes competitive dynamics. They could sustain lower pricing indefinitely while maintaining margins.", "recommended_response": "Accelerate UPS smart logistics automation investments. Differentiate on specialized services (healthcare, dangerous goods, returns) where network consolidation provides no advantage. Lock in 3-year enterprise commitments before FedEx realizes cost savings."},
                {"title": "FedEx acquires a regional last-mile carrier", "impact_assessment": "Would fill their rural/suburban delivery gap and threaten UPS SurePost volumes. Estimated impact: -$90M in lightweight parcel revenue over 18 months.", "recommended_response": "Strengthen SurePost partnerships with USPS. Invest in UPS Access Point network density. Proactively lock SMB accounts with volume commitment discounts."}
            ],
            sort_order=1,
        ),
        WargameCompetitor(
            name="Amazon Logistics",
            market_share="12%",
            threat_level="HIGH",
            tier="T1",
            positioning="Fastest-growing parcel carrier in US. Vertically integrated with Amazon marketplace. Building independent delivery network that increasingly serves third-party shippers. Focus on speed and last-mile density.",
            strengths=[
                "Last-mile delivery density — 150+ delivery stations in US",
                "Volume guarantee from Amazon marketplace (5B+ packages/yr)",
                "Superior technology stack — real-time routing, customer experience",
                "Same-day and next-day capability in 90% of metro areas"
            ],
            weaknesses=[
                "No B2B or healthcare logistics capability",
                "Limited international presence outside UK/DE/JP",
                "Cannot handle dangerous goods or high-value freight",
                "DSP contractor model creates service consistency issues"
            ],
            recent_moves=[
                "DSP expansion to 15 new metro areas — building rural delivery capability",
                "Same-day delivery hub construction in 6 Tier-2 cities",
                "AMZL rural expansion targeting USPS-dependent ZIP codes",
                "Testing third-party shipper acceptance program (Buy with Prime logistics)"
            ],
            scenarios=[
                {"title": "Amazon enters B2B logistics via 'Fulfilled by Amazon' expansion", "impact_assessment": "If Amazon offers B2B parcel service at 20% below market, could capture $2B in SMB volume within 24 months. UPS SMB backfill plan ($4.2B target) becomes unachievable.", "recommended_response": "Accelerate SMB digital acquisition. Lead with integrated returns, dangerous goods, and international — services Amazon cannot offer. Deepen DAP (Delivery Access Point) network as differentiation."},
                {"title": "Amazon offers 20% below-market pricing for SMB shippers", "impact_assessment": "Direct threat to UPS Digital Access Program and SMB segment growth. Could erode 8-12% of newly acquired SMB cohort within first year of launch.", "recommended_response": "Do not compete on price against Amazon subsidized logistics. Double down on service reliability, insurance, and multi-carrier flexibility messaging. Target SMB segments Amazon cannot serve (hazmat, alcohol, pharma)."}
            ],
            sort_order=2,
        ),
        WargameCompetitor(
            name="DHL",
            market_share="8%",
            threat_level="MEDIUM",
            tier="T2",
            positioning="International logistics leader with growing US presence. Dominant in cross-border e-commerce and healthcare/pharma supply chain. Partnering with USPS for US domestic last-mile.",
            strengths=[
                "International network dominance — #1 in cross-border logistics",
                "Supply chain consulting and managed logistics expertise",
                "Healthcare and pharma cold-chain leadership (GDP-certified)",
                "Strong European and Asian trade lane coverage"
            ],
            weaknesses=[
                "Limited US domestic ground network — relies on USPS partnership",
                "Premium pricing positions them out of commodity parcel market",
                "Smaller US sales force and account coverage",
                "No competitive US next-day air offering"
            ],
            recent_moves=[
                "DHL eCommerce Solutions US expansion — 8 new distribution centers",
                "$500M cold-chain investment for pharma logistics in Americas",
                "Partnership with Shopify for cross-border e-commerce fulfillment",
                "Launched 'DHL Express Commerce' targeting US-to-EU SMB shippers"
            ],
            scenarios=[
                {"title": "DHL acquires a mid-size US regional carrier", "impact_assessment": "Would instantly give DHL domestic US ground capability. Threat primarily to UPS International segment where DHL already competes. Estimated $300M revenue at risk in cross-border and healthcare.", "recommended_response": "Strengthen healthcare logistics partnerships and expand Premier cold-chain offering. Lock in long-term contracts with pharma clients. Leverage UPS end-to-end domestic+international advantage that DHL cannot match even with acquisition."},
                {"title": "DHL undercuts healthcare logistics pricing by 15%", "impact_assessment": "Direct threat to UPS Healthcare division ($3B quarterly revenue). Could lose 10-15% of pharma logistics contracts at renewal. Temperature-controlled and clinical trial logistics are highest-margin services.", "recommended_response": "Invest in GDP certification expansion and IoT tracking capabilities. Emphasize UPS regulatory compliance track record and US domestic healthcare delivery density that DHL cannot replicate."}
            ],
            sort_order=3,
        ),
        WargameCompetitor(
            name="USPS",
            market_share="31%",
            threat_level="MEDIUM",
            tier="T1",
            positioning="US government postal service with universal coverage obligation. Largest parcel carrier by volume. DeJoy 10-year modernization plan aims to transform into competitive package delivery network.",
            strengths=[
                "Universal coverage — reaches every US address including PO boxes",
                "Last-mile mailbox access monopoly — lowest rural delivery cost",
                "Lowest per-package cost for lightweight parcels under 1 lb",
                "Massive infrastructure: 31,000 post offices, 230,000 delivery routes"
            ],
            weaknesses=[
                "Service reliability concerns — on-time rates below FedEx/UPS",
                "No premium time-definite service (no guaranteed next-day)",
                "Financial instability — pension obligations and declining mail volume",
                "Limited technology investment and tracking capabilities"
            ],
            recent_moves=[
                "DeJoy 10-year Delivering for America plan — $40B modernization",
                "New Next Generation Delivery Vehicle (NGDV) fleet rollout — 60K electric vehicles",
                "Sunday and holiday delivery expansion for Amazon and commercial shippers",
                "USPS Ground Advantage product launch — consolidating retail/commercial ground"
            ],
            scenarios=[
                {"title": "USPS modernization succeeds — reliable 2-day ground nationwide", "impact_assessment": "If USPS achieves consistent 2-day delivery with NGDV fleet, their cost advantage becomes decisive for price-sensitive shippers. Could capture additional 5-8% market share from UPS Ground economy segment.", "recommended_response": "Differentiate on guaranteed service levels, enterprise account management, and specialized services. Position UPS Ground as premium-reliable vs USPS Ground Advantage. Maintain SurePost partnership while hedging with alternative last-mile options."},
                {"title": "USPS raises rates 15% to fund pension obligations", "impact_assessment": "Creates opportunity for UPS to capture price-sensitive volume that shifts away from USPS. Estimated $500M-$800M addressable volume becomes competitive. SurePost economics also shift favorably.", "recommended_response": "Proactively target USPS-heavy shippers with competitive UPS Ground proposals. Adjust SurePost pricing to maintain margin advantage. Launch targeted SMB acquisition campaign in ZIP codes with highest USPS commercial volume."}
            ],
            sort_order=4,
        ),
    ]
    for wc in wargame_competitors:
        db.add(wc)

    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
