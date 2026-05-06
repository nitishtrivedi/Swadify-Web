import { UserRole } from '../services/api-service';

// ── Auth ──────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}
export interface RegisterRequest {
  firstName: string;
  lastName: string; // ✅ required
  username: string;
  email: string;
  password: string;
  phoneNumber: string; // ✅ correct name
  role?: number; // optional (backend defaults anyway)
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// ── User ──────────────────────────────────────────────────
//export type UserRole = 'Customer' | 'Admin' | 'SuperAdmin' | 'DeliveryPartner';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole | keyof typeof UserRole; // 🔥 can be number or string
  isEmailVerified: boolean;
  profilePicUrl?: string;
  createdAt: string;
  isActive: boolean;
  ownedRestaurants?: any[];
}

// ── Restaurant ────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  categoryId: number;
  phoneNumber: string;
  email: string;
  logoUrl?: string;
  coverImageUrl?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedDeliveryTimeMinutes: number;
  deliveryRadiusKm: number;
  isFeatured: boolean;
  status: number;
  isActive: boolean;
  isVerified: boolean;
  averageRating: number;
  totalRatings: number;
  cuisineType: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

// ── Menu ──────────────────────────────────────────────────
export interface MenuCategory {
  id: string;
  name: string;
  restaurantId: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMin: number;
  tags?: string[];
}

// ── Cart ──────────────────────────────────────────────────
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
}

// ── Order ─────────────────────────────────────────────────
export type OrderStatus =
  | 'Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'PartnerAssigned'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'Online';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed';

export interface Order {
  id: string;
  customerId: string;
  restaurant: Pick<Restaurant, 'id' | 'name' | 'logoUrl'>;
  items: CartItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryAddress: Address;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  otp?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Reviews ───────────────────────────────────────────────
export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment?: string;
  adminReply?: string;
  createdAt: string;
}

// ── Delivery Partner ──────────────────────────────────────
export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  vehicleType: string;
  currentLocation?: { lat: number; lng: number };
}

// ── API Wrappers ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface PagedResponse<T> extends ApiResponse<T[]> {
  totalCount: number;
  page: number;
  pageSize: number;
}
