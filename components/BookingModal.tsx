import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ROOMS } from '../constants';
import { Booking } from '../types';
import { addDays, getTodayDateString, parseDate, toInputDate, fromInputDate } from '../utils/helpers';

const BookingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking | null;
  selectedDate?: string;
  initialRoomIds?: string[];
}> = ({ isOpen, onClose, booking, selectedDate, initialRoomIds }) => {
  const context = useContext(AppContext);
  
  const getInitialFormData = () => {
    if (booking) {
      const { id, timestamp, ...data } = booking;
      return data;
    }
    const checkInDate = selectedDate || getTodayDateString();
    return {
      customerName: '', 
      phone: '', 
      checkIn: checkInDate, 
      checkOut: addDays(checkInDate, 1), 
      roomIds: initialRoomIds || [], 
      paymentStatus: 'UNPAID' as const, 
      pricePerNight: 800,
      email: '', 
      address: '', 
      taxId: '', 
      depositAmount: 0
    };
  };

  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'timestamp'>>(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
        setFormData(getInitialFormData());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking, selectedDate, initialRoomIds]);
  
  const bookings = context?.bookings ?? [];

  const availableRooms = useMemo(() => {
    const checkInDate = parseDate(formData.checkIn);
    const checkOutDate = parseDate(formData.checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
        return [];
    }

    const bookedRoomIds = bookings
      .filter(b => {
        if(booking && b.id === booking.id) return false;
        const bCheckIn = parseDate(b.checkIn);
        const bCheckOut = parseDate(b.checkOut);
        return bCheckIn < checkOutDate && bCheckOut > checkInDate;
      })
      .flatMap(b => b.roomIds);
    
    return ROOMS.filter(r => !bookedRoomIds.includes(r.id));
  }, [bookings, formData.checkIn, formData.checkOut, booking]);


  if (!context || !isOpen) return null;
  const { t, addBooking, updateBooking } = context;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (e.target.type === 'date') {
        value = fromInputDate(value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomChange = (roomId: string) => {
    setFormData(prev => {
        const newRoomIds = prev.roomIds.includes(roomId)
            ? prev.roomIds.filter(id => id !== roomId)
            : [...prev.roomIds, roomId];
        return { ...prev, roomIds: newRoomIds.sort((a,b) => a.localeCompare(b, undefined, { numeric: true })) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roomIds.length === 0) {
        alert('Please select at least one room.');
        return;
    }
    const checkIn = parseDate(formData.checkIn);
    const checkOut = parseDate(formData.checkOut);
    if(checkOut <= checkIn) {
        alert('Check-out date must be after check-in date.');
        return;
    }
    if (booking) {
        updateBooking({ ...formData, id: booking.id, timestamp: booking.timestamp });
    } else {
        addBooking(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{booking ? t('edit_booking') : t('new_booking')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="customerName" placeholder={t('customer_name')} value={formData.customerName} onChange={handleChange} required className="p-2 border rounded"/>
            <input type="tel" name="phone" placeholder={t('phone')} value={formData.phone} onChange={handleChange} required className="p-2 border rounded"/>
            <div>
                <label className="text-sm">{t('check_in_date')}</label>
                <input type="date" name="checkIn" value={toInputDate(formData.checkIn)} onChange={handleChange} required className="w-full p-2 border rounded"/>
            </div>
            <div>
                <label className="text-sm">{t('check_out_date')}</label>
                <input type="date" name="checkOut" value={toInputDate(formData.checkOut)} min={toInputDate(addDays(formData.checkIn, 1))} onChange={handleChange} required className="w-full p-2 border rounded"/>
            </div>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="font-semibold mb-2">{t('select_room')} ({formData.roomIds.length} selected)</h4>
             <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-2 text-gray-600">
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-blue-100 mr-1 border"></div>River view</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-green-100 mr-1 border"></div>Standard view</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-purple-100 mr-1 border"></div>Cottage</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-sm border flex items-center justify-center font-bold text-gray-500 mr-1">T</div>Twin Bed</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 h-48 overflow-y-auto p-1">
                {ROOMS.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})).map(r => {
                    const isSelected = formData.roomIds.includes(r.id);
                    const isAvailable = availableRooms.some(ar => ar.id === r.id);
                    
                    const bgColor = r.type === 'River view' ? 'bg-blue-100'
                                  : r.type === 'Standard view' ? 'bg-green-100'
                                  : 'bg-purple-100';

                    if (!isAvailable && !isSelected) {
                        return (
                             <div key={r.id} className={`p-2 rounded border text-center font-semibold text-gray-400 relative bg-gray-200 cursor-not-allowed`}>
                                {r.id}
                            </div>
                        )
                    }

                    return (
                        <div
                            key={r.id}
                            onClick={() => handleRoomChange(r.id)}
                            className={`p-2 rounded border text-center font-semibold text-gray-700 cursor-pointer relative transition-all duration-150 ${bgColor} ${isSelected ? 'ring-2 ring-sunriver-yellow shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                        >
                            {r.id}
                            {r.bed === 'Twin bed' && (
                                <span className="absolute top-0 right-0 text-xs font-bold bg-white bg-opacity-70 rounded-bl-md px-1 py-0.5">T</span>
                            )}
                        </div>
                    )
                })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="UNPAID">{t('unpaid')}</option>
                <option value="DEPOSIT">{t('deposit')}</option>
                <option value="PAID">{t('paid')}</option>
            </select>
            {formData.paymentStatus === 'DEPOSIT' && (
                <input type="number" name="depositAmount" placeholder={t('deposit_amount')} value={formData.depositAmount || ''} onChange={handleChange} className="p-2 border rounded"/>
            )}
          </div>
          <input type="number" name="pricePerNight" placeholder={t('price_per_night')} value={formData.pricePerNight} onChange={handleChange} required className="w-full p-2 border rounded"/>
          <input type="email" name="email" placeholder={t('email_optional')} value={formData.email || ''} onChange={handleChange} className="w-full p-2 border rounded"/>
          <input type="text" name="address" placeholder={t('address_optional')} value={formData.address || ''} onChange={handleChange} className="w-full p-2 border rounded"/>
          <input type="text" name="taxId" placeholder={t('tax_id_optional')} value={formData.taxId || ''} onChange={handleChange} className="w-full p-2 border rounded"/>
          
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-sunriver-yellow text-white rounded hover:bg-opacity-90">{t('save_booking')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;