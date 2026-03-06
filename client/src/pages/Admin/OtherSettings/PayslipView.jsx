import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import { toast } from "react-toastify";
import Spinner from "../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";
import { Button, Paper } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { numberToWords } from "../../../utils/payslipPdf";
import logo from "../../../assets/images/logo.png";

const STAR_FILLED = "\u2605";
const STAR_EMPTY = "\u2606";

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN");
};

const formatMoney = (n) => {
  const num = Number(n);
  if (n == null || n === "" || Number.isNaN(num)) return "₹0";
  return `₹${Number(num).toLocaleString("en-IN")}`;
};

function RatingStars({ value, label }) {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <div className="flex flex-col items-center min-w-0">
      <span className="whitespace-nowrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i}>{i <= v ? STAR_FILLED : STAR_EMPTY}</span>
        ))}
      </span>
      <span className="text-[9px] text-gray-600 mt-0.5 truncate max-w-full" title={label}>{label}</span>
    </div>
  );
}

export default function PayslipView() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef(null);

  useEffect(() => {

    if (!id || !auth?.token) return;

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/${id}`, {
        headers: { Authorization: auth.token },
      })
      .then(({ data }) => {
        if (data?.success) {
          setPayslip(data.payslip);
        } else {
          toast.error("Payslip not found");
        }
      })
      .catch(() => toast.error("Failed to load payslip"))
      .finally(() => setLoading(false));

  }, [id, auth?.token]);

  const handlePrint = () => {
    const el = printAreaRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    const wrapper = document.createElement("div");
    wrapper.className = "print-payslip-clone-wrapper";
    wrapper.setAttribute("style", "position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto;padding:16px;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:center;");
    wrapper.appendChild(clone);
    document.body.classList.add("print-payslip-active");
    document.body.appendChild(wrapper);
    const cleanup = () => {
      try {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        document.body.classList.remove("print-payslip-active");
      } catch (_) {}
    };
    window.onafterprint = cleanup;
    setTimeout(() => window.print(), 150);
    setTimeout(cleanup, 3000);
  };

  if (loading) return <Spinner />;
  if (!payslip) return <div>Payslip not found</div>;

  const gross = Number(payslip.grossEarnings) || 0;
  const ded =
    Number(payslip.totalDeductions) ||
    Number(payslip.deductions?.taxPayable) ||
    0;

  const net =
    Number(payslip.netPay) ||
    gross - ded;

  const emp = payslip.employeeId;

  const earnings = payslip.earnings || {};
  const ratings = payslip.ratings || {};

  const earningsRows = [
    ["Basic", earnings.basic],
    ["Petrol Allowance", earnings.petrolAllowance],
    ["Bike Allowance", earnings.bikeAllowance],
    ["By Benefit", earnings.byBenefit],
    ["Food Allowance", earnings.foodAllowance],
    ["Incentives", earnings.incentives],
  ];

  return (
    <>
      <SeoData title="Payslip | Corp Culture" />

      <div className="p-4 max-w-4xl mx-auto">

        {/* Buttons */}
        <div className="flex justify-between mb-4 no-print">

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>

        </div>

        {/* Payslip - A4 size (210mm × 297mm) */}
        <Paper
          ref={printAreaRef}
          className="payslip-print-area p-6 bg-white"
          style={{ width: "210mm", maxWidth: "100%", boxSizing: "border-box" }}
        >

          {/* Header */}

          <div className="flex justify-between border-b pb-4 mb-4">

            <img
              src={logo}
              alt="logo"
              className="h-10"
            />

            <h1 className="text-xl font-bold">
              PAYSLIP
            </h1>

          </div>

          <h2 className="text-center font-semibold mb-6">
            EMPLOYEE PAY SUMMARY
          </h2>

          {/* Employee Info */}

          <div style={{ display: "flex" }}>

            <div className="text-sm space-y-2" style={{ width: "40%", marginBottom: "20px" }}>

              <p>
                Employee Name:{" "}
                {payslip.employeeName || emp?.name || "-"}
              </p>

              <p>
                Employee ID:{" "}
                {payslip.employeeIdNo || "-"}
              </p>

              <p>
                Designation:{" "}
                {payslip.designation || emp?.designation || "-"}
              </p>

              <p>
                Date of Joining:{" "}
                {formatDate(payslip.dateOfJoining)}
              </p>

              <p>
                Pay Period:{" "}
                {payslip.payPeriod || "-"}
              </p>

              <p>
                Pay Date:{" "}
                {formatDate(payslip.payDate)}
              </p>

            </div>

            {/* Net Pay Box - start (left) alignment */}
            <div className="bg-[#e6fbff] border p-4 rounded text-left" style={{ width: "60%", marginBottom: "20px" }}>
              <p className="font-bold">Employee Net Pay</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(net)}</p>
              <p className="text-sm mt-2">Paid Days: {payslip.paidDays || 0} | LOP Days: {payslip.lopDays || 0}</p>
              <div className="grid grid-cols-5 gap-2 mt-3 print-payslip-ratings">
                <RatingStars value={ratings.timing} label="Timing" />
                <RatingStars value={ratings.leave} label="Leave" />
                <RatingStars value={ratings.workFb} label="Work FB" />
                <RatingStars value={ratings.incentive} label="Incentive" />
                <RatingStars value={ratings.firmFb} label="Firm FB" />
              </div>

            </div>

          </div>

          {/* Earnings & Deductions Table */}
          <div className="overflow-x-auto payslip-table-wrap">
            <table className="w-full border text-sm payslip-main-table border-collapse" style={{ minWidth: 560 }}>
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left font-bold whitespace-nowrap">EARNINGS</th>
                  <th className="border p-2 text-center font-bold whitespace-nowrap">AMOUNT</th>
                  <th className="border p-2 text-center font-bold whitespace-nowrap">YTD</th>
                  <th className="border p-2 text-left font-bold whitespace-nowrap">DEDUCTION</th>
                  <th className="border p-2 text-center font-bold whitespace-nowrap">AMOUNT</th>
                  <th className="border p-2 text-center font-bold whitespace-nowrap">YTD</th>
                </tr>
              </thead>
              <tbody>
                {earningsRows.map((row, i) => (
                  <tr key={i}>
                    <td className="border p-2">{row[0]}</td>
                    <td className="border p-2 text-right whitespace-nowrap">{formatMoney(row[1])}</td>
                    <td className="border p-2 text-center">-</td>
                    <td className="border p-2">{i === 0 ? "Tax Payable" : "\u00A0"}</td>
                    <td className="border p-2 text-right whitespace-nowrap">
                      {i === 0 ? formatMoney(payslip.deductions?.taxPayable ?? 0) : "\u00A0"}
                    </td>
                    <td className="border p-2 text-center">-</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="border p-2">Gross Earnings</td>
                  <td className="border p-2 text-right whitespace-nowrap">{formatMoney(gross)}</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2">Total Deductions</td>
                  <td className="border p-2 text-right whitespace-nowrap">{formatMoney(ded)}</td>
                  <td className="border p-2 text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Net Payable - keep together when printing */}
          <div className="payslip-total-block mt-6 bg-[#e6fbff] p-4 border rounded">
            <p className="text-center font-bold">TOTAL NET PAYABLE</p>
            <p className="text-center text-xl font-bold text-[#019ee3] mt-1">{formatMoney(net)}</p>
            <p className="text-sm mt-2" style={{ textAlign: "center" }}>
              Total Net Payable {formatMoney(net)} (Indian Rupee {numberToWords(Math.max(0, Math.round(net)))} Only)
            </p>
          </div>

          <p className="text-xs text-center mt-4 text-gray-500">
            This document is system generated by Corp Culture;
            therefore, a signature is not required.
          </p>

        </Paper>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
          body.print-payslip-active #root { display: none !important; }
          body.print-payslip-active .print-payslip-clone-wrapper,
          body.print-payslip-active .print-payslip-clone-wrapper * { visibility: visible !important; }
          .print-payslip-clone-wrapper {
            position: static !important;
            width: 190mm !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: white !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            page-break-after: avoid !important;
          }
          .print-payslip-clone-wrapper .payslip-print-area {
            box-shadow: none !important;
            width: 190mm !important;
            min-height: auto !important;
            padding: 8mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
          }
          .payslip-table-wrap { overflow: visible !important; }
          .payslip-main-table { min-width: 0 !important; width: 100% !important; }
          .payslip-print-area table { page-break-inside: avoid; }
          .payslip-total-block { page-break-inside: avoid; }
          .print-payslip-ratings span { font-size: 9px !important; }
          .print-payslip-ratings .truncate { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
          .payslip-print-area p,
          .payslip-print-area th,
          .payslip-print-area td { font-size: 12px !important; }
          .payslip-print-area h1 { font-size: 18px !important; }
          .payslip-print-area h2 { font-size: 16px !important; margin-bottom: 14px !important; }
          .payslip-print-area .text-2xl { font-size: 20px !important; }
          .payslip-print-area .mb-6 { margin-bottom: 14px !important; }
          .payslip-print-area .mt-6 { margin-top: 14px !important; }
          .payslip-print-area .mt-4 { margin-top: 10px !important; }
          .payslip-print-area .mt-3 { margin-top: 8px !important; }
          .payslip-print-area .mt-2 { margin-top: 6px !important; }
          .payslip-print-area .pb-4 { padding-bottom: 10px !important; }
          .payslip-print-area .p-6 { padding: 0 !important; }
          .payslip-print-area .p-4 { padding: 10px !important; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>

    </>
  );
}