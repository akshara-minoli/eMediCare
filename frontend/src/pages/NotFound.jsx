import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="pt-[72px] min-h-screen bg-bg flex items-center justify-center text-center px-6">
      <div className="animate-fade-up">
        <div className="text-8xl font-heading font-extrabold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-heading font-bold mb-3">Page Not Found</h1>
        <p className="text-white/50 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary px-8 py-3">← Back to Home</Link>
      </div>
    </main>
  );
}
