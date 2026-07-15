import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';

const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'secondary-no-bg',
  'dark',
  'danger',
  'delete',
  'warning',
  'info',
  'success',
  'text',
] as const;

const REGIONS = [
  { id: 'idf', label: 'Île-de-France' },
  { id: 'bzh', label: 'Bretagne' },
  { id: 'paca', label: "Provence-Alpes-Côte d'Azur", disabled: true },
  { id: 'occ', label: 'Occitanie' },
];

function demo(title: string, note: string, content: TemplateResult): TemplateResult {
  return html`<section>
    <h6>${title}</h6>
    <p style="color:var(--text-muted);margin-bottom:14px;max-width:68ch">${note}</p>
    ${content}
  </section>`;
}

export function componentsPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Composants</h1>
      <p>
        Vingt-trois éléments personnalisés. Cette page est elle-même construite avec eux, sans
        framework : ce que vous voyez ici est ce que vous obtenez partout ailleurs.
      </p>
    </header>

    ${demo(
      'Boutons',
      "Dix variantes. « primary » pour l'action dont l'écran parle, « delete » — le seul rouge plein — pour l'irréversible.",
      html`<div class="row">
          ${BUTTON_VARIANTS.map(
            (variant) => html`<kt-button variant=${variant}>${variant}</kt-button>`,
          )}
        </div>
        <div class="row" style="margin-top:12px">
          <kt-button size="small" icon="plus">Small</kt-button>
          <kt-button icon="refresh-cw">Medium</kt-button>
          <kt-button size="large" icon="chevron-right" icon-position="right">Large</kt-button>
          <kt-button icon="trash-2" variant="danger" label="Supprimer"></kt-button>
          <kt-button disabled>Désactivé</kt-button>
        </div>`,
    )}
    ${demo(
      'Cartes',
      'Surface transparente à 12px de rayon. Une carte « clickable » devient un vrai contrôle : tabulable, activable au clavier.',
      html`<div class="grid">
        <kt-card>
          <h6 slot="header">Revenus</h6>
          <div style="font:var(--font-title-h1)">24 892 €</div>
          <span slot="footer" style="color:var(--color-success-base)">+ 12,4 % ce mois</span>
        </kt-card>
        <kt-card clickable>
          <h6 slot="header">Entité 4812</h6>
          <span style="color:var(--text-muted)">Cliquable — essayez au clavier.</span>
        </kt-card>
      </div>`,
    )}
    ${demo(
      'Chips',
      'Tag en pilule, jeton de code monospacé, ou badge de catégorie teinté à 20 % via color-mix.',
      html`<div class="row">
        <kt-chip>Actif</kt-chip>
        <kt-chip clickable>Filtre : région</kt-chip>
        <kt-chip variant="code">--color-primary-base</kt-chip>
        <kt-chip variant="category" color="var(--color-success-base)">Livré</kt-chip>
        <kt-chip variant="category" color="var(--color-info-base)">Interne</kt-chip>
        <kt-chip error>Échec</kt-chip>
      </div>`,
    )}
    ${demo(
      'Champs',
      'Sans bordure : un fond qui gagne un outline de 2px — gris au survol, primaire au focus, rouge en erreur. Un outline est hors du flux, donc rien ne bouge.',
      html`<div class="stack" style="max-width:420px">
        <kt-input placeholder="Rechercher partout..." icon="search"></kt-input>
        <kt-input type="password" value="motdepasse"></kt-input>
        <kt-input type="tel"></kt-input>
        <kt-input error="Adresse invalide" value="pas-une-adresse"></kt-input>
        <kt-select placeholder="Sélectionner une région" .options=${REGIONS}></kt-select>
        <kt-input-menu placeholder="Rechercher une région" .options=${REGIONS}></kt-input-menu>
        <kt-textarea placeholder="Décrivez l'incident..." maxlength="280"></kt-textarea>
        <kt-toggle checked>Notifications</kt-toggle>
        <kt-drag-drop accept="image/*" recommended-size="800×400px"></kt-drag-drop>
      </div>`,
    )}
    ${demo(
      'Navigation',
      'Le contrôle segmenté est un radiogroup : un seul arrêt de tabulation, les flèches déplacent la sélection.',
      html`<div class="stack">
        <kt-breadcrumb
          .items=${[
            { label: 'Accueil', href: '#' },
            { label: 'Composants', href: '#components' },
            { label: 'Navigation' },
          ]}
        ></kt-breadcrumb>
        <kt-segmented-control
          label="Période"
          .value=${'week'}
          .options=${[
            { value: 'day', label: 'Jour' },
            { value: 'week', label: 'Semaine' },
            { value: 'month', label: 'Mois' },
          ]}
        ></kt-segmented-control>
        <kt-toggle-button-group label="Affichage">
          <kt-toggle-button value="list" icon="list">Liste</kt-toggle-button>
          <kt-toggle-button value="grid" icon="layout-grid">Grille</kt-toggle-button>
          <kt-toggle-button value="map" icon="map">Carte</kt-toggle-button>
        </kt-toggle-button-group>
      </div>`,
    )}
    ${demo(
      'Retours',
      "Les erreurs interrompent le lecteur d'écran ; le reste attend son tour. Survoler la pile de toasts met les comptes à rebours en pause.",
      html`<div class="stack" style="max-width:520px">
          <kt-progress-bar value="64" show-value label="Import"></kt-progress-bar>
          <kt-progress-bar value="88" variant="warning" striped animated></kt-progress-bar>
          <kt-progress-bar value="100" variant="danger"></kt-progress-bar>
          <kt-skeleton count="3"></kt-skeleton>
        </div>
        <div class="row" style="margin-top:12px">
          <kt-tooltip text="Enregistre et ferme le panneau">
            <kt-button variant="secondary">Survolez-moi</kt-button>
          </kt-tooltip>
          <kt-button
            variant="success"
            @click=${() => toaster.success('Entité créée', { description: 'Elle apparaît dans la liste.' })}
            >Toast succès</kt-button
          >
          <kt-button
            variant="danger"
            @click=${() => toaster.error('Échec de la sauvegarde', { description: 'Réessayez dans un instant.' })}
            >Toast erreur</kt-button
          >
        </div>`,
    )}
    ${demo(
      'Surcouches',
      'Le panneau latéral et la confirmation reposent sur <dialog> : couche supérieure, focus piégé, page inerte, Échap géré par la plateforme.',
      html`<div class="row">
          <kt-dropdown .options=${REGIONS}>
            <kt-button slot="trigger" variant="dark" icon="chevron-down" icon-position="right"
              >Menu</kt-button
            >
          </kt-dropdown>
          <kt-button
            variant="secondary"
            @click=${() => {
              document.querySelector('kt-side-panel')!.open = true;
            }}
            >Ouvrir le panneau</kt-button
          >
          <kt-button
            variant="delete"
            @click=${() => {
              document.querySelector('kt-confirm-dialog')!.open = true;
            }}
            >Supprimer…</kt-button
          >
        </div>

        <kt-side-panel eyebrow="Détails" heading="Entité 4812">
          <div class="stack">
            <kt-label-input label="Nom"><kt-input value="Entité 4812"></kt-input></kt-label-input>
            <kt-label-input label="Région"
              ><kt-select .options=${REGIONS}></kt-select
            ></kt-label-input>
          </div>
          <kt-button slot="footer" full-width>Enregistrer</kt-button>
        </kt-side-panel>

        <kt-confirm-dialog
          heading="Supprimer l'entité ?"
          message="Cette action est irréversible."
          confirm-label="Supprimer"
          @kt-confirm=${() => toaster.success('Entité supprimée')}
        ></kt-confirm-dialog>`,
    )}
  `;
}
