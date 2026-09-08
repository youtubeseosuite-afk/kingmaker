// Path: app/login/page.tsx | Type: NEW
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="crest-title auth-card__title">Kronens Grænse</div>
        <p className="auth-card__subtitle">Træd ind i riget</p>

        {params.error && (
          <p className="auth-message auth-message--error">{params.error}</p>
        )}
        {params.message && (
          <p className="auth-message auth-message--success">{params.message}</p>
        )}

        <form className="auth-form">
          <label className="auth-form__label" htmlFor="email">
            E-mail
          </label>
          <input
            className="command-input"
            id="email"
            name="email"
            type="email"
            required
          />

          <label className="auth-form__label" htmlFor="password">
            Adgangskode
          </label>
          <input
            className="command-input"
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
          />

          <div className="auth-form__actions">
            <button className="btn btn--primary" formAction={login}>
              Log ind
            </button>
            <button className="btn" formAction={signup}>
              Opret konto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
