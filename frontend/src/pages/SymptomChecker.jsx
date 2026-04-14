import { useState } from 'react';
import { checkSymptoms } from '../services/api';

const SYMPTOM_SUGGESTIONS = [
  'fever', 'headache', 'cough', 'fatigue', 'chest pain',
  'nausea', 'shortness of breath',
];

export default function SymptomChecker() {
  const [input, setInput]     = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const addSymptom = (s) => {
    const clean = s.trim().toLowerCase();
    if (clean && !symptoms.includes(clean)) setSymptoms([...symptoms, clean]);
    setInput('');
  };

  const removeSymptom = (s) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleCheck = async () => {
    if (!symptoms.length) { setError('Please add at least one symptom.'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const { data } = await checkSymptoms(symptoms);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="section-tag mx-auto w-fit mb-3">AI Powered</div>
          <h1 className="text-3xl font-heading font-bold mb-2">Symptom Checker</h1>
          <p className="text-white/50 text-sm">Describe your symptoms and get instant health insights from our AI engine.</p>
        </div>

        <div className="card mb-6">
          {/* Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Type a symptom (e.g. fever)"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSymptom(input)}
            />
            <button onClick={() => addSymptom(input)} className="btn-primary px-5 py-2.5 whitespace-nowrap">Add</button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SYMPTOM_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => addSymptom(s)}
                className="text-xs px-3 py-1 rounded-full bg-bg-surface2 text-white/50 hover:bg-primary/20 hover:text-primary transition-all border border-white/[0.06]">
                + {s}
              </button>
            ))}
          </div>

          {/* Added Symptoms */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {symptoms.map((s) => (
                <span key={s} className="flex items-center gap-1.5 badge badge-primary">
                  {s}
                  <button onClick={() => removeSymptom(s)} className="text-primary hover:text-white text-xs leading-none">✕</button>
                </span>
              ))}
            </div>
          )}

          {error && <div className="alert-error mb-4">{error}</div>}

          <button onClick={handleCheck} disabled={loading || !symptoms.length}
            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Analysing...' : '🤖 Analyse Symptoms'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="card border-primary/20 animate-fade-up">
            <h2 className="font-heading font-bold text-lg mb-4">Analysis Result</h2>
            <div className="space-y-4">
              {result.triage && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Triage Level</p>
                  <span className={`badge capitalize ${result.triage.level === 'emergency' ? 'badge-red' : result.triage.level === 'urgent' ? 'badge-amber' : 'badge-green'}`}>
                    {result.triage.level}
                  </span>
                  <p className="text-xs text-white/50 mt-2">{result.triage.reason}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Possible Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {(result.likelyConditions?.length ? result.likelyConditions : result.possibleConditions || []).map((item) => {
                    const label = typeof item === 'string' ? item : `${item.condition} (${item.confidence}%)`;
                    return <span key={label} className="badge badge-amber">{label}</span>;
                  })}
                </div>
              </div>

              {Array.isArray(result.nextActions) && result.nextActions.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Next Actions</p>
                  <div className="space-y-1 text-xs text-white/70">
                    {result.nextActions.map((action) => (
                      <p key={action}>• {action}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="alert-info text-xs">{result.recommendation}</div>
              <div className="alert-error text-xs">⚠️ {result.disclaimer}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
