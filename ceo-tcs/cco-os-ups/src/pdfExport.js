import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const GOLD = [184, 155, 94];
const INK = [12, 17, 22];
const MUTED = [106, 116, 128];
const RED = [168, 69, 59];
const GREEN = [45, 107, 74];
const LINE = [220, 216, 208];

export async function captureCharts(containerEl) {
  if (!containerEl) return [];
  const chartEls = containerEl.querySelectorAll("[data-pdf-chart]");
  if (!chartEls.length) return [];
  const images = [];
  for (const el of chartEls) {
    try {
      const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      images.push({ dataUrl: canvas.toDataURL("image/png"), width: el.offsetWidth, height: el.offsetHeight, title: el.getAttribute("data-pdf-chart") || "" });
    } catch (_) { /* skip failed chart */ }
  }
  return images;
}

export async function downloadReport({ title, subtitle, signalType, deltaValue, source, kpis, affectedAccounts, recommendedAction, tables, narrativeSections, contentSections, metrics, timestamp, chartImages }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkSpace = (need) => { if (y + need > 275) addPage(); };

  // Header gold line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 30, y);
  y += 6;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(title || "Report", contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  // Tags row
  if (signalType || deltaValue || source) {
    doc.setFontSize(8);
    let tx = margin;
    if (signalType) {
      doc.setFillColor(240, 238, 232);
      doc.roundedRect(tx, y - 3, doc.getTextWidth(signalType) + 6, 5, 1, 1, "F");
      doc.setTextColor(...MUTED);
      doc.text(signalType.toUpperCase(), tx + 3, y);
      tx += doc.getTextWidth(signalType) + 10;
    }
    if (deltaValue) {
      const isNeg = deltaValue.includes("-") || deltaValue.includes("−");
      doc.setTextColor(...(isNeg ? RED : GREEN));
      doc.setFont("helvetica", "bold");
      doc.text(deltaValue, tx, y);
      tx += doc.getTextWidth(deltaValue) + 8;
    }
    if (source) {
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(source, tx, y);
    }
    y += 8;
  }

  // Subtitle / timestamp
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    const subLines = doc.splitTextToSize(subtitle, contentW);
    doc.text(subLines, margin, y);
    y += subLines.length * 4 + 4;
  }
  if (timestamp) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Generated: ${timestamp}`, margin, y);
    y += 6;
  }

  // Separator
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // KPIs / Metrics grid
  const allMetrics = kpis?.length ? kpis : metrics?.length ? metrics : [];
  if (allMetrics.length) {
    checkSpace(30);
    sectionHeader(doc, "Key Metrics", margin, y);
    y += 8;
    const cols = Math.min(allMetrics.length, 3);
    const cellW = (contentW - (cols - 1) * 4) / cols;
    allMetrics.slice(0, 6).forEach((k, i) => {
      const col = i % cols;
      const cx = margin + col * (cellW + 4);
      if (i > 0 && col === 0) y += 22;
      if (i === 0 || col === 0) checkSpace(22);
      doc.setFillColor(250, 248, 243);
      doc.roundedRect(cx, y, cellW, 18, 2, 2, "F");
      doc.setDrawColor(...LINE);
      doc.roundedRect(cx, y, cellW, 18, 2, 2, "S");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const isNeg = k.neg || (k.val || k.value || "").toString().includes("-");
      doc.setTextColor(...(isNeg ? RED : GREEN));
      doc.text(k.val || k.value || "", cx + 4, y + 8);
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text((k.label || "").substring(0, 28), cx + 4, y + 13);
      if (k.sub) doc.text(k.sub.substring(0, 35), cx + 4, y + 16.5);
    });
    y += 26;
  }

  // Affected Accounts
  if (affectedAccounts?.length) {
    checkSpace(16);
    sectionHeader(doc, "Affected Accounts", margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.text(affectedAccounts.join("  ·  "), margin, y);
    y += 8;
  }

  // Recommended Action
  if (recommendedAction) {
    checkSpace(20);
    doc.setFillColor(253, 248, 237);
    doc.setDrawColor(232, 217, 168);
    const raLines = doc.splitTextToSize(recommendedAction, contentW - 10);
    const raH = raLines.length * 4 + 12;
    doc.roundedRect(margin, y, contentW, raH, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text("RECOMMENDED ACTION", margin + 5, y + 5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(raLines, margin + 5, y + 10);
    y += raH + 6;
  }

  // Tables
  if (tables?.length) {
    tables.forEach(tbl => {
      checkSpace(20);
      sectionHeader(doc, tbl.title, margin, y);
      y += 4;
      const tblResult = autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [tbl.columns],
        body: tbl.rows,
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: LINE, lineWidth: 0.2, textColor: INK },
        headStyles: { fillColor: [245, 243, 238], textColor: MUTED, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [252, 251, 248] },
        theme: "grid",
      });
      y = (tblResult?.finalY ?? doc.lastAutoTable?.finalY ?? doc.previousAutoTable?.finalY ?? y + 20) + 8;
    });
  }

  // Chart images
  if (chartImages?.length) {
    chartImages.forEach(img => {
      const aspect = img.height / img.width;
      const imgW = contentW;
      const imgH = imgW * aspect;
      checkSpace(imgH + 14);
      if (img.title) {
        sectionHeader(doc, img.title, margin, y);
        y += 6;
      }
      doc.addImage(img.dataUrl, "PNG", margin, y, imgW, imgH);
      y += imgH + 8;
    });
  }

  // Narrative sections
  if (narrativeSections?.length) {
    narrativeSections.forEach(ns => {
      checkSpace(16);
      sectionHeader(doc, ns.heading, margin, y);
      y += 6;
      (ns.bullets || []).forEach(b => {
        checkSpace(10);
        const clean = b.replace(/\*\*(.*?)\*\*/g, "$1");
        const bLines = doc.splitTextToSize(`•  ${clean}`, contentW - 6);
        doc.setFontSize(9);
        doc.setTextColor(...INK);
        doc.setFont("helvetica", "normal");
        doc.text(bLines, margin + 3, y);
        y += bLines.length * 4 + 2;
      });
      y += 4;
    });
  }

  // Content sections (from non-analytics panels)
  if (contentSections?.length) {
    contentSections.forEach(s => {
      checkSpace(16);
      sectionHeader(doc, s.heading, margin, y);
      y += 6;
      const body = (s.body || "").replace(/\*\*(.*?)\*\*/g, "$1");
      const lines = doc.splitTextToSize(body, contentW - 4);
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      lines.forEach(line => {
        checkSpace(5);
        doc.text(line, margin + 2, y);
        y += 4;
      });
      y += 4;
    });
  }

  // Footer
  checkSpace(16);
  doc.setDrawColor(...LINE);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("CCO Companion · UPS Confidential", margin, y);
  doc.text(timestamp || "", W - margin, y, { align: "right" });

  // Save
  const safeName = (title || "Report").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").substring(0, 60);
  doc.save(`${safeName}.pdf`);
}

function sectionHeader(doc, text, x, y) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + 12, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text((text || "").toUpperCase(), x + 15, y + 0.5);
}
