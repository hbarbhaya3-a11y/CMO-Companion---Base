"""Shared context builder — provides full portfolio data to both chat and simulation."""
from sqlalchemy.orm import Session
from app.models import domain as models
from app.models import abm as abm_models
from app.models import enterprise as ent_models
from app.models.domain import AttentionItem
from app.models.abm import ABMAccountDetail


def build_full_context(db: Session, cxo_id: int) -> str:
    """Rich context block with all portfolio data for LLM grounding."""
    cxo = db.query(models.CXO).filter(models.CXO.id == cxo_id).first()
    if not cxo:
        return ""

    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    kpis = db.query(models.KPI).filter(models.KPI.cxo_id == cxo_id).all()
    signals = db.query(models.Signal).filter(
        models.Signal.cxo_id == cxo_id,
        models.Signal.is_row2 == False,
    ).all()

    kpi_lines = "\n".join([
        f"  - {k.label}: {k.val} ({k.sub}) — {k.note}" for k in kpis
    ])
    signal_lines = "\n".join([
        f"  - [{s.tag}] {s.title}: {s.delta or ''} — {s.desc or ''}" for s in signals[:5]
    ])

    # Attention items (home cards)
    attn = (db.query(AttentionItem)
            .filter(AttentionItem.cxo_id == cxo_id)
            .order_by(AttentionItem.priority_rank).limit(6).all())
    attn_lines = "\n".join([
        f"  - [{a.signal_type or a.category}] {a.title} — {(a.body or '')[:120]}... (Delta: {a.delta_value or '—'}, Impact: {a.impact or '—'})" for a in attn
    ]) if attn else "  (none)"

    # ABM accounts
    accounts = db.query(abm_models.AutoAccount).all()
    account_lines = "\n".join([
        f"  - {a.name}: Tier={a.tier}, Spend=${a.spend:.0f}M, SoW={a.sow}%, Headroom=${a.headroom:.0f}M, Health={a.health}, Opps={a.opps}, ABM={a.abm}, Milestone={a.milestone}" for a in accounts
    ]) if accounts else "  (none)"

    account_chart_table = ""
    if accounts:
        account_chart_table = "Account Spend & Headroom:\n"
        account_chart_table += "  | Account | Spend($M) | Headroom($M) | SoW(%) | Health |\n"
        for a in accounts:
            account_chart_table += f"  | {a.name} | {a.spend:.1f} | {a.headroom:.1f} | {a.sow} | {a.health} |\n"

    # ABM account details (declining)
    acct_details = db.query(ABMAccountDetail).all()
    declining_lines = "\n".join([
        f"  - {a.name}: gap {a.gap_pct:+.1f}%, {a.quarters_declining}Q declining, root cause: {a.root_cause or '—'}" for a in acct_details
    ]) if acct_details else "  (none)"

    # ABM subsegments
    subsegments = db.query(abm_models.AutoSubsegment).all()
    subseg_lines = "\n".join([
        f"  - {s.name}: Rev=${s.rev:.0f}M, ADV={s.adv}, RPP=${s.rpp:.2f}, Margin={s.margin}%, SoW={s.sow}%, Status={s.status}" for s in subsegments
    ]) if subsegments else "  (none)"

    subseg_chart_table = ""
    if subsegments:
        subseg_chart_table = "Subsegment Performance:\n"
        subseg_chart_table += "  | Subsegment | Revenue($M) | Margin(%) | RPP($) | SoW(%) |\n"
        for s in subsegments:
            subseg_chart_table += f"  | {s.name} | {s.rev:.1f} | {s.margin} | {s.rpp:.2f} | {s.sow} |\n"

    # ABM KPIs
    abm_kpis = db.query(abm_models.AutoKPI).all()
    abm_kpi_lines = "\n".join([
        f"  - {k.label}: {k.value} ({k.sub}), Delta: {k.delta} {k.delta_label or ''}" for k in abm_kpis
    ]) if abm_kpis else "  (none)"

    # Market signals
    mkt_signals = db.query(abm_models.AutoMarketSignal).all()
    mkt_lines = "\n".join([
        f"  - [{s.type}] {s.title} (Impact: {s.impact}, Conf: {s.conf}) — {s.why or ''} | Affected: {', '.join(s.accounts) if s.accounts else 'N/A'}" for s in mkt_signals
    ]) if mkt_signals else "  (none)"

    # Enterprise deals
    ent_deals = db.query(ent_models.EntStrategicDeal).all()
    deal_table = ""
    if ent_deals:
        deal_table = "Enterprise Deal Pipeline:\n"
        deal_table += "  | Customer | Value($M) | Workstream | Stage | Margin(%) | DaysToClose |\n"
        for d in ent_deals:
            deal_table += f"  | {d.customer} | {d.value:.0f} | {d.workstream} | {d.stage} | {d.current_margin:.1f} | {d.days_to_close} |\n"

    # Margin trajectory
    margins = db.query(ent_models.EntMarginTrajectory).order_by(ent_models.EntMarginTrajectory.sort_order).all()
    margin_table = ""
    if margins:
        margin_table = "Margin Trajectory Over Time:\n"
        margin_table += "  | Quarter | Plan(%) | Actual(%) | Recovery(%) |\n"
        for m in margins:
            margin_table += f"  | {m.quarter} | {m.plan_margin or '-'} | {m.actual_margin or '-'} | {m.recovery_margin or '-'} |\n"

    # Enterprise KPIs
    ent_kpis = db.query(ent_models.EnterpriseKPI).all()
    ent_kpi_lines = ""
    if ent_kpis:
        ent_kpi_lines = "Enterprise KPIs:\n" + "\n".join([
            f"  - {k.label}: {k.value} (Delta: {k.delta})" for k in ent_kpis
        ])

    # Pipeline stages
    pipeline = db.query(ent_models.EntPipelineStage).all()
    pipeline_table = ""
    if pipeline:
        pipeline_table = "Deal Pipeline by Stage:\n"
        pipeline_table += "  | Stage | Count |\n"
        for p in pipeline:
            pipeline_table += f"  | {p.stage} | {p.count} |\n"

    return f"""INTERNAL BUSINESS DATA (USE THIS AS PRIMARY SOURCE):
Executive: {cxo.name}, {cxo.title} at {firm.name if firm else 'UPS'}

Current KPIs:
{kpi_lines}

Active Signals:
{signal_lines}

Attention Items (Home Cards):
{attn_lines}

Declining Accounts (Detail):
{declining_lines}

Automotive Segment KPIs:
{abm_kpi_lines}

Automotive Subsegments:
{subseg_lines}

Strategic Accounts (Automotive):
{account_lines}

{ent_kpi_lines}

Market Intelligence Signals:
{mkt_lines}

{account_chart_table}
{subseg_chart_table}
{deal_table}
{margin_table}
{pipeline_table}

Key Facts:
  - US Domestic revenue $14.1B, down 2.3% YoY
  - Revenue per piece up 6.5% YoY to $15.32
  - US Domestic adjusted operating margin 4.0% (target: 7.5-8.5%)
  - Amazon glide-down completing; SMB ADV +1.6% YoY
  - SMB penetration 34.5% of US volume (record), B2B 45.2% (6-yr high)
  - Healthcare revenue $3.04B quarterly (record), RPP $22.80
  - $50M committed to automotive/industrial logistics transformation
  - NAAF Mexico launch August 2026
  - FedEx US domestic revenue +10% (while UPS -2.3%)
  - 50 facility closures in H1, 28% lower cost-per-piece in automated facilities
  - Strategic shift: fewer, better, more profitable volume
"""


def build_brief_context(db: Session, cxo_id: int) -> str:
    """Lightweight context for alignment briefs — KPIs + key accounts + key facts only."""
    cxo = db.query(models.CXO).filter(models.CXO.id == cxo_id).first()
    if not cxo:
        return ""

    firm = db.query(models.Firm).filter(models.Firm.id == cxo.firm_id).first()
    kpis = db.query(models.KPI).filter(models.KPI.cxo_id == cxo_id).all()
    kpi_lines = "\n".join([f"  - {k.label}: {k.val} ({k.sub})" for k in kpis])

    accounts = db.query(abm_models.AutoAccount).all()
    account_lines = "\n".join([
        f"  - {a.name}: Spend=${a.spend:.0f}M, SoW={a.sow}%, Headroom=${a.headroom:.0f}M, Health={a.health}" for a in accounts
    ]) if accounts else "  (none)"

    acct_details = db.query(ABMAccountDetail).all()
    declining_lines = "\n".join([
        f"  - {a.name}: gap {a.gap_pct:+.1f}%, {a.quarters_declining}Q declining" for a in acct_details
    ]) if acct_details else "  (none)"

    abm_kpis = db.query(abm_models.AutoKPI).all()
    abm_kpi_lines = "\n".join([
        f"  - {k.label}: {k.value} ({k.sub})" for k in abm_kpis
    ]) if abm_kpis else "  (none)"

    return f"""Executive: {cxo.name}, {cxo.title} at {firm.name if firm else 'UPS'}

KPIs:
{kpi_lines}

Accounts:
{account_lines}

Declining:
{declining_lines}

Segment KPIs:
{abm_kpi_lines}

Key Facts: US Domestic rev $14.1B (-2.3% YoY), RPP $15.32 (+6.5%), op margin 4.0% (target 7.5-8.5%), SMB penetration 34.5% (record), Healthcare $3.04B (record), NAAF Mexico launch Aug 2026, FedEx US domestic +10%, $50M automotive transformation committed.
"""
