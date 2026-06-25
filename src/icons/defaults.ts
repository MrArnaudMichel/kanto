/**
 * The icons the design system uses in its own elements.
 *
 * Importing any Kanto element pulls this set in — roughly 2 kB of path data,
 * the price of `<kt-select>` being able to draw its own chevron. Application
 * icons are registered separately through `registerIcons`.
 */
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  File,
  FileUp,
  Info,
  LoaderCircle,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide';
import { registerIcons } from './registry.js';

/** Icons referenced by Kanto elements, keyed by their Lucide name. */
export const defaultIcons = {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  File,
  FileUp,
  Info,
  LoaderCircle,
  Search,
  Trash2,
  TriangleAlert,
  X,
};

registerIcons(defaultIcons);
