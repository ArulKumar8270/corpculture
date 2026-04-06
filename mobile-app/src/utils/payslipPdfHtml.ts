/**
 * Build a self-contained HTML document for payslip PDF (expo-print).
 * Content mirrors mobile PayslipViewScreen / web payslip layout.
 */

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d: any): string {
  if (d == null || d === '') return '-';
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
  } catch {
    return '-';
  }
}

function formatMoney(n: any): string {
  const num = Number(n);
  if (n == null || n === '' || Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

export function buildPayslipHtml(payslip: any): string {
  const emp = payslip.employeeId;
  const gross = Number(payslip.grossEarnings) || 0;
  const ded =
    Number(payslip.totalDeductions) ||
    Number(payslip.deductions?.taxPayable) ||
    0;
  let net = Number(payslip.netPay);
  if (Number.isNaN(net)) net = gross - ded;
  const earnings = payslip.earnings || {};
  const ratings = payslip.ratings || {};
  const empName = (payslip.employeeName ?? emp?.name ?? '').toString().trim() || '-';
  const empIdNo = (payslip.employeeIdNo ?? '').toString().trim() || '-';
  const desig = payslip.designation ?? (Array.isArray(emp?.designation) ? emp?.designation[0] : emp?.designation);
  const designationStr = (desig != null ? String(desig).trim() : '') || '-';

  const earningsRows = [
    ['Basic', earnings.basic],
    ['Petrol Allowance', earnings.petrolAllowance],
    ['Bike Allowance', earnings.bikeAllowance],
    ['By Benefit', earnings.byBenefit],
    ['Food Allowance', earnings.foodAllowance],
    ['Incentives', earnings.incentives],
  ];

  const ratingLabels = ['Timing', 'Leave', 'Work FB', 'Incentive', 'Firm FB'];
  const ratingKeys = ['timing', 'leave', 'workFb', 'incentive', 'firmFb'];

  const stars = (v: number) => {
    const n = Math.min(5, Math.max(0, Math.round(Number(v) || 0)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  let tableRows = '';
  earningsRows.forEach(([label, val], i) => {
    const dedLabel = i === 0 ? 'Tax Payable' : '';
    const dedVal = i === 0 ? formatMoney(payslip.deductions?.taxPayable ?? 0) : '';
    tableRows += `<tr>
      <td>${esc(label)}</td><td class="r">${esc(formatMoney(val))}</td><td class="c">-</td>
      <td>${esc(dedLabel)}</td><td class="r">${esc(dedVal)}</td><td class="c">-</td>
    </tr>`;
  });
  tableRows += `<tr class="bold">
    <td>Gross Earnings</td><td class="r">${esc(formatMoney(gross))}</td><td class="c">-</td>
    <td>Total Deductions</td><td class="r">${esc(formatMoney(ded))}</td><td class="c">-</td>
  </tr>`;

  let ratingsHtml = '<div class="ratings">';
  ratingKeys.forEach((key, i) => {
    const v = Number(ratings[key]) || 0;
    ratingsHtml += `<div class="ritem"><div>${stars(v)}</div><div class="rlab">${esc(ratingLabels[i])}</div></div>`;
  });
  ratingsHtml += '</div>';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; color: #222; font-size: 11px; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px; }
  .logo { font-size: 14px; font-weight: 600; }
  .title { font-size: 16px; font-weight: 700; }
  .sec { text-align: center; font-weight: 700; margin: 10px 0; }
  .grid { display: flex; gap: 12px; flex-wrap: wrap; }
  .left { flex: 1; min-width: 200px; }
  .net { flex: 1; min-width: 160px; border: 1px solid #019ee3; border-radius: 8px; padding: 10px; background: #f0f9ff; }
  .net h3 { margin: 0 0 6px 0; font-size: 11px; color: #555; }
  .net .amt { font-size: 18px; font-weight: 700; color: #019ee3; }
  .detail { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; }
  th { background: #e6fbff; font-weight: 700; }
  .r { text-align: right; }
  .c { text-align: center; }
  tr.bold td { font-weight: 700; background: #f7f7f7; }
  .total { text-align: center; margin: 16px 0; padding: 12px; background: #e6fbff; border-radius: 8px; }
  .total .big { font-size: 18px; font-weight: 700; color: #019ee3; margin-top: 6px; }
  .footer { font-size: 9px; color: #666; text-align: center; margin-top: 20px; }
  .ratings { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 8px; }
  .ritem { text-align: center; min-width: 52px; }
  .rlab { color: #666; margin-top: 2px; }
</style></head><body>
  <div class="head">
    <div class="logo">corp culture</div>
    <div class="title">PAYSLIP</div>
  </div>
  <div class="sec">EMPLOYEE PAY SUMMARY</div>
  <div class="grid">
    <div class="left">
      <div class="detail"><strong>Employee Name:</strong> ${esc(empName)}</div>
      <div class="detail"><strong>Employee ID:</strong> ${esc(empIdNo)}</div>
      <div class="detail"><strong>Designation:</strong> ${esc(designationStr)}</div>
      <div class="detail"><strong>Date of Joining:</strong> ${esc(formatDate(payslip.dateOfJoining))}</div>
      <div class="detail"><strong>Pay Period:</strong> ${esc((payslip.payPeriod ?? '').toString().trim() || '-')}</div>
      <div class="detail"><strong>Pay Date:</strong> ${esc(formatDate(payslip.payDate))}</div>
    </div>
    <div class="net">
      <h3>Employee Net Pay</h3>
      <div class="amt">${esc(formatMoney(net))}</div>
      <div class="detail">Paid Days: ${esc(payslip.paidDays ?? 0)} | LOP: ${esc(payslip.lopDays ?? 0)}</div>
      ${ratingsHtml}
    </div>
  </div>
  <table>
    <tr>
      <th>EARNINGS</th><th>AMOUNT</th><th>YTD</th>
      <th>DEDUCTION</th><th>AMOUNT</th><th>YTD</th>
    </tr>
    ${tableRows}
  </table>
  <div class="total">
    <div>TOTAL NET PAYABLE</div>
    <div class="big">${esc(formatMoney(net))}</div>
  </div>
  <div class="footer">This document is system generated by Corp Culture; therefore, a signature is not required.</div>
</body></html>`;
}
