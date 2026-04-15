import { Link } from 'react-router-dom';

export default function PaymentCancel() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full card text-center space-y-5">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-400/30 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div>
          <div className="section-tag mx-auto w-fit mb-3">Payment Cancelled</div>
          <h1 className="text-3xl font-heading font-bold text-amber-200">Payment Cancelled</h1>
          <p className="text-white/50 text-sm mt-2">
            You cancelled the payment process. No amount has been charged to your card.
            You can retry the payment from your Appointments page.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 text-sm text-amber-200/70">
          💡 Your appointment slot is still reserved. Pay before the appointment date to confirm it.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/appointments" className="btn-primary flex-1 justify-center">
            📅 Go Back to Appointments
          </Link>
          <Link to="/dashboard" className="btn-outline flex-1 justify-center">
            🏠 Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
