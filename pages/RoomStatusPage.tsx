import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Room, Booking } from '../types';
import { getTodayDateString, parseDate, toInputDate, fromInputDate } from '../utils/helpers';
import BookingModal from '../components/BookingModal';

const BookingDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    bookings: Booking[];
    room: Room;
    viewDate: string;
}> = ({ isOpen, onClose, bookings, room, viewDate }) => {
    const context = useContext(AppContext);
    if (!isOpen || !context) return null;
    const { t } = context;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-1">{`Room ${room.id} Details`}</h2>
                <p className="text-sm text-gray-500 mb-4">{`${t('date')}: ${viewDate}`}</p>
                <div className="space-y-4">
                    {bookings.map(booking => {
                        const viewDateObj = parseDate(viewDate);
                        viewDateObj.setHours(0,0,0,0);
                        const checkIn = parseDate(booking.checkIn);
                        const checkOut = parseDate(booking.checkOut);

                        let statusText = '';
                        const statusColor = 'bg-gray-200 text-gray-800';

                        if (booking.checkIn === viewDate) {
                            statusText = t('status_check_in');
                        } else if (booking.checkOut === viewDate) {
                            statusText = t('status_check_out');
                        } else if (checkIn < viewDateObj && viewDateObj < checkOut) {
                            statusText = t('occupied');
                        }

                        return (
                            <div key={booking.id} className="p-3 border rounded-md bg-gray-50">
                                {statusText && <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{statusText}</span>}
                                <h3 className="font-bold text-lg mt-2">{booking.customerName}</h3>
                                <p className="text-gray-600">{booking.phone}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {t('booking_period')}: {booking.checkIn} - {booking.checkOut}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {t('room')}(s): {booking.roomIds.join(', ')}
                                </p>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('close')}</button>
                </div>
            </div>
        </div>
    );
}

const RoomStatusPage: React.FC = () => {
  const context = useContext(AppContext);
  const [viewDate, setViewDate] = useState(getTodayDateString());
  const [sortKey, setSortKey] = useState<'id' | 'type' | 'bed'>('id');

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);

  if (!context) return null;
  const { t, bookings, rooms } = context;

  const roomDetails = useMemo(() => {
    const viewDateObj = parseDate(viewDate);
    viewDateObj.setHours(0, 0, 0, 0);

    return rooms.map(room => {
        const relevantBookings = bookings.filter(b => {
            if (!b.roomIds.includes(room.id)) return false;
            const checkIn = parseDate(b.checkIn);
            const checkOut = parseDate(b.checkOut);
            const isStaying = checkIn <= viewDateObj && viewDateObj < checkOut;
            const isCheckingOut = b.checkOut === viewDate;
            return isStaying || isCheckingOut;
        });

        const uniqueBookings = Array.from(new Set(relevantBookings.map(b => b.id))).map(id => relevantBookings.find(b => b.id === id)!);
        
        const statuses: { text: string; color: string }[] = [];
        const plainColor = 'bg-gray-200 text-gray-800';

        if (uniqueBookings.length === 0) {
            statuses.push({ text: t('vacant'), color: plainColor });
        } else {
            const hasCheckIn = uniqueBookings.some(b => b.checkIn === viewDate);
            const hasCheckOut = uniqueBookings.some(b => b.checkOut === viewDate);
            const hasOccupied = uniqueBookings.some(b => parseDate(b.checkIn) < viewDateObj && viewDateObj < parseDate(b.checkOut));

            if(hasCheckIn) statuses.push({ text: t('status_check_in'), color: plainColor });
            if(hasCheckOut) statuses.push({ text: t('status_check_out'), color: plainColor });
            if(hasOccupied) statuses.push({ text: t('occupied'), color: plainColor });
        }

        return { room, bookings: uniqueBookings, statuses };
    });
  }, [bookings, viewDate, t, rooms]);

  const sortedRooms = useMemo(() => {
    return [...roomDetails].sort((a, b) => {
        if (sortKey === 'id') return a.room.id.localeCompare(b.room.id, undefined, { numeric: true });
        if (sortKey === 'type') return a.room.type.localeCompare(b.room.type) || a.room.id.localeCompare(b.room.id, undefined, { numeric: true });
        if (sortKey === 'bed') return a.room.bed.localeCompare(b.room.bed) || a.room.id.localeCompare(b.room.id, undefined, { numeric: true });
        return 0;
    });
  }, [roomDetails, sortKey]);

  const handleRoomClick = (room: Room, bookings: Booking[]) => {
    const isVacant = bookings.length === 0;
    setSelectedRoom(room);
    if (isVacant) {
        setIsBookingModalOpen(true);
    } else {
        setSelectedBookings(bookings);
        setIsDetailsModalOpen(true);
    }
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRoom(null);
    setSelectedBookings([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('room_status')}</h1>
      
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <label htmlFor="view-date" className="font-semibold">{t('view_date')}:</label>
          <input 
            type="date" 
            id="view-date"
            value={toInputDate(viewDate)} 
            onChange={e => setViewDate(fromInputDate(e.target.value))} 
            className="p-2 border rounded-md"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="font-semibold">{t('sort_by')}:</label>
          <select 
            id="sort-by"
            value={sortKey} 
            onChange={e => setSortKey(e.target.value as 'id' | 'type' | 'bed')} 
            className="p-2 border rounded-md"
          >
            <option value="id">{t('room_number')}</option>
            <option value="type">{t('room_type')}</option>
            <option value="bed">{t('bed_type')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sortedRooms.map(({ room, bookings, statuses }) => {
          const isVacant = bookings.length === 0;
          return (
            <div 
              key={room.id}
              className={`p-4 border rounded-lg shadow-sm flex flex-col cursor-pointer transition-all duration-200 ${isVacant ? 'bg-white hover:shadow-lg hover:border-sunriver-yellow' : 'bg-gray-50 hover:shadow-lg hover:bg-gray-100'}`}
              onClick={() => handleRoomClick(room, bookings)}
            >
              <div className="flex-grow">
                <h3 className="text-xl font-bold">Room {room.id}</h3>
                <p className="text-sm text-gray-600">{room.type}</p>
                <p className="text-xs text-gray-500 mb-2">{room.bed}</p>
                <div className="space-y-1">
                    {statuses.map((status, index) => (
                        <div key={index} className={`px-2 py-1 text-xs font-medium rounded-full text-center ${status.color}`}>
                            {status.text}
                        </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isBookingModalOpen && selectedRoom && (
        <BookingModal
          isOpen={true}
          onClose={closeBookingModal}
          selectedDate={viewDate}
          initialRoomIds={[selectedRoom.id]}
        />
      )}
      {isDetailsModalOpen && selectedRoom && (
        <BookingDetailsModal
          isOpen={true}
          onClose={closeDetailsModal}
          bookings={selectedBookings}
          room={selectedRoom}
          viewDate={viewDate}
        />
      )}
    </div>
  );
};

export default RoomStatusPage;