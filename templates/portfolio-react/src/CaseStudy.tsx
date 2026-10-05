import type { CareerStep } from './content';
import { projectBySlug } from './work';

export function Timeline({ steps }: { steps: readonly CareerStep[] }) {
  return (
    <kt-timeline>
      {steps.map((step) => (
        <kt-timeline-item
          key={step.heading}
          heading={step.heading}
          time={step.time}
          icon={step.icon}
          variant={step.variant}
        >
          {step.body}
        </kt-timeline-item>
      ))}
    </kt-timeline>
  );
}

export function Tags({ names }: { names: readonly string[] }) {
  return (
    <div className="tags">
      {names.map((name) => (
        <kt-badge key={name} label={name} />
      ))}
    </div>
  );
}

/** A project's case study, in a side panel: what it was, what changed, how it went. */
export function CaseStudy({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const project = slug ? projectBySlug(slug) : undefined;
  return (
    <kt-side-panel
      open={project !== undefined}
      eyebrow={project ? `${project.year} · ${project.role}` : ''}
      heading={project?.name ?? ''}
      onkt-close={onClose}
    >
      {project && (
        <>
          <p>{project.summary}</p>
          <div className="outcomes">
            {project.outcomes.map((outcome) => (
              <div key={outcome.label} className="outcome">
                <strong>{outcome.value}</strong>
                <span>{outcome.label}</span>
                {outcome.delta && (
                  <kt-badge variant="count" tone="success">
                    {outcome.delta}
                  </kt-badge>
                )}
              </div>
            ))}
          </div>
          <Timeline steps={project.phases} />
          <Tags names={project.tags} />
          <kt-button slot="footer" onClick={() => window.open(project.url, '_blank', 'noopener')}>
            Visit the site
          </kt-button>
        </>
      )}
    </kt-side-panel>
  );
}
