import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAppointments, getDoctors, cancelAppt, createStripeCheckoutSession, getPaymentByAppointment } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Appointments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctorMap, setDoctorMap] = useState({});
  const [paymentMap, setPaymentMap] = useState({}); // appointmentId -> payment | null
  const [payingId, setPayingId] = useState(null); // appointmentId currently initiating payment
  const [user, setUser] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rawUser = localStorage.getItem('emedicare_user');
      if (!rawUser) { navigate('/login'); return; }

      const parsedUser = JSON.parse(rawUser);
      if (!parsedUser?.id) { navigate('/login'); return; }
      setUser(parsedUser);

      const [appointmentsRes, doctorsRes] = await Promise.all([
        getAppointments({ patientId: parsedUser.id }),
        getDoctors(),
      ]);

      const doctorLookup = Object.fromEntries(
        (doctorsRes.data?.doctors || []).flatMap((doctor) => [
          [doctor._id, { name: doctor.name, fee: doctor.consultationFee || 100 }],
          [doctor.userId, { name: doctor.name, fee: doctor.consultationFee || 100 }],
        ])
      );

      const appts = appointmentsRes.data?.appointments || [];
      setDoctorMap(doctorLookup);
      setAppointments(appts);

      // Load payment statuses for all non-cancelled appointments
      const payable = appts.filter(
        (a) => a.status !== 'cancelled' && a.status !== 'rejected'
      );
      const paymentResults = await Promise.allSettled(
        payable.map((a) => getPaymentByAppointment(a._id))
      );
      const pm = {};
      payable.forEach((a, i) => {
        const result = paymentResults[i];
        pm[a._id] = result.status === 'fulfilled' ? result.value.data?.payment || null : null;
      });
      setPaymentMap(pm);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load patient appointments and doctor names for readable table output.
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppt(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handlePayNow = async (appt) => {
    setPayingId(appt._id);
    try {
      const doctorInfo = doctorMap[appt.doctorId] || {};
      const amount = doctorInfo.fee || 100;
      const doctorName = doctorInfo.name || appt.doctorId || '';
      const apptDate = appt.date ? new Date(appt.date).toLocaleDateString() : '';

      const res = await createStripeCheckoutSession({
        patientId: user.id,
        appointmentId: appt._id,
        amount,
        patientName: user.name || '',
        patientEmail: user.email || '',
        doctorName,
        appointmentDate: apptDate,
        appointmentTime: appt.time || '',
      });

      // Redirect to Stripe Checkout
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert('Could not create payment session. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate payment.';
      if (msg.includes('already been paid')) {
        // Refresh payment statuses
        loadData();
      } else {
        alert(msg);
      }
    } finally {
      setPayingId(null);
    }
  };

  const downloadReceipt = (payment) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(10, 15, 40);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('eMediCare', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 190, 220);
    doc.text('Official Payment Receipt', 14, 26);
    doc.text('Advanced Healthcare Management System', 14, 32);

    doc.setFillColor(56, 82, 219);
    doc.roundedRect(pageWidth - 50, 10, 36, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - 34, 18, { align: 'center' });

    doc.setDrawColor(56, 82, 219);
    doc.setLineWidth(0.8);
    doc.line(14, 48, pageWidth - 14, 48);

    doc.setTextColor(30, 30, 60);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Receipt', 14, 60);

    const transDate = payment.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : new Date().toLocaleString();

    autoTable(doc, {
      startY: 65,
      margin: { left: 14, right: 14 },
      head: [['Field', 'Details']],
      body: [
        ['Transaction ID', payment.transactionId || 'N/A'],
        ['Date & Time', transDate],
        ['Amount Paid', `$${Number(payment.amount || 0).toFixed(2)} USD`],
        ['Status', 'PAID ✓'],
        ['Patient', payment.patientName || 'N/A'],
        ['Doctor', `Dr. ${payment.doctorName || 'N/A'}`],
        ['Appointment', `${payment.appointmentDate || 'N/A'} ${payment.appointmentTime || ''}`],
      ],
      headStyles: { fillColor: [56, 82, 219], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 80] },
      alternateRowStyles: { fillColor: [240, 243, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    const afterTable = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(240, 243, 255);
    doc.roundedRect(14, afterTable, pageWidth - 28, 18, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 160);
    doc.text('Thank you for choosing eMediCare. This is an official digitally generated receipt.', pageWidth / 2, afterTable + 8, { align: 'center' });
    doc.text('For queries, contact support@emedicare.health', pageWidth / 2, afterTable + 14, { align: 'center' });

    doc.save(`receipt-${payment.transactionId || payment._id}.pdf`);
  };

  // Keep newest appointments first for easier patient review.
  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [appointments]
  );

  // Map appointment status to UI color classes.
  const statusClass = (status) => {
    if (status === 'confirmed') return 'text-emerald-300';
    if (status === 'cancelled' || status === 'rejected') return 'text-red-300';
    if (status === 'completed') return 'text-sky-300';
    return 'text-amber-300';
  };

  const renderPaymentCell = (item) => {
    // No payment option for cancelled/rejected
    if (item.status === 'cancelled' || item.status === 'rejected') {
      return <span className="text-white/25 text-xs">—</span>;
    }

    const paid = paymentMap[item._id];

    if (paid) {
      // Already paid — green badge + download receipt
      return (
        <div className="flex flex-col items-start gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Paid
          </span>
          <button
            type="button"
            onClick={() => downloadReceipt(paid)}
            className="text-[10px] text-primary/70 hover:text-primary underline underline-offset-2"
          >
            Download Receipt
          </button>
        </div>
      );
    }

    // Pending payment — show Pay Now button
    if (item.status === 'pending' || item.status === 'confirmed') {
      return (
        <button
          type="button"
          disabled={payingId === item._id}
          onClick={() => handlePayNow(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 hover:bg-primary/35 text-primary border border-primary/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-wait hover:-translate-y-0.5"
        >
          {payingId === item._id ? (
            <>
              <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pay Now
            </>
          )}
        </button>
      );
    }

    return <span className="text-white/25 text-xs">—</span>;
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="section-tag mb-3">My Schedule</div>
        <h1 className="text-3xl font-heading font-bold mb-2">Appointments</h1>
        <p className="text-white/50 text-sm mb-10">
          Track your appointments and pay consultation fees directly.
        </p>

        {error && <div className="alert-error mb-6">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <span className="text-6xl">📅</span>
            <h2 className="text-xl font-heading font-semibold">No appointments yet</h2>
            <p className="text-white/40 text-sm">Book your first appointment with a doctor to get started.</p>
            <Link to="/doctors" className="btn-primary px-6 py-2.5 text-sm">Find a Doctor</Link>
          </div>
        ) : (
          <section className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/60 border-b border-white/10">
                  <tr>
                    <th className="text-left py-2 pr-3">Doctor</th>
                    <th className="text-left py-2 pr-3">Date/Time</th>
                    <th className="text-left py-2 pr-3">Type</th>
                    <th className="text-left py-2 pr-3 text-center">Status</th>
                    <th className="text-left py-2 pr-3">Payment</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((item) => (
                    <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pr-3 font-medium">
                        {doctorMap[item.doctorId]?.name || item.doctorId}
                      </td>
                      <td className="py-4 pr-3">
                        <div className="flex flex-col">
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span className="text-xs text-white/50">{item.time}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-3 capitalize text-white/70">{item.type || 'in-person'}</td>
                      <td className="py-4 pr-3 text-center">
                        <span className={`capitalize font-semibold ${statusClass(item.status)} border border-current/20 px-2 py-0.5 rounded-md text-[10px]`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 pr-3">
                        {renderPaymentCell(item)}
                      </td>
                      <td className="py-4 text-right">
                        {(item.status === 'pending' || item.status === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => handleCancel(item._id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
