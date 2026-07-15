import { html, type TemplateResult } from 'lit';

const STATS = [
  { label: 'Revenus', value: '24 892 €', delta: '+ 12,4 %', tone: 'success', icon: 'trending-up' },
  { label: 'Entités', value: '4 812', delta: '+ 3,1 %', tone: 'success', icon: 'users' },
  { label: 'En attente', value: '128', delta: '- 8,0 %', tone: 'warning', icon: 'clock' },
  { label: 'Incidents', value: '3', delta: '+ 2', tone: 'danger', icon: 'circle-alert' },
] as const;

const TRANSACTIONS = [
  {
    id: 1,
    ref: 'TR-4812',
    client: 'Groupe Miotte',
    amount: '1 240,00 €',
    date: '25 Jan',
    status: 'Payé',
  },
  {
    id: 2,
    ref: 'TR-4811',
    client: 'Atelier Kanto',
    amount: '320,50 €',
    date: '24 Jan',
    status: 'En attente',
  },
  {
    id: 3,
    ref: 'TR-4810',
    client: 'SARL Bertin',
    amount: '120,00 €',
    date: '24 Jan',
    status: 'Payé',
  },
  {
    id: 4,
    ref: 'TR-4809',
    client: 'Studio Nord',
    amount: '2 980,00 €',
    date: '23 Jan',
    status: 'Échoué',
  },
];

const ACTIVITY = [
  { icon: 'user-plus', text: 'Nouvelle entité créée', time: 'il y a 2 min' },
  { icon: 'file-check', text: 'Rapport mensuel validé', time: 'il y a 18 min' },
  { icon: 'triangle-alert', text: 'Quota de stockage à 88 %', time: 'il y a 1 h' },
  { icon: 'refresh-cw', text: 'Synchronisation terminée', time: 'il y a 3 h' },
];

const STATUS_TONE: Record<string, string> = {
  Payé: 'var(--color-success-base)',
  'En attente': 'var(--color-warning-base)',
  Échoué: 'var(--color-danger-base)',
};

/** A bar chart drawn from tokens — Kanto ships no charting library. */
function miniChart(): TemplateResult {
  const bars = [42, 58, 36, 71, 64, 88, 52, 76, 61, 94, 70, 83];

  return html`<div style="display:flex;align-items:flex-end;gap:6px;height:180px">
    ${bars.map(
      (value, index) =>
        html`<span
          title=${`${value} k€`}
          style=${`flex:1;height:${value}%;border-radius:4px 4px 0 0;background:${
            index === bars.length - 2 ? 'var(--color-primary-base)' : 'var(--surface-raised)'
          }`}
        ></span>`,
    )}
  </div>`;
}

export function dashboardPage(): TemplateResult {
  return html`
    <header class="page-header">
      <div class="row" style="justify-content:space-between">
        <div class="stack" style="gap:6px">
          <h1>Tableau de bord</h1>
          <p>Bienvenue sur votre espace de gestion Kanto.</p>
        </div>
        <div class="row">
          <kt-button variant="dark" icon="refresh-cw">Actualiser</kt-button>
          <kt-button icon="plus">Nouvelle entité</kt-button>
        </div>
      </div>
    </header>

    <section>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${STATS.map(
          (stat) =>
            html`<kt-card>
              <div slot="header" class="row" style="justify-content:space-between">
                <span class="overline">${stat.label}</span>
                <kt-icon
                  name=${stat.icon}
                  size="18"
                  style=${`color:var(--color-${stat.tone}-base)`}
                ></kt-icon>
              </div>
              <div style="font:var(--font-title-h1)">${stat.value}</div>
              <span slot="footer" style=${`color:var(--color-${stat.tone}-base)`}
                >${stat.delta}</span
              >
            </kt-card>`,
        )}
      </div>
    </section>

    <section>
      <div
        class="grid"
        style="grid-template-columns:2fr 1fr;align-items:start;grid-template-columns:minmax(0,2fr) minmax(0,1fr)"
      >
        <kt-card>
          <div slot="header" class="row" style="justify-content:space-between">
            <h6>Chiffre d'affaires</h6>
            <kt-segmented-control
              size="small"
              label="Période"
              .value=${'month'}
              .options=${[
                { value: 'week', label: 'Semaine' },
                { value: 'month', label: 'Mois' },
                { value: 'year', label: 'Année' },
              ]}
            ></kt-segmented-control>
          </div>
          ${miniChart()}
        </kt-card>

        <kt-card>
          <h6 slot="header">Activité</h6>
          <div class="stack">
            ${ACTIVITY.map(
              (entry) =>
                html`<div class="row" style="gap:10px;flex-wrap:nowrap">
                  <kt-icon name=${entry.icon} size="18" style="color:var(--text-muted)"></kt-icon>
                  <span style="flex:1;min-width:0">${entry.text}</span>
                  <span
                    style="color:var(--text-muted);font:var(--font-normal-small);white-space:nowrap"
                    >${entry.time}</span
                  >
                </div>`,
            )}
          </div>
          <kt-button slot="footer" variant="text">Voir tout l'historique</kt-button>
        </kt-card>
      </div>
    </section>

    <section>
      <kt-card>
        <h6 slot="header">Transactions récentes</h6>
        <kt-table
          label="Transactions récentes"
          compact
          .columns=${[
            { key: 'ref', label: 'Référence', sortable: true },
            { key: 'client', label: 'Client', sortable: true },
            { key: 'amount', label: 'Montant', sortable: true, align: 'right' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Statut' },
          ]}
          .data=${TRANSACTIONS}
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) =>
            column.key === 'status'
              ? html`<kt-chip
                  variant="category"
                  color=${STATUS_TONE[String(row['status'])] ?? 'var(--text-muted)'}
                  >${row['status']}</kt-chip
                >`
              : undefined}
        ></kt-table>
        <kt-button slot="footer" variant="text">Voir tout l'historique</kt-button>
      </kt-card>
    </section>
  `;
}
