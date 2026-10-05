import { useRef, useState } from 'react';
import type { KtHeader } from 'kanto-ds';
import { downloadCv, scrollToSection } from './actions';
import { CaseStudy, Tags, Timeline } from './CaseStudy';
import { ContactForm } from './ContactForm';
import { CAREER, CONTACT, FOOTER, NAV, NUMBERS, PERSON, POSTS, TAGS } from './content';
import { projectsTagged } from './work';

export function App() {
  const header = useRef<KtHeader>(null);
  const [tag, setTag] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const projects = projectsTagged(tag);

  return (
    <>
      <kt-header sticky ref={header}>
        <a slot="brand" className="brand" href="#top">
          {PERSON.name}
        </a>
        <nav className="nav">
          {NAV.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <nav slot="menu" className="menu" aria-label="Menu">
          {NAV.map((link) => (
            <a key={link.href} href={link.href} onClick={() => header.current?.closeMenu()}>
              {link.label}
            </a>
          ))}
        </nav>
        <kt-button slot="actions" icon="mail" onClick={() => scrollToSection('contact')}>
          Get in touch
        </kt-button>
      </kt-header>

      <main className="page" id="top">
        <section className="intro">
          <kt-avatar name={PERSON.name} size="large" />
          <div>
            <kt-badge label={PERSON.available} variant="category" />
            <h1>{PERSON.heading}</h1>
            <p>{PERSON.lead}</p>
            <div className="row">
              <kt-button icon="arrow-down" onClick={() => scrollToSection('work')}>
                See the work
              </kt-button>
              <kt-button variant="secondary" icon="download" onClick={downloadCv}>
                Download CV
              </kt-button>
            </div>
          </div>
        </section>

        <section className="numbers" aria-label="In numbers">
          {NUMBERS.map((number) => (
            <kt-stat
              key={number.label}
              label={number.label}
              value={number.value}
              icon={number.icon}
            />
          ))}
        </section>

        <section id="work">
          <div className="section-head">
            <h2>Selected work</h2>
            <kt-toggle-button-group
              className="work-filter"
              label="Filter by tag"
              value={tag}
              onkt-change={(event) => {
                const value = event.detail.value as string | null;
                // The chosen tag clicked again empties the group: keep a tag chosen — All.
                if (value === null)
                  (event.target as HTMLElement & { value: string | null }).value = 'All';
                setTag(value ?? 'All');
              }}
            >
              {TAGS.map((name) => (
                <kt-toggle-button key={name} value={name}>
                  {name}
                </kt-toggle-button>
              ))}
            </kt-toggle-button-group>
          </div>
          <div className="work-grid">
            {projects.length === 0 ? (
              <kt-empty-state heading="Nothing tagged that yet" icon="search">
                <kt-button slot="actions" onClick={() => setTag('All')}>
                  Show everything
                </kt-button>
              </kt-empty-state>
            ) : (
              projects.map((project) => (
                <kt-card
                  key={project.slug}
                  className="work-card"
                  clickable
                  onkt-card-click={() => setOpen(project.slug)}
                >
                  <h3>{project.name}</h3>
                  <p>{project.tagline}</p>
                  <Tags names={project.tags} />
                  <span slot="footer">Read the case study</span>
                </kt-card>
              ))
            )}
          </div>
        </section>

        <section id="career">
          <div className="section-head">
            <h2>Where I have been</h2>
          </div>
          <Timeline steps={CAREER} />
        </section>

        <section id="writing">
          <div className="section-head">
            <h2>Writing</h2>
          </div>
          <kt-post-grid layout="list" align="start" headingLevel={2} posts={POSTS} />
        </section>

        <section id="contact" className="contact">
          <h2>{CONTACT.heading}</h2>
          <p>{CONTACT.lead}</p>
          <ContactForm />
        </section>
      </main>

      <CaseStudy slug={open} onClose={() => setOpen(null)} />

      <kt-footer variant="simple">
        <a slot="brand" className="brand" href="#top">
          {PERSON.name}
        </a>
        {FOOTER.tagline}
        <span slot="legal">{FOOTER.legal}</span>
      </kt-footer>
    </>
  );
}
