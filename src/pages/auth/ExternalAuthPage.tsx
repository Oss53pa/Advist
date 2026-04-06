import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Status = 'loading' | 'error';

export default function ExternalAuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage("Aucun token fourni dans l'URL.");
      return;
    }
    exchangeToken(token);
  }, [searchParams]);

  async function exchangeToken(token: string) {
    try {
      setStatus('loading');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Call atlas-sso to validate token and get magic link
      const response = await fetch(`${supabaseUrl}/functions/v1/atlas-sso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de validation du token');
      }

      // Establish session
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (otpError) {
        throw new Error(otpError.message);
      }

      // Fetch plan tier from Supabase (server-side source of truth)
      // Never trust JWT payload for plan tier — it is unverified client-side
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization:organizations(plan)')
            .eq('id', user.id)
            .single();

          const plan = (profile?.organization as { plan?: string } | null)?.plan || 'business';
          localStorage.setItem('advist_plan_tier', plan.toLowerCase());
        }
      } catch {
        // Non-blocking: plan will be resolved on next page load from tenant store
      }

      navigate('/user', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('External auth error:', message);
      setStatus('error');
      setErrorMessage(message);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0B',
      }}
    >
      <div style={{ maxWidth: 400, width: '100%', padding: 24, textAlign: 'center' }}>
        <div
          style={{
            background: '#1A1A1D',
            borderRadius: 16,
            padding: 40,
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: '#C8A961',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ color: '#0A0A0B', fontSize: 28, fontWeight: 300 }}>A</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 300, color: '#C8A961', marginBottom: 8 }}>
            Advist
          </h1>

          {status === 'loading' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16 }}>
                Connexion en cours...
              </p>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: '#C8A961',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 }}>
                Validation de votre session Atlas Studio
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {status === 'error' && (
            <div>
              <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Connexion impossible
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
                {errorMessage}
              </p>
              <a
                href="https://atlas-studio.org/portal"
                style={{
                  display: 'inline-block',
                  background: '#C8A961',
                  color: '#0A0A0B',
                  padding: '10px 24px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Retour a Atlas Studio
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
