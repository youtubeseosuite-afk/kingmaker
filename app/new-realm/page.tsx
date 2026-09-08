// Path: app/new-realm/page.tsx | Type: NEW
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createRealm } from "./actions";

export default async function NewRealmPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingRealm } = await supabase
    .from("realms")
    .select("id")
    .eq("player_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingRealm) {
    redirect("/");
  }

  const { data: worlds } = await supabase
    .from("worlds")
    .select("id, name")
    .eq("status", "active")
    .order("world_number");

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="crest-title auth-card__title">Grundlæg dit rige</div>
        <p className="auth-card__subtitle">Vælg verden og rolle</p>

        {params.error && (
          <p className="auth-message auth-message--error">{params.error}</p>
        )}

        <form className="auth-form" action={createRealm}>
          <label className="auth-form__label" htmlFor="username">
            Brugernavn
          </label>
          <input
            className="command-input"
            id="username"
            name="username"
            type="text"
            required
            minLength={2}
            maxLength={24}
          />

          <label className="auth-form__label" htmlFor="world_id">
            Verden
          </label>
          <select className="command-input" id="world_id" name="world_id" required>
            {worlds?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <label className="auth-form__label" htmlFor="role">
            Rolle
          </label>
          <select className="command-input" id="role" name="role" required>
            <option value="king">Kongen</option>
            <option value="merchant">Købmanden</option>
            <option value="wizard">Troldmanden</option>
            <option value="prior">Prioren</option>
          </select>

          <label className="auth-form__label" htmlFor="name">
            Rigets navn
          </label>
          <input
            className="command-input"
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={40}
          />

          <div className="auth-form__actions">
            <button className="btn btn--primary" type="submit">
              Grundlæg riget
            </button>
          </div>
        </form>

        {worlds?.length === 0 && (
          <p className="auth-card__subtitle">
            Ingen aktive verdener endnu — opret én i Supabase.
          </p>
        )}
      </div>
    </div>
  );
}
