/**
 * The icons the design system uses in its own elements, and the few a first
 * screen reaches for — plus, pencil, settings, download, upload, an external
 * link, a filter, an ellipsis, a refresh — so a button copied from the docs
 * draws its icon without a registration step.
 *
 * Importing any Kanto element pulls this set in — roughly 3 kB of path data,
 * the price of `<kt-select>` drawing its own chevron and a first `icon="plus"`
 * working. Other application icons are registered through `registerIcons`.
 */
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileUp,
  Filter,
  Info,
  LoaderCircle,
  Menu,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
} from 'lucide';
// The sibling registry, not the `kanto-ds` barrel: the barrel pulls in every
// element, and one of them pulls in this file — a cycle that leaves
// `registerIcons` undefined by the time the call below runs.
import { registerIcons } from './registry.js';

/** Icons referenced by Kanto elements, keyed by their Lucide name. */
export const defaultIcons = {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileUp,
  Filter,
  Info,
  LoaderCircle,
  Menu,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
};

registerIcons(defaultIcons);
