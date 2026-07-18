import random
import math
from typing import Dict, List, Optional
from app.schemas.deep_simulation import (
    LeverSetting, MetricBand, LeverResult, SensitivityItem,
    TimeSeriesPoint, ComparisonData, ComparisonPath, InteractionWarning,
)

METRICS = ["revenue", "margin", "win_rate", "volume", "cycle_time", "cac"]

INTERACTION_EFFECTS = {
    ("abm_budget", "tier_allocation"): {
        "type": "synergy",
        "multiplier": 1.15,
        "metrics": ["revenue", "win_rate"],
        "message": "ABM budget increase combined with Tier-1 allocation shift amplifies pipeline quality — synergy +15%.",
    },
    ("digital_reactivation", "onboarding_fix"): {
        "type": "synergy",
        "multiplier": 1.22,
        "metrics": ["revenue", "volume"],
        "message": "Digital reactivation + onboarding fix compound: reactivated users convert better with smoother onboarding — synergy +22%.",
    },
    ("base_discount_band", "accessorial_caps"): {
        "type": "compression",
        "multiplier": 0.82,
        "metrics": ["margin"],
        "message": "Widening both base discount AND accessorial caps creates non-additive margin compression — combined effect is 18% less than sum of parts.",
        "severity": "warning",
    },
    ("base_discount_band", "contract_term"): {
        "type": "compression",
        "multiplier": 0.88,
        "metrics": ["margin"],
        "message": "Increasing base discount while extending contract terms: combined margin effect is non-additive — see breakdown.",
        "severity": "warning",
    },
    ("naaf_capacity", "customs_brokerage"): {
        "type": "synergy",
        "multiplier": 1.18,
        "metrics": ["revenue", "volume"],
        "message": "NAAF Mexico capacity + customs brokerage bundling drives cross-border deal capture — synergy +18%.",
    },
    ("industry_experts", "exec_sponsorship"): {
        "type": "synergy",
        "multiplier": 1.12,
        "metrics": ["win_rate", "cycle_time"],
        "message": "Industry experts paired with executive sponsorship accelerate Tier-1 deal velocity — synergy +12%.",
    },
    ("renewal_uplift", "competitive_response"): {
        "type": "tension",
        "multiplier": 0.90,
        "metrics": ["win_rate", "revenue"],
        "message": "Aggressive renewal uplift with tight competitive response creates pricing tension — net effect reduced 10%. Consider sequencing.",
        "severity": "critical",
    },
    ("analyst_headcount", "deal_analyser_threshold"): {
        "type": "synergy",
        "multiplier": 1.10,
        "metrics": ["margin", "win_rate"],
        "message": "More analysts + lower Deal Analyser threshold expands pricing coverage — margin realization improves.",
    },
    ("service_mix_push", "bundling_rules"): {
        "type": "synergy",
        "multiplier": 1.20,
        "metrics": ["revenue", "margin"],
        "message": "Service-mix push + bundling incentives create attach-rate uplift — synergy +20%.",
    },
}

PRESET_SCENARIOS = {
    "conservative": {
        "name": "Conservative Recovery",
        "description": "Low-risk levers only — digital reactivation, lifecycle pricing, minimal budget increase.",
        "budget_factor": 0.85,
        "lever_scale": 0.4,
    },
    "recommended": {
        "name": "Recommended Scenario",
        "description": "Balanced portfolio — activation sprint + digital + regional pricing + moderate capacity shift.",
        "budget_factor": 1.0,
        "lever_scale": 0.7,
    },
    "aggressive": {
        "name": "Aggressive Recovery",
        "description": "Full lever pull — adds discount ladder, capacity reallocation, NAAF push, executive sponsorship.",
        "budget_factor": 1.25,
        "lever_scale": 1.0,
    },
}


def _budget_factor(budget: float, baseline: float = 7.2) -> float:
    ratio = budget / max(baseline, 0.1)
    return 0.5 + 0.5 * (1 - math.exp(-1.2 * ratio))


def _lever_impact(lever_def: dict, value: float, budget_mod: float) -> Dict[str, float]:
    coefficients = lever_def.get("impact_coefficients", {})
    default = lever_def.get("default_val", 0)
    max_val = lever_def.get("max_val", 1)
    min_val = lever_def.get("min_val", 0)

    range_span = max_val - min_val
    if range_span == 0:
        normalized_delta = 0
    else:
        normalized_delta = (value - default) / range_span

    impacts = {}
    for metric, coeff in coefficients.items():
        base_impact = normalized_delta * coeff * budget_mod
        impacts[metric] = base_impact

    return impacts


def _apply_interactions(
    active_lever_ids: set,
    metric_totals: Dict[str, float],
    lever_impacts: Dict[str, Dict[str, float]],
) -> tuple[Dict[str, float], List[InteractionWarning]]:
    warnings = []
    adjusted = {m: v for m, v in metric_totals.items()}

    for (l1, l2), effect in INTERACTION_EFFECTS.items():
        if l1 in active_lever_ids and l2 in active_lever_ids:
            for metric in effect["metrics"]:
                if metric in adjusted:
                    delta = adjusted[metric] * (effect["multiplier"] - 1.0)
                    adjusted[metric] += delta

            severity = effect.get("severity", "info")
            warnings.append(InteractionWarning(
                message=effect["message"],
                severity=severity,
                lever_ids=[l1, l2],
            ))

    return adjusted, warnings


def run_monte_carlo(
    lever_settings: List[LeverSetting],
    lever_definitions: Dict[str, dict],
    budget: float,
    n_iterations: int = 1000,
    time_horizon: str = "Q",
) -> dict:
    budget_mod = _budget_factor(budget)
    horizon_multiplier = {"Q": 1.0, "FY26": 3.5, "FY27": 7.0}.get(time_horizon, 1.0)

    active_lever_ids = {ls.lever_id for ls in lever_settings}
    lever_map = {ls.lever_id: ls.value for ls in lever_settings}

    per_lever_base_impacts = {}
    for ls in lever_settings:
        ldef = lever_definitions.get(ls.lever_id, {})
        impact = _lever_impact(ldef, ls.value, budget_mod)
        per_lever_base_impacts[ls.lever_id] = impact

    metric_totals_base = {m: 0.0 for m in METRICS}
    for lid, impacts in per_lever_base_impacts.items():
        for m, v in impacts.items():
            if m in metric_totals_base:
                metric_totals_base[m] += v

    metric_totals_base, interaction_warnings = _apply_interactions(
        active_lever_ids, metric_totals_base, per_lever_base_impacts
    )

    distributions = {m: [] for m in METRICS}
    for _ in range(n_iterations):
        noisy = {}
        for m, base_val in metric_totals_base.items():
            noise = random.gauss(0, abs(base_val) * 0.15 + 0.005)
            noisy[m] = base_val + noise
        for m in METRICS:
            distributions[m].append(noisy.get(m, 0))

    bands = {}
    for m in METRICS:
        dist = sorted(distributions[m])
        n = len(dist)
        bands[m] = {
            "p10": dist[max(0, int(n * 0.10))],
            "p50": dist[int(n * 0.50)],
            "p90": dist[min(n - 1, int(n * 0.90))],
        }

    # Scale to real-world units
    revenue_scale = 120.0 * horizon_multiplier  # $M per unit
    margin_scale = 2.5 * horizon_multiplier     # pp per unit
    win_rate_scale = 8.0                         # pp
    volume_scale = 5.0 * horizon_multiplier      # % per unit

    def scale_band(raw_band, scale, label, unit):
        return MetricBand(
            label=label, unit=unit,
            p10=round(raw_band["p10"] * scale, 1),
            p50=round(raw_band["p50"] * scale, 1),
            p90=round(raw_band["p90"] * scale, 1),
        )

    revenue_band = scale_band(bands["revenue"], revenue_scale, "Revenue Impact", "$M")
    margin_band = scale_band(bands["margin"], margin_scale, "Operating Margin", "pp")
    win_rate_band = scale_band(bands["win_rate"], win_rate_scale, "Win Rate", "pp")
    volume_band = scale_band(bands["volume"], volume_scale, "Volume Impact", "%")

    # Gap closure: composite metric
    gap_closure = min(95, max(0, round(
        (revenue_band.p50 / max(revenue_scale * 0.8, 1)) * 40 +
        (margin_band.p50 / max(margin_scale * 0.5, 1)) * 30 +
        (win_rate_band.p50 / max(win_rate_scale * 0.5, 1)) * 30
    )))

    # Per-lever results
    lever_results = []
    total_rev = sum(abs(v.get("revenue", 0)) for v in per_lever_base_impacts.values()) or 1
    for ls in lever_settings:
        ldef = lever_definitions.get(ls.lever_id, {})
        impacts = per_lever_base_impacts.get(ls.lever_id, {})
        rev = impacts.get("revenue", 0) * revenue_scale
        mar = impacts.get("margin", 0) * margin_scale
        contribution = abs(impacts.get("revenue", 0)) / total_rev * 100
        lever_results.append(LeverResult(
            lever_id=ls.lever_id,
            name=ldef.get("name", ls.lever_id),
            category=ldef.get("category", ""),
            contribution_pct=round(contribution, 1),
            revenue_delta=round(rev, 1),
            margin_delta=round(mar, 2),
        ))

    lever_results.sort(key=lambda x: abs(x.revenue_delta), reverse=True)

    # Sensitivity analysis: vary each lever ±20%
    sensitivity = []
    for ls in lever_settings:
        ldef = lever_definitions.get(ls.lever_id, {})
        range_span = ldef.get("max_val", 1) - ldef.get("min_val", 0)
        delta = range_span * 0.2

        low_val = max(ldef.get("min_val", 0), ls.value - delta)
        high_val = min(ldef.get("max_val", 100), ls.value + delta)

        low_impact_raw = _lever_impact(ldef, low_val, budget_mod)
        high_impact_raw = _lever_impact(ldef, high_val, budget_mod)
        base_impact_raw = _lever_impact(ldef, ls.value, budget_mod)

        sensitivity.append(SensitivityItem(
            lever_name=ldef.get("name", ls.lever_id),
            lever_id=ls.lever_id,
            low_impact=round(low_impact_raw.get("revenue", 0) * revenue_scale, 1),
            high_impact=round(high_impact_raw.get("revenue", 0) * revenue_scale, 1),
            base_impact=round(base_impact_raw.get("revenue", 0) * revenue_scale, 1),
        ))

    sensitivity.sort(key=lambda x: abs(x.high_impact - x.low_impact), reverse=True)

    # Time series (quarterly projection)
    periods = ["Current", "Q+1", "Q+2", "Q+3"] if time_horizon == "Q" else ["H1", "H2", "Q3", "Q4"]
    ramp_factors = [0.0, 0.35, 0.7, 1.0]
    baseline_revenue = 14100  # $M US Domestic
    chart_data = []
    for i, period in enumerate(periods):
        ramp = ramp_factors[i]
        proj = baseline_revenue + revenue_band.p50 * ramp
        p10 = baseline_revenue + revenue_band.p10 * ramp
        p90 = baseline_revenue + revenue_band.p90 * ramp
        chart_data.append(TimeSeriesPoint(
            period=period,
            baseline=baseline_revenue,
            projected=round(proj, 1),
            p10=round(p10, 1),
            p90=round(p90, 1),
        ))

    # Comparison paths
    comparison = ComparisonData(
        do_nothing=ComparisonPath(
            label="DO NOTHING", gap_closure=0,
            revenue=0, margin=0, win_rate=0,
        ),
        recommended=ComparisonPath(
            label="RECOMMENDED", gap_closure=62,
            revenue=round(revenue_band.p50 * 0.85, 1),
            margin=round(margin_band.p50 * 0.85, 2),
            win_rate=round(win_rate_band.p50 * 0.85, 1),
        ),
        hybrid=ComparisonPath(
            label="YOUR HYBRID", gap_closure=gap_closure,
            revenue=round(revenue_band.p50, 1),
            margin=round(margin_band.p50, 2),
            win_rate=round(win_rate_band.p50, 1),
        ),
    )

    return {
        "gap_closure_pct": gap_closure,
        "revenue_impact": revenue_band,
        "margin_impact": margin_band,
        "win_rate_impact": win_rate_band,
        "volume_impact": volume_band,
        "lever_results": lever_results,
        "sensitivity": sensitivity,
        "interaction_warnings": interaction_warnings,
        "comparison": comparison,
        "chart_data": chart_data,
    }


def generate_preset_lever_settings(
    lever_definitions: Dict[str, dict],
    preset_key: str,
) -> List[LeverSetting]:
    preset = PRESET_SCENARIOS.get(preset_key)
    if not preset:
        return []

    scale = preset["lever_scale"]
    settings = []
    for lid, ldef in lever_definitions.items():
        default = ldef.get("default_val", 0)
        max_val = ldef.get("max_val", 100)
        value = default + (max_val - default) * scale
        settings.append(LeverSetting(lever_id=lid, value=round(value, 2)))

    return settings
