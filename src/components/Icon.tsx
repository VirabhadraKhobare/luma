import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Clock3,
  Code2,
  Copy,
  Edit3,
  FileText,
  FolderOpen,
  Globe2,
  Headphones,
  Image,
  LayoutGrid,
  Lightbulb,
  Link2,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  User,
  X,
  Zap,
} from 'lucide-react'

export type IconName =
  | 'archive' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'arrow-up'
  | 'bar-chart' | 'bell' | 'book' | 'bot' | 'check' | 'check-circle'
  | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'help' | 'clipboard'
  | 'clock' | 'code' | 'copy' | 'edit' | 'file' | 'folder' | 'globe'
  | 'headphones' | 'image' | 'grid' | 'lightbulb' | 'link' | 'loader'
  | 'logout' | 'menu' | 'message' | 'mic' | 'more' | 'panel-close'
  | 'panel-open' | 'paperclip' | 'pen' | 'plus' | 'search' | 'send'
  | 'settings' | 'sparkles' | 'sliders' | 'trash' | 'upload' | 'user'
  | 'x' | 'zap'

const icons: Record<IconName, LucideIcon> = {
  archive: Archive, 'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
  'arrow-up': ArrowUp, 'bar-chart': BarChart3, bell: Bell, book: BookOpen, bot: Bot, check: Check,
  'check-circle': CheckCircle2, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, help: CircleHelp, clipboard: Clipboard, clock: Clock3, code: Code2,
  copy: Copy, edit: Edit3, file: FileText, folder: FolderOpen, globe: Globe2, headphones: Headphones,
  image: Image, grid: LayoutGrid, lightbulb: Lightbulb, link: Link2, loader: LoaderCircle,
  logout: LogOut, menu: Menu, message: MessageSquare, mic: Mic, more: MoreHorizontal,
  'panel-close': PanelLeftClose, 'panel-open': PanelLeftOpen, paperclip: Paperclip, pen: PenLine,
  plus: Plus, search: Search, send: Send, settings: Settings2, sparkles: Sparkles,
  sliders: SlidersHorizontal, trash: Trash2, upload: UploadCloud, user: User, x: X, zap: Zap,
}

export function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const Component = icons[name]
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
