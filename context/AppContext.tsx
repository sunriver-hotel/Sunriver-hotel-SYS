import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, Translations, Booking, RoomCleaningStatus, CleaningStatusValue, Room } from '../types';
import { translations } from '../constants';
import { generateBookingId } from '../utils/helpers';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  rooms: Room[];
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'timestamp'>) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  cleaningStatus: RoomCleaningStatus;
  updateCleaningStatus: (roomId: string, status: CleaningStatusValue) => Promise<void>;
  customLogo: string | null;
  setCustomLogo: (logo: string | null) => void;
  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cleaningStatus, setCleaningStatus] = useState<RoomCleaningStatus>({});
  const [customLogo, setCustomLogoState] = useState<string | null>(() => localStorage.getItem('customLogo'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsRes, bookingsRes, cleaningStatusRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
        fetch('/api/cleaning_status')
      ]);
      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();
      const cleaningStatusData = await cleaningStatusRes.json();

      setRooms(roomsData);
      setBookings(bookingsData);
      setCleaningStatus(cleaningStatusData);

    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const login = async (user: string, pass: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActivePage('home');
  };
  
  const addBooking = async (bookingData: Omit<Booking, 'id' | 'timestamp'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: generateBookingId(),
      timestamp: new Date().toISOString(),
    };
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (!response.ok) throw new Error('Failed to add booking');
      await fetchData(); // Refetch all data to stay in sync
    } catch (error) {
      console.error("Failed to add booking:", error);
    }
  };

  const updateBooking = async (updatedBooking: Booking) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking)
      });
      if (!response.ok) throw new Error('Failed to update booking');
      await fetchData(); // Refetch all data to stay in sync
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  };
  
  const updateCleaningStatus = async (roomId: string, status: CleaningStatusValue) => {
    setCleaningStatus(prev => ({ ...prev, [roomId]: status })); // Optimistic update
    try {
      const response = await fetch('/api/cleaning_status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, status })
      });
       if (!response.ok) {
        throw new Error('Failed to update cleaning status');
       }
    } catch (error) {
      console.error("Failed to update cleaning status:", error);
      await fetchData(); // Revert on failure
    }
  };
  
  const setCustomLogo = (logo: string | null) => {
    if (logo) {
      localStorage.setItem('customLogo', logo);
    } else {
      localStorage.removeItem('customLogo');
    }
    setCustomLogoState(logo);
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      t,
      isAuthenticated,
      login,
      logout,
      activePage,
      setActivePage,
      rooms,
      bookings,
      addBooking,
      updateBooking,
      cleaningStatus,
      updateCleaningStatus,
      customLogo,
      setCustomLogo,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};