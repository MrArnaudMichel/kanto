import { useRef, useState, type FormEvent } from 'react';
import type { KtButton, KtInput, KtTextarea } from 'kanto-ds';
import { sendMessage } from './actions';
import { CONTACT } from './content';
import { validateMessage, type MessageErrors } from './work';

/** The contact form: it says what is missing, then sends. */
export function ContactForm() {
  const [errors, setErrors] = useState<MessageErrors>({});
  const [sent, setSent] = useState(false);
  const name = useRef<KtInput>(null);
  const email = useRef<KtInput>(null);
  const message = useRef<KtTextarea>(null);
  const send = useRef<KtButton>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const values = {
      name: name.current?.value ?? '',
      email: email.current?.value ?? '',
      message: message.current?.value ?? '',
    };
    const found = validateMessage(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void send.current?.run(() => sendMessage(values)).then(() => setSent(true));
  }

  if (sent)
    return <kt-alert className="contact-sent" variant="success" description={CONTACT.sent} />;
  return (
    <form className="contact" noValidate onSubmit={onSubmit}>
      <kt-label-input label="Your name">
        <kt-input ref={name} name="name" autocomplete="name" error={errors.name ?? ''} />
      </kt-label-input>
      <kt-label-input label="Email">
        <kt-input
          ref={email}
          name="email"
          type="email"
          autocomplete="email"
          error={errors.email ?? ''}
        />
      </kt-label-input>
      <kt-label-input label="What are you building?">
        <kt-textarea ref={message} name="message" rows={4} error={errors.message ?? ''} />
      </kt-label-input>
      <div>
        <kt-button ref={send} type="submit" icon="send" iconPosition="right">
          Send
        </kt-button>
      </div>
    </form>
  );
}
