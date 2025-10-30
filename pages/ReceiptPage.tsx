import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Booking, BedType, RoomType } from '../types';
import { SunriverLogo, PhoneIcon, LocationIcon } from '../components/Icons';
import { calculateNights, getTodayDateString, toInputDate, fromInputDate } from '../utils/helpers';

const ReceiptComponent: React.FC<{ 
    bookings: Booking[],
    paymentInfo: {
        remarks: string;
        cashAmount: string;
        cashDate: string;
        transferAmount: string;
        transferDate: string;
    },
    customLogo: string | null;
}> = ({ bookings, paymentInfo, customLogo }) => {
    const context = useContext(AppContext);
    if (!context || bookings.length === 0) return null;
    const { t, rooms } = context;

    const customer = bookings[0];

    const getRoomTypeName = (type: RoomType, bed: BedType): string => {
        if (type === 'River view') return t('river_sunrise_room');
        if (type === 'Standard view' && bed === 'Twin bed') return t('standard_twin_room');
        if (type === 'Standard view' && bed === 'Double bed') return t('standard_double_room');
        if (type === 'Cottage') return t('cottage_room');
        return `${type} ${bed}`;
    };

    const lineItems = useMemo(() => {
        const groupedItems: { [key: string]: { 
            description: string; 
            roomCount: number; 
            nights: number; 
            unitPrice: number; 
            total: number;
            checkIn: string;
            checkOut: string;
        } } = {};

        bookings.forEach(booking => {
            const nights = calculateNights(booking.checkIn, booking.checkOut);
            booking.roomIds.forEach(roomId => {
                const room = rooms.find(r => r.id === roomId);
                if (!room) return;

                const roomTypeName = getRoomTypeName(room.type, room.bed);
                const key = `${roomTypeName}-${booking.checkIn}-${booking.checkOut}-${booking.pricePerNight}`;

                if (groupedItems[key]) {
                    groupedItems[key].roomCount += 1;
                    groupedItems[key].total += nights * booking.pricePerNight;
                } else {
                    groupedItems[key] = {
                        description: roomTypeName,
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        roomCount: 1,
                        nights: nights,
                        unitPrice: booking.pricePerNight,
                        total: nights * booking.pricePerNight,
                    };
                }
            });
        });

        return Object.values(groupedItems);
    }, [bookings, t, rooms]);

    const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="bg-gray-100 py-8 print:bg-white" id="receipt-to-print">
            {/* A4 container */}
            <div className="w-[210mm] h-[297mm] mx-auto px-20 pb-8 pt-28 bg-white shadow-lg print:shadow-none text-black relative overflow-hidden font-sans">
                <style>
                    {`@media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } body * { visibility: hidden; } #receipt-to-print, #receipt-to-print * { visibility: visible; } #receipt-to-print { position: absolute; left: 0; top: 0; width: 100%; } }`}
                </style>
                {/* Decorative Header */}
                <div className="absolute top-0 left-0 w-full h-40 bg-[#f3e6c0] transform -skew-y-3 -translate-y-10 print:bg-[#f3e6c0] z-0"></div>
                <div className="absolute top-0 left-0 w-3/4 h-48 bg-[#e6c872] opacity-80 transform -skew-y-6 -translate-y-16 print:bg-[#e6c872] z-0"></div>

                <div className="relative z-10">
                    <header className="flex justify-between items-start pb-4 border-b border-[#e6c872]">
                        <div>
                            <h1 className="text-2xl font-bold">โรงแรมซันริเวอร์</h1>
                            <h2 className="text-xl font-semibold">Sunriver Hotel</h2>
                            <p className="text-sm text-gray-600 mt-2">หจก. ซันริเวอร์โฮเทล</p>
                            <p className="text-sm text-gray-600">215 หมู่ที่ 1 ถ.อภิบาลบัญชา ต.ท่าอุเทน อ.ท่าอุเทน จ.นครพนม 48120</p>
                            <p className="text-sm text-gray-600">โทรศัพท์: +66 93-152-9564</p>
                            <p className="text-sm text-gray-600">เลขที่ผู้เสียภาษี: 0 4835 68000 05 5</p>
                        </div>
                        <div className="text-right">
                            <SunriverLogo src={customLogo} className="w-20 h-20 text-gray-700 mx-auto object-contain" />
                            <h3 className="text-2xl font-bold mt-2">ใบเสร็จรับเงิน</h3>
                            <p className="font-semibold">RECEIPT</p>
                        </div>
                    </header>
                    
                    <section className="grid grid-cols-2 gap-4 my-4 text-sm">
                        <div className="space-y-1">
                            <p><span className="font-bold">{t('customer_name')}:</span> {customer.customerName}</p>
                            <p><span className="font-bold">{t('address_optional')}:</span> {customer.address || '-'}</p>
                            <p><span className="font-bold">{t('phone')}:</span> {customer.phone}</p>
                            <p><span className="font-bold">{t('tax_id_optional')}:</span> {customer.taxId || '-'}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p><span className="font-bold">{t('receipt_no')}:</span> {bookings.map(b => b.id).join(', ')}</p>
                            <p><span className="font-bold">{t('date')}:</span> {getTodayDateString()}</p>
                        </div>
                    </section>
                    
                    <section>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-y-2 border-black">
                                    <th className="p-2 font-bold w-1/2">{t('description')}</th>
                                    <th className="p-2 font-bold text-center">{t('no_of_rooms')}</th>
                                    <th className="p-2 font-bold text-center">{t('no_of_nights')}</th>
                                    <th className="p-2 font-bold text-right">{t('unit_price')}</th>
                                    <th className="p-2 font-bold text-right">{t('total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item, index) => (
                                    <tr key={index} className="border-b border-dotted border-gray-400 align-top">
                                        <td className="p-2">
                                            {item.description}
                                            <div className="text-gray-500">({t('check_in_date')}: {item.checkIn} - {t('check_out_date')}: {item.checkOut})</div>
                                        </td>
                                        <td className="p-2 text-center">{item.roomCount}</td>
                                        <td className="p-2 text-center">{item.nights}</td>
                                        <td className="p-2 text-right">{item.unitPrice.toFixed(2)}</td>
                                        <td className="p-2 text-right">{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {/* Add empty rows to fill space */}
                                {Array.from({ length: Math.max(0, 8 - lineItems.length) }).map((_, i) => (
                                    <tr key={`empty-${i}`} className="border-b border-dotted border-gray-400"><td className="p-4" colSpan={5}></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="flex justify-between items-start mt-2">
                         <div className="w-1/2 text-sm pt-2">
                            <p><span className="font-bold">{t('remarks')}:</span> {paymentInfo.remarks || '-'}</p>
                         </div>
                         <div className="w-1/2">
                            <div className="flex justify-between items-center p-2 border-y-2 border-black">
                                <span className="font-bold">{t('total_amount')}</span>
                                <span className="font-bold">THB {totalAmount.toFixed(2)}</span>
                            </div>
                         </div>
                    </section>

                    <section className="mt-4 p-2 text-sm border-t border-dotted border-gray-400">
                        <h4 className="font-bold mb-2">{t('payment_information')}</h4>
                        <div className="flex">
                            <p className="w-1/2"><span className="font-bold">{t('cash')}:</span> {paymentInfo.cashAmount ? `${paymentInfo.cashAmount} ${t('thb')}, ${t('date')} ${paymentInfo.cashDate}` : '-'}</p>
                            <p className="w-1/2"><span className="font-bold">{t('transfer')}:</span> {paymentInfo.transferAmount ? `${paymentInfo.transferAmount} ${t('thb')}, ${t('date')} ${paymentInfo.transferDate}` : '-'}</p>
                        </div>
                    </section>
                </div>
                
                <div className="absolute bottom-20 left-0 w-full z-10 px-20 py-8">
                     <footer className="flex justify-end items-end h-20">
                         <div className="text-center">
                            <div className="border-b border-dotted border-black w-48 mb-1"></div>
                            <p className="text-sm font-semibold">{t('authorized_signature')}</p>
                        </div>
                    </footer>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-20 bg-[#f3e6c0] flex items-center justify-between px-10 print:bg-[#f3e6c0] z-0">
                   <div className="flex items-center text-sm text-black">
                        <span className="flex items-center mr-4">
                            <PhoneIcon className="w-3 h-3 mr-2"/>
                            093-152-9564
                        </span>
                        <span className="flex items-center">
                            <LocationIcon className="w-3 h-3 mr-2"/>
                            272 หมู่ที่ 3 ต.ท่าอุเทน อ.ท่าอุเทน จ.นครพนม 48120
                        </span>
                   </div>
                </div>
                <div className="absolute bottom-0 right-0 w-1/4 h-24 bg-[#faf3dd] transform skew-x-12 translate-x-10 print:bg-[#faf3dd] z-0"></div>
            </div>
        </div>
    );
};

const ReceiptPage: React.FC = () => {
    const context = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
    const [paymentInfo, setPaymentInfo] = useState({
        remarks: '',
        cashAmount: '',
        cashDate: getTodayDateString(),
        transferAmount: '',
        transferDate: getTodayDateString(),
    });
    
    if (!context) return null;
    const { t, bookings, customLogo } = context;

    const filteredBookings = useMemo(() => {
        const sorted = [...bookings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (!searchTerm) {
            return sorted.slice(0, 10);
        }
        return sorted.filter(b =>
            b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.phone.includes(searchTerm) ||
            b.checkIn.includes(searchTerm) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bookings, searchTerm]);

    const handleSelectBooking = (id: string) => {
        setSelectedBookingIds(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        );
    };

    const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'date') {
            setPaymentInfo(prev => ({ ...prev, [name]: fromInputDate(value) }));
        } else {
            setPaymentInfo(prev => ({ ...prev, [name]: value }));
        }
    };

    const selectedBookings = useMemo(() => {
        if (selectedBookingIds.length === 0) return [];
        
        const firstSelectedId = selectedBookingIds[0];
        const otherSelectedIds = selectedBookingIds.slice(1);
        
        const sortedIds = [firstSelectedId, ...otherSelectedIds];

        return sortedIds
            .map(id => bookings.find(b => b.id === id))
            .filter((b): b is Booking => b !== undefined);
    }, [bookings, selectedBookingIds]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('receipt')}</h1>

            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <input
                    type="text"
                    placeholder={t('search_bookings')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
                <h3 className="font-semibold">{searchTerm ? 'Search Results' : t('recent_bookings')}</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => (
                        <div key={b.id} className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50" onClick={() => handleSelectBooking(b.id)}>
                            <input
                                type="checkbox"
                                readOnly
                                checked={selectedBookingIds.includes(b.id)}
                                className="mr-4 h-5 w-5 rounded text-sunriver-yellow focus:ring-sunriver-yellow"
                            />
                            <div>
                                <p className="font-bold">{b.customerName} - Rooms {b.roomIds.join(', ')}</p>
                                <p className="text-sm text-gray-600">{b.id} | {b.phone} | Check-in: {b.checkIn}</p>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">{t('no_bookings_found')}</p>}
                </div>

                {selectedBookingIds.length > 0 && (
                    <div className="border-t pt-4 mt-4 space-y-4">
                        <h3 className="font-bold">{t('payment_information')}</h3>
                        <textarea name="remarks" placeholder={t('remarks')} value={paymentInfo.remarks} onChange={handlePaymentInfoChange} className="w-full p-2 border rounded-md" rows={2}></textarea>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <fieldset className="border p-2 rounded-md">
                                <legend className="px-1 font-semibold">{t('cash')}</legend>
                                <div className="flex gap-2">
                                    <input type="number" name="cashAmount" placeholder={t('amount')} value={paymentInfo.cashAmount} onChange={handlePaymentInfoChange} className="w-1/2 p-2 border rounded-md" />
                                    <input type="date" name="cashDate" value={toInputDate(paymentInfo.cashDate)} onChange={handlePaymentInfoChange} className="w-1/2 p-2 border rounded-md" />
                                </div>
                            </fieldset>
                             <fieldset className="border p-2 rounded-md">
                                <legend className="px-1 font-semibold">{t('transfer')}</legend>
                                <div className="flex gap-2">
                                    <input type="number" name="transferAmount" placeholder={t('amount')} value={paymentInfo.transferAmount} onChange={handlePaymentInfoChange} className="w-1/2 p-2 border rounded-md" />
                                    <input type="date" name="transferDate" value={toInputDate(paymentInfo.transferDate)} onChange={handlePaymentInfoChange} className="w-1/2 p-2 border rounded-md" />
                                </div>
                            </fieldset>
                        </div>

                        <button 
                            onClick={() => window.print()}
                            className="w-full px-4 py-2 bg-sunriver-yellow text-white rounded-lg shadow hover:bg-opacity-90"
                        >
                            {t('print_receipt')}
                        </button>
                    </div>
                )}
            </div>
            
            {selectedBookings.length > 0 && (
                 <div className="w-full flex justify-center overflow-x-auto py-4">
                    <div className="transform origin-top scale-[0.4] sm:scale-75 md:scale-90 lg:scale-100 print:transform-none print:scale-100">
                        <ReceiptComponent bookings={selectedBookings} paymentInfo={paymentInfo} customLogo={customLogo} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiptPage;