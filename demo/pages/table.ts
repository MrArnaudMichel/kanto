import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';

interface Entity extends Record<string, unknown> {
  id: number;
  name: string;
  region: string;
  amount: number;
  status: 'Actif' | 'En attente' | 'Archivé';
}

const REGIONS = ['Île-de-France', 'Bretagne', 'Occitanie', "Provence-Alpes-Côte d'Azur"];
const STATUSES: Entity['status'][] = ['Actif', 'En attente', 'Archivé'];

/**
 * Deterministic sample rows — a seeded sequence rather than Math.random, so
 * the page looks the same on every reload and a screenshot stays comparable.
 */
const ENTITIES: Entity[] = Array.from({ length: 43 }, (_, index) => ({
  id: index + 1,
  name: `Entité ${4800 + index}`,
  region: REGIONS[(index * 3) % REGIONS.length]!,
  amount: ((index * 977) % 9000) + 120,
  status: STATUSES[(index * 5) % STATUSES.length]!,
}));

const STATUS_TONE: Record<string, string> = {
  Actif: 'var(--color-success-base)',
  'En attente': 'var(--color-warning-base)',
  Archivé: 'var(--text-muted)',
};

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function tablePage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Données</h1>
      <p>
        Tri tri-états, sélection multiple, pagination. Les en-têtes triables sont de vrais boutons :
        un tableau qu'on ne peut trier qu'à la souris est un tableau que la moitié des utilisateurs
        ne peut pas trier.
      </p>
    </header>

    <section>
      <div class="row" style="justify-content:space-between;margin-bottom:14px">
        <kt-input placeholder="Rechercher une entité..." icon="search" style="max-width:320px">
        </kt-input>
        <div class="row">
          <kt-button variant="dark" icon="download">Exporter</kt-button>
          <kt-button icon="plus">Nouvelle entité</kt-button>
        </div>
      </div>

      <kt-card>
        <kt-table
          label="Entités"
          selectable
          page-size="10"
          .columns=${[
            { key: 'name', label: 'Nom', sortable: true },
            { key: 'region', label: 'Région', sortable: true },
            { key: 'amount', label: 'Montant', sortable: true, align: 'right' },
            { key: 'status', label: 'Statut', sortable: true },
          ]}
          .data=${ENTITIES}
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
            if (column.key === 'amount') return currency.format(Number(row['amount']));
            if (column.key === 'status') {
              return html`<kt-chip
                variant="category"
                color=${STATUS_TONE[String(row['status'])] ?? 'var(--text-muted)'}
                >${row['status']}</kt-chip
              >`;
            }
            return undefined;
          }}
          @kt-selection-change=${(event: CustomEvent<{ selected: unknown[] }>) => {
            const count = event.detail.selected.length;
            if (count > 0)
              toaster.info(
                `${count} entité${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`,
              );
          }}
        ></kt-table>
      </kt-card>
    </section>

    <section>
      <h6>États</h6>
      <div class="stack">
        <kt-card>
          <span slot="header" class="overline">Chargement</span>
          <kt-table loading .columns=${[{ key: 'name', label: 'Nom' }]}></kt-table>
        </kt-card>
        <kt-card>
          <span slot="header" class="overline">Vide</span>
          <kt-table
            .columns=${[
              { key: 'name', label: 'Nom' },
              { key: 'region', label: 'Région' },
            ]}
            .data=${[]}
          ></kt-table>
        </kt-card>
      </div>
    </section>
  `;
}
