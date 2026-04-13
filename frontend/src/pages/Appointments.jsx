export default function Appointments() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="section-tag mb-3">My Schedule</div>
        <h1 className="text-3xl font-heading font-bold mb-2">Appointments</h1>
        <p className="text-white/50 text-sm mb-10">View and manage your upcoming and past appointments.</p>

        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <span className="text-6xl">📅</span>
          <h2 className="text-xl font-heading font-semibold">No appointments yet</h2>
          <p className="text-white/40 text-sm">Book your first appointment with a doctor to get started.</p>
          <a href="/doctors" className="btn-primary px-6 py-2.5 text-sm">Find a Doctor</a>
        </div>
      </div>
    </main>
  );
}
