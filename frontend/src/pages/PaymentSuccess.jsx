import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPaymentSuccess } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | already_paid | error
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');

  const confirmPayment = useCallback(async () => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID found in the URL. Please check your payment status.');
      return;
    }

    try {
      const res = await confirmPaymentSuccess(sessionId);
      setPayment(res.data.payment);
      setStatus('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to confirm payment.';
      if (msg.includes('already')) {
        setStatus('already_paid');
      } else {
        setStatus('error');
        setError(msg);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  const downloadReceipt = () => {
    if (!payment) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header background ────────────────────────────────────────
    doc.setFillColor(10, 15, 40);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // ── Clinic name ──────────────────────────────────────────────
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('eMediCare', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 190, 220);
    doc.text('Official Payment Receipt', 14, 26);
    doc.text('Advanced Healthcare Management System', 14, 32);

    // Receipt badge (right side)
    doc.setFillColor(56, 82, 219);
    doc.roundedRect(pageWidth - 50, 10, 36, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - 34, 18, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Confirmed', pageWidth - 34, 22, { align: 'center' });

    // ── Divider line ─────────────────────────────────────────────
    doc.setDrawColor(56, 82, 219);
    doc.setLineWidth(0.8);
    doc.line(14, 48, pageWidth - 14, 48);

    // ── Transaction summary section ──────────────────────────────
    doc.setTextColor(30, 30, 60);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Summary', 14, 60);

    const transDate = payment.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : new Date().toLocaleString();

    autoTable(doc, {
      startY: 65,
      margin: { left: 14, right: 14 },
      head: [['Field', 'Details']],
      body: [
        ['Transaction ID', payment.transactionId || 'N/A'],
        ['Stripe Session ID', payment.stripeSessionId || 'N/A'],
        ['Date & Time', transDate],
        ['Payment Status', 'PAID ✓'],
        ['Payment Method', 'Stripe — Credit / Debit Card'],
        ['Amount', `$${Number(payment.amount || 0).toFixed(2)} USD`],
      ],
      headStyles: {
        fillColor: [56, 82, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 80] },
      alternateRowStyles: { fillColor: [240, 243, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    const afterTxn = doc.lastAutoTable.finalY + 8;

    // ── Patient details ──────────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.text('Patient Details', 14, afterTxn);

    autoTable(doc, {
      startY: afterTxn + 5,
      margin: { left: 14, right: 14 },
      head: [['Field', 'Details']],
      body: [
        ['Patient Name', payment.patientName || 'N/A'],
        ['Email', payment.patientEmail || 'N/A'],
      ],
      headStyles: {
        fillColor: [56, 82, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 80] },
      alternateRowStyles: { fillColor: [240, 243, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    const afterPatient = doc.lastAutoTable.finalY + 8;

    // ── Appointment details ──────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.text('Appointment Details', 14, afterPatient);

    autoTable(doc, {
      startY: afterPatient + 5,
      margin: { left: 14, right: 14 },
      head: [['Field', 'Details']],
      body: [
        ['Appointment ID', payment.appointmentId || 'N/A'],
        ['Doctor', `Dr. ${payment.doctorName || 'N/A'}`],
        ['Date', payment.appointmentDate || 'N/A'],
        ['Time', payment.appointmentTime || 'N/A'],
      ],
      headStyles: {
        fillColor: [56, 82, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 80] },
      alternateRowStyles: { fillColor: [240, 243, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    const afterAppt = doc.lastAutoTable.finalY + 12;

    // ── Footer box ───────────────────────────────────────────────
    doc.setFillColor(240, 243, 255);
    doc.roundedRect(14, afterAppt, pageWidth - 28, 18, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 160);
    doc.text(
      'Thank you for choosing eMediCare. This is an official digitally generated receipt.',
      pageWidth / 2,
      afterAppt + 7,
      { align: 'center' }
    );
    doc.text(
      'For queries, contact support@emedicare.health | eMediCare Healthcare Pvt. Ltd.',
      pageWidth / 2,
      afterAppt + 13,
      { align: 'center' }
    );

    doc.save(`receipt-${payment.transactionId || sessionId}.pdf`);
  };

  /* ── Loading state ─────────────────────────────────────────── */
  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Confirming your payment with Stripe…</p>
        </div>
      </main>
    );
  }

  /* ── Error state ───────────────────────────────────────────── */
  if (status === 'error') {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="font-heading text-2xl font-bold text-red-300">Payment Verification Failed</h1>
          <p className="text-white/60 text-sm">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/appointments" className="btn-outline text-sm">View Appointments</Link>
            <Link to="/dashboard" className="btn-primary text-sm">Go to Dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Success / Already Paid state ──────────────────────────── */
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">

        {/* Success card */}
        <div className="card text-center space-y-5">
          {/* Animated checkmark */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <div className="section-tag mx-auto w-fit mb-3">Payment Confirmed</div>
            <h1 className="text-3xl font-heading font-bold">
              {status === 'already_paid' ? 'Already Paid' : 'Payment Successful!'}
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {status === 'already_paid'
                ? 'This appointment was already paid for. No amount was charged again.'
                : 'Your consultation fee has been paid. Your appointment is confirmed.'}
            </p>
          </div>

          {/* Payment details */}
          {payment && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/50">Amount Paid</span>
                <span className="font-bold text-emerald-300 text-lg">${Number(payment.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/50">Transaction ID</span>
                <span className="font-mono text-xs text-white/80 break-all text-right">{payment.transactionId || 'N/A'}</span>
              </div>
              {payment.doctorName && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/50">Doctor</span>
                  <span className="text-white">Dr. {payment.doctorName}</span>
                </div>
              )}
              {payment.appointmentDate && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/50">Appointment</span>
                  <span className="text-white">{payment.appointmentDate} {payment.appointmentTime}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/50">Date</span>
                <span className="text-white">
                  {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Download receipt button */}
          <button
            type="button"
            onClick={downloadReceipt}
            disabled={!payment}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt (PDF)
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/appointments" className="btn-outline flex-1 justify-center text-sm">
              📅 My Appointments
            </Link>
            <Link to="/dashboard" className="btn-primary flex-1 justify-center text-sm">
              🏠 Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
