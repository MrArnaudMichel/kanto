import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import type { KtButton, KtHeader, KtInput, KtPostGrid, KtSidePanel, KtTextarea } from 'kanto-ds';
import { downloadCv, scrollToSection, sendMessage } from './actions';
import { applyBrand } from './brand';
import {
  CAREER,
  CONTACT,
  FOOTER,
  NAV,
  NUMBERS,
  PERSON,
  POSTS,
  TAGS,
  type CareerStep,
  type Project,
} from './content';
import { projectBySlug, projectsTagged, validateMessage } from './work';

applyBrand();

/** An element, its attributes, and its children — text goes in as text, never as markup. */
function el(
  tag: string,
  attributes: Record<string, string | boolean> = {},
  children: (Node | string)[] = [],
): HTMLElement {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, '');
    else if (value !== false) node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

function timeline(steps: readonly CareerStep[]): HTMLElement {
  return el(
    'kt-timeline',
    {},
    steps.map((step) =>
      el(
        'kt-timeline-item',
        { heading: step.heading, time: step.time, icon: step.icon, variant: step.variant },
        [step.body],
      ),
    ),
  );
}

function tags(names: readonly string[]): HTMLElement {
  return el(
    'div',
    { class: 'tags' },
    names.map((name) => el('kt-badge', { label: name })),
  );
}

// === Header ===

const links = (onChoose?: () => void) =>
  NAV.map((link) => {
    const anchor = el('a', { href: link.href }, [link.label]);
    if (onChoose) anchor.addEventListener('click', onChoose);
    return anchor;
  });

const header = el('kt-header', { sticky: true }) as KtHeader;
const contactButton = el('kt-button', { slot: 'actions', icon: 'mail' }, ['Get in touch']);
contactButton.addEventListener('click', () => scrollToSection('contact'));
header.append(
  el('a', { slot: 'brand', class: 'brand', href: '#top' }, [PERSON.name]),
  el('nav', { class: 'nav' }, links()),
  el(
    'nav',
    { slot: 'menu', class: 'menu', 'aria-label': 'Menu' },
    links(() => header.closeMenu()),
  ),
  contactButton,
);

// === Introduction and numbers ===

const seeWork = el('kt-button', { icon: 'arrow-down' }, ['See the work']);
seeWork.addEventListener('click', () => scrollToSection('work'));
const cv = el('kt-button', { variant: 'secondary', icon: 'download' }, ['Download CV']);
cv.addEventListener('click', downloadCv);

const intro = el('section', { class: 'intro' }, [
  el('kt-avatar', { name: PERSON.name, size: 'large' }),
  el('div', {}, [
    el('kt-badge', { label: PERSON.available, variant: 'category' }),
    el('h1', {}, [PERSON.heading]),
    el('p', {}, [PERSON.lead]),
    el('div', { class: 'row' }, [seeWork, cv]),
  ]),
]);

const numbers = el(
  'section',
  { class: 'numbers', 'aria-label': 'In numbers' },
  NUMBERS.map((number) =>
    el('kt-stat', { label: number.label, value: number.value, icon: number.icon }),
  ),
);

// === Work, and its case studies ===

const panel = el('kt-side-panel', {}) as KtSidePanel;
const visit = el('kt-button', { slot: 'footer' }, ['Visit the site']);
let shown: Project | undefined;
visit.addEventListener('click', () => {
  if (shown) window.open(shown.url, '_blank', 'noopener');
});

function openProject(slug: string): void {
  const project = projectBySlug(slug);
  if (!project) return;
  shown = project;
  panel.eyebrow = `${project.year} · ${project.role}`;
  panel.heading = project.name;
  panel.replaceChildren(
    el('p', {}, [project.summary]),
    el(
      'div',
      { class: 'outcomes' },
      project.outcomes.map((outcome) =>
        el('div', { class: 'outcome' }, [
          el('strong', {}, [outcome.value]),
          el('span', {}, [outcome.label]),
          ...(outcome.delta
            ? [el('kt-badge', { variant: 'count', tone: 'success' }, [outcome.delta])]
            : []),
        ]),
      ),
    ),
    timeline(project.phases),
    tags(project.tags),
    visit,
  );
  panel.open = true;
}

const filter = el('kt-toggle-button-group', { class: 'work-filter', label: 'Filter by tag' });
filter.append(...TAGS.map((tag) => el('kt-toggle-button', { value: tag }, [tag])));
(filter as HTMLElement & { value: string | null }).value = 'All';

const grid = el('div', { class: 'work-grid' });

function showWork(tag: string): void {
  const projects = projectsTagged(tag);
  if (projects.length === 0) {
    const reset = el('kt-button', { slot: 'actions' }, ['Show everything']);
    reset.addEventListener('click', () => {
      (filter as HTMLElement & { value: string | null }).value = 'All';
      showWork('All');
    });
    grid.replaceChildren(
      el('kt-empty-state', { heading: 'Nothing tagged that yet', icon: 'search' }, [reset]),
    );
    return;
  }
  grid.replaceChildren(
    ...projects.map((project) => {
      const card = el('kt-card', { class: 'work-card', clickable: true }, [
        el('h3', {}, [project.name]),
        el('p', {}, [project.tagline]),
        tags(project.tags),
        el('span', { slot: 'footer' }, ['Read the case study']),
      ]);
      card.addEventListener('kt-card-click', () => openProject(project.slug));
      return card;
    }),
  );
}

filter.addEventListener('kt-change', (event) => {
  showWork((event as CustomEvent<{ value: string | null }>).detail.value ?? 'All');
});
showWork('All');

const work = el('section', { id: 'work' }, [
  el('div', { class: 'section-head' }, [el('h2', {}, ['Selected work']), filter]),
  grid,
]);

// === Career and writing ===

const career = el('section', { id: 'career' }, [
  el('div', { class: 'section-head' }, [el('h2', {}, ['Where I have been'])]),
  timeline(CAREER),
]);

const posts = el('kt-post-grid', {
  layout: 'list',
  align: 'start',
  'heading-level': '2',
}) as KtPostGrid;
posts.posts = POSTS;
const writing = el('section', { id: 'writing' }, [
  el('div', { class: 'section-head' }, [el('h2', {}, ['Writing'])]),
  posts,
]);

// === Contact ===

const nameField = el('kt-input', { name: 'name', autocomplete: 'name' }) as KtInput;
const emailField = el('kt-input', {
  name: 'email',
  type: 'email',
  autocomplete: 'email',
}) as KtInput;
const messageField = el('kt-textarea', { name: 'message', rows: '4' }) as KtTextarea;
const send = el('kt-button', { type: 'submit', icon: 'send', 'icon-position': 'right' }, [
  'Send',
]) as KtButton;

const form = el('form', { class: 'contact', novalidate: true }, [
  el('kt-label-input', { label: 'Your name' }, [nameField]),
  el('kt-label-input', { label: 'Email' }, [emailField]),
  el('kt-label-input', { label: 'What are you building?' }, [messageField]),
  el('div', {}, [send]),
]);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = { name: nameField.value, email: emailField.value, message: messageField.value };
  const errors = validateMessage(values);
  nameField.error = errors.name ?? '';
  emailField.error = errors.email ?? '';
  messageField.error = errors.message ?? '';
  if (Object.keys(errors).length > 0) return;
  void send
    .run(() => sendMessage(values))
    .then(() => {
      form.replaceWith(
        el('kt-alert', { class: 'contact-sent', variant: 'success', description: CONTACT.sent }),
      );
    });
});

const contact = el('section', { id: 'contact', class: 'contact' }, [
  el('h2', {}, [CONTACT.heading]),
  el('p', {}, [CONTACT.lead]),
  form,
]);

// === The page ===

const footer = el('kt-footer', { variant: 'simple' }, [
  el('a', { slot: 'brand', class: 'brand', href: '#top' }, [PERSON.name]),
  FOOTER.tagline,
  el('span', { slot: 'legal' }, [FOOTER.legal]),
]);

document
  .querySelector('#app')!
  .replaceChildren(
    header,
    el('main', { class: 'page', id: 'top' }, [intro, numbers, work, career, writing, contact]),
    panel,
    footer,
  );
