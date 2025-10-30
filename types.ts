
export type Language = 'en' | 'th';

export interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export type RoomType = 'River view' | 'Standard view' | 'Cottage';
export type BedType = 'Double bed' | 'Twin bed';
export type CleaningStatus = 'CLEAN' | 'DIRTY';

export interface Room {
  id: string;
  type: RoomType;
  bed: BedType;
  floor: number;
}

export type PaymentStatus = 'PAID' | 'DEPOSIT' | 'UNPAID';

export interface Booking {
  id: string; // Auto-generated booking ID
  timestamp: string; // ISO string
  customerName: string;
  phone: string;
  checkIn: string; // date string (dd/mm/yyyy)
  checkOut: string; // date string (dd/mm/yyyy)
  roomIds: string[]; // Changed from roomId: string
  paymentStatus: PaymentStatus;
  depositAmount?: number;
  email?: string;
  address?: string;
  taxId?: string;
  pricePerNight: number;
}

export interface RoomCleaningStatus {
  [roomId: string]: CleaningStatus;
}