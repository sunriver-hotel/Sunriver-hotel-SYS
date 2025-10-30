import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Booking } from '../types';
import { formatDate, getTodayDateString, parseDate, toInputDate, fromInputDate } from '../utils/helpers';
import BookingModal from '../components/BookingModal';

const Calendar: React.FC<{ onDateClick: (date: string) => void }> = ({ onDateClick }) => {
    const context = useContext(AppContext);
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!context) return null;
    const { bookings, t, language, rooms } = context;

    const getBookingsForDate = (date: Date) => {
        date.setHours(0, 0, 0, 0);
        return bookings.reduce((count, b) => {
            const checkIn = parseDate(b.checkIn);
            const checkOut = parseDate(b.checkOut);
            if (checkIn.getTime() <= date.getTime() && date.getTime() < checkOut.getTime()) {
                return count + b.roomIds.length;
            }
            return count;
        }, 0);
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="border p-2 h-20 md:h-32"></div>);
    }
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const bookedCount = getBookingsForDate(dayDate);
        const availableCount = rooms.length - bookedCount;
        const isFull = availableCount <= 0;
        
        days.push(
            <div key={i} className={`border p-2 h-20 md:h-32 flex flex-col cursor-pointer ${isFull ? 'bg-red-50' : 'hover:bg-yellow-50'}`} onClick={() => onDateClick(formatDate(dayDate))}>
                <span className="font-bold self-start">{i}</span>
                 <div className="flex-grow flex md:flex-col justify-center items-center text-sm md:text-base mt-1">
                    <div className="flex items-center text-green-600 mr-2 md:mr-0">
                        <span className="font-semibold">{availableCount}</span>
                        <span className="hidden md:inline ml-1">{t('vacant')}</span>
                    </div>
                    <div className="flex items-center text-red-600">
                        <span className="font-semibold">{bookedCount}</span>
                        <span className="hidden md:inline ml-1">{t('booked')}</span>
                    </div>
                </div>
            </div>
        );
    }

    const weekDays = language === 'th' ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="text-xl font-semibold">{currentDate.toLocaleString(language, { month: '2-digit', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
                {weekDays.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        </div>
    );
}

const HomePage: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
    const [viewDate, setViewDate] = useState(getTodayDateString());

    if (!context) return null;
    const { t, bookings, rooms } = context;

    const handleDateClick = (dateStr: string) => {
        const bookedCount = bookings.reduce((count, b) => {
            const checkIn = parseDate(b.checkIn);
            const checkOut = parseDate(b.checkOut);
            if (checkIn <= parseDate(dateStr) && parseDate(dateStr) < checkOut) {
                return count + b.roomIds.length;
            }
            return count;
        }, 0);

        if (bookedCount >= rooms.length) {
            alert(t('fully_booked'));
            return;
        }
        setSelectedBooking(null);
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const handleEditBooking = (booking: Booking) => {
        setSelectedBooking(booking);
        setSelectedDate(undefined);
        setIsModalOpen(true);
    };
    
    const viewDateObj = parseDate(viewDate);
    viewDateObj.setHours(0, 0, 0, 0);
    const checkIns = bookings.filter(b => b.checkIn === viewDate);
    const checkOuts = bookings.filter(b => b.checkOut === viewDate);
    const inHouse = bookings.filter(b => {
        const checkIn = parseDate(b.checkIn);
        const checkOut = parseDate(b.checkOut);
        return checkIn.getTime() <= viewDateObj.getTime() && viewDateObj.getTime() < checkOut.getTime();
    });


    const BookingCard: React.FC<{booking: Booking}> = ({booking}) => (
        <div className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer" onClick={() => handleEditBooking(booking)}>
            <p className="font-bold">{booking.customerName}</p>
            <p className="text-sm text-gray-600">Rooms: {booking.roomIds.join(', ')} | {booking.phone}</p>
            <p className="text-xs text-gray-500">{t('check_in_date')}: {booking.checkIn} -> {t('check_out_date')}: {booking.checkOut}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('booking_overview')}</h1>
                <button onClick={() => { setSelectedBooking(null); setSelectedDate(getTodayDateString()); setIsModalOpen(true); }} className="px-4 py-2 bg-sunriver-yellow text-white rounded-lg shadow hover:bg-opacity-90">{t('add_booking')}</button>
            </div>
            
            <Calendar onDateClick={handleDateClick} />

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold">{t('todays_overview')}</h2>
                    <input type="date" value={toInputDate(viewDate)} onChange={e => setViewDate(fromInputDate(e.target.value))} className="p-2 border rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-green-700">{t('check_ins')} ({checkIns.length})</h3>
                        {checkIns.length > 0 ? checkIns.map(b => <BookingCard key={b.id} booking={b} />) : <p className="text-gray-500">{t('no_check_ins')}</p>}
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-red-700">{t('check_outs')} ({checkOuts.length})</h3>
                        {checkOuts.length > 0 ? checkOuts.map(b => <BookingCard key={b.id} booking={b} />) : <p className="text-gray-500">{t('no_check_outs')}</p>}
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-blue-700">{t('in_house')} ({inHouse.length})</h3>
                        {inHouse.length > 0 ? inHouse.map(b => <BookingCard key={b.id} booking={b} />) : <p className="text-gray-500">{t('no_in_house')}</p>}
                    </div>
                </div>
            </div>

            <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} booking={selectedBooking} selectedDate={selectedDate}/>
        </div>
    );
};

export default HomePage;