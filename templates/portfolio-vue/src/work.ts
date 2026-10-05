/** What the page works out: the work under a tag, a project by its slug, a message's mistakes. */
import { PROJECTS, type Project } from './content';

export interface Message {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export type MessageErrors = Partial<Record<keyof Message, string>>;

export function projectsTagged(tag: string): Project[] {
  return tag === 'All' ? [...PROJECTS] : PROJECTS.filter((project) => project.tags.includes(tag));
}

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Each field's mistake, said as what to do; an empty object when it can be sent. */
export function validateMessage(values: Message): MessageErrors {
  const errors: MessageErrors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!EMAIL.test(values.email.trim()))
    errors.email = 'Enter an email address, like name@example.com.';
  if (!values.message.trim()) errors.message = 'Say a word about what you are building.';
  return errors;
}
