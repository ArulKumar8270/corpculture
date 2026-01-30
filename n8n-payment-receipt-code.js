// n8n Code node: use with Webhook that receives payment payload from ServiceInvoiceList
// Input: webhook body { invoiceId, invoice, payment, allocatedToInvoices }

const body = $input.first().json.body || $input.first().json;
const invoice = body.invoice || {};
const payment = body.payment || {};
const allocatedToInvoices = body.allocatedToInvoices || [];

// --- 1. Helper Functions ---
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function numberToWords(num) {
    const number = Math.round(Number(num));
    if (isNaN(number) || number === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + number).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
}

// --- 2. Build data from new payload (invoice + payment) ---
const totalDue = Number(invoice.grandTotal) || 0;
const amountPaid = Number(payment.currentInvoicePayment) || Number(payment.paymentAmount) || 0;
const balanceDue = Math.max(0, totalDue - amountPaid);
const mode = (payment.modeOfPayment || 'CASH').toUpperCase();
const logoUrl = "https://corpculture.nicknameinfotech.com/assets/logo-d579b0da.png";

const data = {
    ...invoice,
    ...payment,
    paymentAmount: amountPaid,
    pendingAmount: balanceDue,
    grandTotal: totalDue,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    updatedAt: new Date().toISOString(),
    bankName: payment.bankName || '',
    transactionDetails: payment.transactionDetails || '',
    modeOfPayment: payment.modeOfPayment || 'CASH',
    description: 'Payment received for Invoice ' + (invoice.invoiceNumber || invoice._id) +
        (allocatedToInvoices.length > 0
            ? '. Balance allocated to ' + allocatedToInvoices.length + ' other invoice(s): ' +
                allocatedToInvoices.map(a => 'Rs ' + a.amount + ' (Inv: ' + (a.invoiceId || '').slice(-6) + ')').join(', ')
            : ''),
};

// --- 3. The HTML Template ---
const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; line-height: 1.3; }
        .receipt-container { width: 750px; margin: auto; border: 1.5px solid #000; }
        .header-title { background-color: #333; color: #fff; text-align: center; padding: 6px; font-weight: bold; font-style: italic; font-size: 15px; border-bottom: 1.5px solid #000; letter-spacing: 1px;}
        table { width: 100%; border-collapse: collapse; }
        td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        .label { font-weight: bold; }
        .grey-header { background-color: #4a4a4a; color: #fff; font-weight: bold; font-style: italic; padding: 5px 12px; border: 1px solid #000; font-size: 12px; }
        .logo-section { width: 35%; text-align: center; vertical-align: middle; padding: 10px; }
        .logo-img { max-width: 180px; height: auto; }
        .footer-section { height: 130px; }
        .sign-box { width: 45%; position: relative; border: 1px solid #000; }
        .sign-label { padding: 5px; font-weight: bold; }
        .sign-bottom { position: absolute; bottom: 0; left: 0; width: 100%; background: #333; color: #fff; text-align: center; font-weight: bold; padding: 3px 0; }
        .check-box { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; text-align: center; line-height: 14px; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header-title">PAYMENT RECEIPT</div>
        <table>
            <tr>
                <td style="width: 65%;">
                    <span class="label">Company Name:</span> CORPCULTURE<br>
                    <span class="label">Address:</span> A Block, Liberty Plaza, No. 12/30, Vada Agaram Road, Mehta Nagar, Aminjikarai, Chennai- 600002<br>
                    <span class="label">Phone No.:</span> +91 9171558818<br>
                    <span class="label">Email ID:</span> customer@corpculture.in<br>
                    <span class="label">GSTIN No.:</span> 33BBFPG9210H2ZZ
                </td>
                <td class="logo-section">
                    <img src="${logoUrl}" class="logo-img" alt="Corp Culture Logo">
                </td>
            </tr>
        </table>

        <div class="grey-header" style="display: flex; justify-content: space-between;">
            <span>Account Details</span>
            <span style="width: 260px;">Receipt No: ${data.invoiceNumber || 'CCA001'}</span>
        </div>

        <table>
            <tr>
                <td style="width: 50%;">
                    <span class="label">TOTAL DUE AMOUNT:</span> ${totalDue.toFixed(2)}<br>
                    <span class="label">TOTAL AMOUNT PAID:</span> ${amountPaid.toFixed(2)}<br>
                    <span class="label">BALANCE DUE :</span> ${balanceDue.toFixed(2)}
                </td>
                <td style="width: 25%;" class="label">PAYMENT RECEIVED DATE</td>
                <td style="width: 25%;">${formatDate(data.updatedAt)}</td>
            </tr>
            <tr>
                <td colspan="3" style="border-top: none; height: 25px;"></td>
            </tr>
        </table>

        <div class="grey-header">Amount (Received)</div>
        <table>
            <tr><td style="height: 45px;"><span class="label">Amount in Words:</span><br>${numberToWords(amountPaid)}</td></tr>
            <tr><td><span class="label">Reason for Payment:</span> ${data.description || 'N/A'}</td></tr>
        </table>

        <div class="grey-header">Payment Mode</div>
        <table>
            <tr>
                <td class="label" style="width: 20%;">BANK NAME</td>
                <td style="width: 30%;">${data.bankName || ''}</td>
                <td style="width: 25%;"><span class="label">Cash :</span></td>
                <td style="width: 25%; text-align: center;"><div class="check-box">${mode === 'CASH' ? '✓' : ''}</div></td>
            </tr>
            <tr>
                <td class="label">DUE DATE</td>
                <td>${formatDate(data.invoiceDate)}</td>
                <td><span class="label">Cheque :</span></td>
                <td style="text-align: center;"><div class="check-box">${mode === 'CHEQUE' ? '✓' : ''}</div></td>
            </tr>
            <tr>
                <td class="label">AMOUNT</td>
                <td>${amountPaid.toFixed(2)}</td>
                <td><span class="label">UPI :</span></td>
                <td style="text-align: center;"><div class="check-box">${mode === 'UPI' ? '✓' : ''}</div></td>
            </tr>
            <tr>
                <td colspan="2" rowspan="2">
                    <span class="label">Description :</span><br>
                    ${data.transactionDetails || data.description || 'N/A'}
                </td>
                <td class="label" style="font-size: 10px;">Bank Transfer / RTGS / NEFT reference number</td>
                <td>${data.transactionDetails || ''}</td>
            </tr>
        </table>

        <div style="display: flex; width: 100%; height: 130px;">
            <div style="flex: 1; border-right: 1px solid #000; border-bottom: 1px solid #000;"></div>
            <div class="sign-box">
                <div class="sign-label">Received By:</div>
                <div class="sign-bottom">Name & Signature:</div>
            </div>
        </div>
    </div>
</body>
</html>
`;

// --- 4. Contact emails from invoice.companyId (may be object or id) ---
const company = invoice.companyId && typeof invoice.companyId === 'object' ? invoice.companyId : null;
const contactEmails = (company && company.contactPersons)
    ? company.contactPersons.map(person => person.email).filter(Boolean)
    : [];

return [{
    json: {
        html: finalHtml,
        emails: contactEmails,
        invoiceNumber: data.invoiceNumber,
        invoiceId: body.invoiceId,
        data_time: new Date().toISOString(),
        payment: { modeOfPayment: payment.modeOfPayment, amountPaid, totalDue, balanceDue },
        allocatedToInvoices,
    },
}];
