import { jsPDF } from "jspdf";

const formatDate = (d) => {
    if (d == null || d === "") return "-";
    try {
        const date = new Date(d);
        return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
    } catch {
        return "-";
    }
};
const formatMoneyPdf = (n) => {
    const num = Number(n);
    if (n == null || n === "" || Number.isNaN(num)) return "Rs. 0";
    return `Rs. ${num.toLocaleString("en-IN")}`;
};

export function numberToWords(num) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
    return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
}

function drawLine(doc, x1, y1, x2, y2, lineWidth = 0.15) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(lineWidth);
    doc.line(x1, y1, x2, y2);
}

function drawRect(doc, x, y, w, h) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.15);
    doc.rect(x, y, w, h);
}

const STAR_FILLED = "\u2605";
const STAR_EMPTY = "\u2606";

function drawRatingStars(doc, centerX, starY, value, label, maxStars = 5) {
    const v = Math.min(maxStars, Math.max(0, Number(value) || 0));
    const starGap = 3;
    const totalStarWidth = (maxStars - 1) * starGap;
    const startX = centerX - totalStarWidth / 2;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    for (let i = 0; i < maxStars; i++) {
        const char = i < v ? STAR_FILLED : STAR_EMPTY;
        doc.setTextColor(i < v ? 0 : 120, i < v ? 0 : 120, i < v ? 0 : 120);
        doc.text(char, startX + i * starGap, starY);
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6.5);
    doc.text(label, centerX, starY + 4.5, { align: "center" });
}

export function generatePayslipPdf(payslip, logoDataUrl = null) {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const leftCol = 14;
    const rightCol = 105;
    const col1 = 14;
    const col2 = 95;
    const col3 = 115;
    let y = 10;

    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, "PNG", leftCol, 6, 32, 12);
        } catch {
            doc.setFontSize(12);
            doc.text("corp culture", leftCol, y + 6);
        }
    } else {
        doc.setFontSize(12);
        doc.text("corp culture", leftCol, y + 6);
    }

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("PAYSLIP", pageW - 14, y + 8, { align: "right" });
    doc.setFont(undefined, "normal");
    y += 18;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("EMPLOYEE PAY SUMMARY", pageW / 2, y, { align: "center" });
    drawLine(doc, pageW / 2 + 2, y + 1, pageW - 14, y + 1, 0.1);
    doc.setFont(undefined, "normal");
    y += 10;

    const emp = payslip.employeeId;
    const empName = (payslip.employeeName ?? emp?.name ?? "").toString().trim() || "-";
    const empIdNo = (payslip.employeeIdNo ?? "").toString().trim() || "-";
    const desig = payslip.designation ?? (Array.isArray(emp?.designation) ? emp?.designation[0] : emp?.designation);
    const designationStr = (desig != null ? String(desig).trim() : "") || "-";

    const summaryY = y;
    doc.setFontSize(10);
    doc.text("Employee Name: " + empName, leftCol, y); y += 6;
    doc.text("Employee ID: " + empIdNo, leftCol, y); y += 6;
    doc.text("Designation: " + designationStr, leftCol, y); y += 6;
    doc.text("Date of Joining: " + formatDate(payslip.dateOfJoining), leftCol, y); y += 6;
    doc.text("Pay Period: " + (payslip.payPeriod ?? "").toString().trim() || "-", leftCol, y); y += 6;
    doc.text("Pay Date: " + formatDate(payslip.payDate), leftCol, y);

    let netPay = payslip.netPay;
    if (netPay == null || Number.isNaN(Number(netPay))) {
        const g = payslip.grossEarnings ?? 0;
        const d = payslip.totalDeductions ?? (payslip.deductions?.taxPayable ?? 0);
        netPay = Number(g) - Number(d);
    }
    netPay = Number(netPay);
    if (Number.isNaN(netPay)) netPay = 0;
    const ry = summaryY;
    const netPayBoxLeft = rightCol;
    const netPayBoxW = pageW - 14 - rightCol;
    const netPayBoxCenterX = netPayBoxLeft + netPayBoxW / 2;
    drawRect(doc, netPayBoxLeft, ry - 4, netPayBoxW, 52);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Employee Net Pay", netPayBoxCenterX, ry + 2, { align: "center" });
    doc.setFontSize(11);
    doc.text(formatMoneyPdf(netPay), netPayBoxCenterX, ry + 10, { align: "center" });
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Paid Days: " + (payslip.paidDays ?? 0) + " | LOP Days: " + (payslip.lopDays ?? 0), netPayBoxCenterX, ry + 18, { align: "center" });
    const ratings = payslip.ratings || {};
    const ratingLabels = ["Timing", "Leave", "Work FB", "Incentive", "Firm FB"];
    const ratingKeys = ["timing", "leave", "workFb", "incentive", "firmFb"];
    const starY = ry + 24;
    const numRatings = ratingLabels.length;
    const groupW = netPayBoxW / numRatings;
    ratingKeys.forEach((key, i) => {
        const centerX = netPayBoxLeft + (i + 0.5) * groupW;
        drawRatingStars(doc, centerX, starY, ratings[key], ratingLabels[i], 5);
    });

    y += 16;

    const earningsKeys = ["basic", "petrolAllowance", "bikeAllowance", "byBenefit", "foodAllowance", "incentives"];
    const earningsLabels = ["Basic", "Petrol Allowance", "Bike Allowance", "By Benefit", "Food Allowance", "Incentives"];
    const rawEarnings = payslip.earnings || {};
    const earnings = {};
    earningsKeys.forEach((k) => { earnings[k] = Number(rawEarnings[k]) || 0; });
    const eRows = earningsKeys.map((k, i) => [earningsLabels[i], earnings[k]]);
    const gross = (payslip.grossEarnings != null && !Number.isNaN(Number(payslip.grossEarnings)))
        ? Number(payslip.grossEarnings)
        : eRows.reduce((s, [, v]) => s + (Number(v) || 0), 0);
    const rawDeductions = payslip.deductions || {};
    const tax = Number(rawDeductions.taxPayable) || 0;
    const totalDed = (payslip.totalDeductions != null && !Number.isNaN(Number(payslip.totalDeductions)))
        ? Number(payslip.totalDeductions)
        : tax;

    const tableLeft = 14;
    const tableRight = pageW - 14;
    const tableW = tableRight - tableLeft;
    const amountCol = 88;
    const ytdCol = 115;
    const amountColRight = ytdCol - 3;
    const ytdColRight = tableRight - 4;

    const rowH = 6;
    const headerY = y;

    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    const earningsTop = headerY - 3;
    drawLine(doc, tableLeft, earningsTop, tableRight, earningsTop);
    doc.text("EARNINGS", tableLeft + 4, headerY + 4);
    doc.text("AMOUNT", amountColRight, headerY + 4, { align: "right" });
    doc.text("YTD", ytdColRight, headerY + 4, { align: "right" });
    drawLine(doc, tableLeft, headerY + rowH, tableRight, headerY + rowH);
    doc.setFont(undefined, "normal");
    y += rowH + 4;
    eRows.forEach(([label, val]) => {
        doc.text(label, tableLeft + 4, y + 4);
        doc.text(formatMoneyPdf(val), amountColRight, y + 4, { align: "right" });
        doc.text("-", ytdColRight, y + 4, { align: "right" });
        drawLine(doc, tableLeft, y + rowH, tableRight, y + rowH);
        y += rowH;
    });
    doc.setFont(undefined, "bold");
    doc.text("Gross Earnings", tableLeft + 4, y + 4);
    doc.text(formatMoneyPdf(gross), amountColRight, y + 4, { align: "right" });
    doc.text("-", ytdColRight, y + 4, { align: "right" });
    const earningsBottom = y + rowH;
    drawLine(doc, tableLeft, earningsBottom, tableRight, earningsBottom);
    drawLine(doc, amountCol, earningsTop, amountCol, earningsBottom);
    drawLine(doc, ytdCol, earningsTop, ytdCol, earningsBottom);
    y += rowH + 8;

    const dedStartY = y;
    const dedTop = dedStartY - 3;
    drawLine(doc, tableLeft, dedTop, tableRight, dedTop);
    doc.text("DEDUCTION", tableLeft + 4, dedStartY + 4);
    doc.text("AMOUNT", amountColRight, dedStartY + 4, { align: "right" });
    doc.text("YTD", ytdColRight, dedStartY + 4, { align: "right" });
    drawLine(doc, tableLeft, dedStartY + rowH, tableRight, dedStartY + rowH);
    doc.setFont(undefined, "normal");
    y += rowH + 4;
    doc.text("Tax Payable", tableLeft + 4, y + 4);
    doc.text(formatMoneyPdf(tax), amountColRight, y + 4, { align: "right" });
    doc.text("-", ytdColRight, y + 4, { align: "right" });
    drawLine(doc, tableLeft, y + rowH, tableRight, y + rowH);
    y += rowH;
    doc.setFont(undefined, "bold");
    doc.text("Total Deductions", tableLeft + 4, y + 4);
    doc.text(formatMoneyPdf(totalDed), amountColRight, y + 4, { align: "right" });
    doc.text("-", ytdColRight, y + 4, { align: "right" });
    const dedBottom = y + rowH;
    drawLine(doc, tableLeft, dedBottom, tableRight, dedBottom);
    drawLine(doc, amountCol, dedTop, amountCol, dedBottom);
    drawLine(doc, ytdCol, dedTop, ytdCol, dedBottom);
    y += rowH + 8;

    const netPaySectionTop = y - 2;
    drawLine(doc, tableLeft, netPaySectionTop, tableRight, netPaySectionTop);
    doc.text("NET PAY", tableLeft + 4, y + 4);
    drawLine(doc, tableLeft, y + rowH + 2, tableRight, y + rowH + 2);
    drawLine(doc, amountCol, netPaySectionTop, amountCol, y + rowH + 2);
    drawLine(doc, ytdCol, netPaySectionTop, ytdCol, y + rowH + 2);
    y += rowH + 6;
    drawLine(doc, tableLeft, y, tableRight, y);
    doc.setFont(undefined, "normal");
    doc.text("Gross Earnings", tableLeft + 4, y + 4);
    doc.text(formatMoneyPdf(gross), amountColRight, y + 4, { align: "right" });
    doc.text("-", ytdColRight, y + 4, { align: "right" });
    drawLine(doc, amountCol, y, amountCol, y + rowH);
    drawLine(doc, ytdCol, y, ytdCol, y + rowH);
    y += rowH;
    drawLine(doc, tableLeft, y, tableRight, y);
    doc.text("Total Deductions", tableLeft + 4, y + 4);
    doc.text(formatMoneyPdf(totalDed), amountColRight, y + 4, { align: "right" });
    drawLine(doc, amountCol, y, amountCol, y + rowH);
    drawLine(doc, ytdCol, y, ytdCol, y + rowH);
    y += rowH + 6;

    const totalNetTop = y - 2;
    drawLine(doc, tableLeft, totalNetTop, tableRight, totalNetTop);
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.text("TOTAL NET PAYABLE", tableLeft + 4, y + 5);
    doc.text(formatMoneyPdf(netPay), amountColRight, y + 5, { align: "right" });
    doc.text("-", ytdColRight, y + 5, { align: "right" });
    drawLine(doc, tableLeft, y + rowH + 4, tableRight, y + rowH + 4);
    drawLine(doc, amountCol, totalNetTop, amountCol, y + rowH + 4);
    drawLine(doc, ytdCol, totalNetTop, ytdCol, y + rowH + 4);
    y += rowH + 10;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text("Total Net Payable " + formatMoneyPdf(netPay) + " (Indian Rupee " + numberToWords(Math.max(0, Math.round(netPay))) + " Only)", tableLeft + 4, y + 4);
    y += 14;

    doc.setFontSize(8);
    doc.text("This document is system generated by Corp Culture, therefore, a signature is not required.", pageW / 2, y, { align: "center" });

    return doc;
}

function fetchImageAsDataUrl(url) {
    return fetch(url)
        .then((r) => r.blob())
        .then(
            (blob) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
        );
}

export async function downloadPayslipPdf(payslip, filename, logoUrl = null) {
    let logoDataUrl = null;
    if (logoUrl) {
        try {
            logoDataUrl = await fetchImageAsDataUrl(logoUrl);
        } catch {
            logoDataUrl = null;
        }
    }
    const doc = generatePayslipPdf(payslip, logoDataUrl);
    doc.save(filename || `payslip-${payslip.payPeriod || "payslip"}.pdf`);
}
