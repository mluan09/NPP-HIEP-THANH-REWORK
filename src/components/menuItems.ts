import {
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  BookOpen,
  MessageCircle,
  Shield,
  ClipboardList,
} from 'lucide-react';
import type { Profile } from '../lib/db';

export interface MenuItem {
  id: string;
  label: string;
  icon: typeof ShoppingCart;
  allowed: Profile['role'][];
}

export const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'sales', label: 'Tạo Đơn Hàng', icon: ShoppingCart, allowed: ['owner', 'manager', 'staff'] },
  { id: 'inventory', label: 'Kho Hàng', icon: Package, allowed: ['owner', 'manager', 'staff'] },
  { id: 'customers', label: 'Khách Hàng', icon: Users, allowed: ['owner', 'manager', 'staff'] },
  { id: 'debts', label: 'Quản Lý Công Nợ', icon: CreditCard, allowed: ['owner', 'manager', 'staff'] },
  { id: 'cashbook', label: 'Nhật Ký Thu Chi', icon: BookOpen, allowed: ['owner', 'manager'] },
  { id: 'accounts', label: 'Quản Lý Tài Khoản', icon: Shield, allowed: ['owner'] },
  { id: 'activity-log', label: 'Nhật Ký Hoạt Động', icon: ClipboardList, allowed: ['owner'] },
  { id: 'feedback', label: 'Góp Ý & Báo Lỗi', icon: MessageCircle, allowed: ['owner', 'manager', 'staff'] },
];
