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
  Copy,
  Eye,
  EyeOff,
  File,
  FileUp,
  Info,
  LoaderCircle,
  Menu,
  Search,
  Trash2,
  TriangleAlert,
  User,
  X,
} from 'lucide';
import { registerIcons } from 'kanto';

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
  Copy,
  Eye,
  EyeOff,
  File,
  FileUp,
  Info,
  LoaderCircle,
  Menu,
  Search,
  Trash2,
  TriangleAlert,
  User,
  X,
};

registerIcons(defaultIcons);
