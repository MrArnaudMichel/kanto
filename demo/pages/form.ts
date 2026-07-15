import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';

const REGIONS = [
  { id: 'idf', label: 'Île-de-France' },
  { id: 'bzh', label: 'Bretagne' },
  { id: 'occ', label: 'Occitanie' },
  { id: 'paca', label: "Provence-Alpes-Côte d'Azur" },
];

const PLANS = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'entreprise', label: 'Entreprise' },
];

/**
 * A real form, so the page is also a test: every Kanto field is
 * form-associated, and this submit reads the values straight out of FormData
 * with no manual wiring.
 */
function onSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const entries = [...data.entries()].map(
    ([key, value]) => `${key} = ${value instanceof File ? value.name : value}`,
  );

  toaster.success('Entité créée', {
    description: entries.length > 0 ? entries.join(' · ') : 'Aucun champ rempli.',
  });
}

export function formPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Formulaire</h1>
      <p>
        Chaque champ Kanto est un élément associé au formulaire : il se sérialise dans
        <code>FormData</code> sous son <code>name</code>, se réinitialise avec le formulaire et
        rapporte sa validité comme un champ natif. Envoyez pour voir ce que le serveur recevrait.
      </p>
    </header>

    <form @submit=${onSubmit} @reset=${() => toaster.info('Formulaire réinitialisé')}>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">
        <kt-card>
          <h6 slot="header">Identité</h6>
          <div class="stack" style="gap:var(--gap-form)">
            <kt-label-input label="Raison sociale" required>
              <kt-input name="company" required value="Atelier Kanto"></kt-input>
            </kt-label-input>

            <kt-label-input label="Adresse e-mail" required>
              <kt-input
                name="email"
                type="email"
                required
                placeholder="contact@exemple.fr"
              ></kt-input>
            </kt-label-input>

            <kt-label-input label="Téléphone">
              <kt-input name="phone" type="tel"></kt-input>
            </kt-label-input>

            <kt-label-input label="Région">
              <kt-select name="region" .options=${REGIONS} placeholder="Sélectionner"></kt-select>
            </kt-label-input>
          </div>
        </kt-card>

        <kt-card>
          <h6 slot="header">Abonnement</h6>
          <div class="stack" style="gap:var(--gap-form)">
            <kt-label-input label="Formule">
              <kt-segmented-control
                label="Formule"
                .value=${'pro'}
                .options=${PLANS}
              ></kt-segmented-control>
            </kt-label-input>

            <kt-label-input label="Notes internes">
              <kt-textarea name="notes" maxlength="280" rows="4"></kt-textarea>
            </kt-label-input>

            <kt-toggle name="newsletter" value="oui" checked>Recevoir les actualités</kt-toggle>
            <kt-toggle name="beta" value="oui">Accès aux fonctionnalités bêta</kt-toggle>

            <kt-label-input label="Logo">
              <kt-drag-drop accept="image/*" recommended-size="512×512px"></kt-drag-drop>
            </kt-label-input>
          </div>
        </kt-card>
      </div>

      <div class="row" style="justify-content:flex-end;margin-top:20px">
        <kt-button variant="dark" type="reset">Réinitialiser</kt-button>
        <kt-button type="submit" icon="check">Créer l'entité</kt-button>
      </div>
    </form>
  `;
}
