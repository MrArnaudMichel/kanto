import {
  KtToastContainer,
  type KtToastOptions,
  type KtToastPosition,
} from './kt-toast-container.js';
import type { KtToast } from './kt-toast.js';
import './kt-toast-container.js';

/**
 * The imperative way to raise a toast, for the many places where reaching a
 * container element is inconvenient — an interceptor, a store, a catch block.
 *
 * It lazily creates one `<kt-toast-container>` on `<body>` and reuses it.
 *
 * ```js
 * import { toaster } from 'kanto-ds';
 *
 * toaster.success('Entité créée');
 * toaster.error('Échec de la sauvegarde', { description: 'Réessayez dans un instant.' });
 * ```
 *
 * Prefer placing a `<kt-toast-container>` in your own markup when you care
 * where in the DOM it lives — inside a dialog, or scoped to one region.
 */
class Toaster {
  private container: KtToastContainer | undefined;

  /** Where the auto-created container sits. Changing it moves the stack. */
  position: KtToastPosition = 'bottom-right';

  /** The container in use, created on first call. */
  getContainer(): KtToastContainer {
    if (this.container?.isConnected) return this.container;

    const existing = document.querySelector('kt-toast-container');
    if (existing) {
      this.container = existing;
      return existing;
    }

    const created = new KtToastContainer();
    created.position = this.position;
    document.body.append(created);
    this.container = created;
    return created;
  }

  show(options: KtToastOptions): KtToast {
    return this.getContainer().show(options);
  }

  success(heading: string, options: Omit<KtToastOptions, 'variant' | 'heading'> = {}): KtToast {
    return this.show({ duration: 4000, ...options, variant: 'success', heading });
  }

  info(heading: string, options: Omit<KtToastOptions, 'variant' | 'heading'> = {}): KtToast {
    return this.show({ duration: 4000, ...options, variant: 'information', heading });
  }

  warning(heading: string, options: Omit<KtToastOptions, 'variant' | 'heading'> = {}): KtToast {
    return this.show({ duration: 6000, ...options, variant: 'warning', heading });
  }

  /** Errors do not dismiss themselves: the user has to see this one. */
  error(heading: string, options: Omit<KtToastOptions, 'variant' | 'heading'> = {}): KtToast {
    return this.show({ duration: 0, ...options, variant: 'error', heading });
  }

  /** Clears the stack. */
  clear(): void {
    this.container?.clear();
  }
}

/** The shared toaster. */
export const toaster = new Toaster();
