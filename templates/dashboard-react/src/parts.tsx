/** Small pieces several screens share. */
import type { ReactNode } from 'react';
import type { Tile } from './data/api';

/** A figure with its icon chip: the overview's, the files' and the roles' tiles. */
export function TileCard({ tile, loading = false }: { tile: Tile; loading?: boolean }) {
  return (
    <kt-card className="tile">
      <span className={`tile-icon ${tile.tone}`}>
        <kt-icon name={tile.icon} size={18} />
      </span>
      <kt-stat
        label={tile.label}
        value={tile.value}
        delta={tile.delta ?? ''}
        trend={tile.trend ?? 'flat'}
        inverted={tile.inverted === true}
        loading={loading}
      />
    </kt-card>
  );
}

/** A section's header inside a page, with a link on the right. */
export function SectionHeader({
  heading,
  link,
}: {
  heading: string;
  link?: { label: string; href: string };
}) {
  return (
    <kt-page-header level="section" heading={heading}>
      {link ? (
        <a slot="actions" href={link.href}>
          {link.label}
        </a>
      ) : null}
    </kt-page-header>
  );
}

/** A screen's root: the class the stylesheet and the tests find it by. */
export function Screen({ name, children }: { name: string; children: ReactNode }) {
  return <div className={`screen screen-${name}`}>{children}</div>;
}
