import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { parseDate } from '../utils/helpers';
import { RoomType } from '../types';

type ViewMode = 'daily' | 'monthly' | 'yearly';

const DashboardPage: React.FC = () => {
    const context = useContext(AppContext);
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [popularRoomFilter, setPopularRoomFilter] = useState<'All' | RoomType>('All');

    if (!context) return null;
    const { t, bookings, rooms } = context;

    const occupancyData = useMemo(() => {
        const data: { name: string, occupancy: number }[] = [];
        const today = new Date();
        
        if (viewMode === 'daily') {
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const bookedCount = bookings.reduce((sum, b) => {
                    const checkIn = parseDate(b.checkIn);
                    const checkOut = parseDate(b.checkOut);
                    if(checkIn <= date && date < checkOut) {
                        return sum + b.roomIds.length;
                    }
                    return sum;
                }, 0);
                data.push({
                    name: date.toLocaleDateString(context.language, { month: 'short', day: 'numeric' }),
                    occupancy: bookedCount,
                });
            }
        } else if (viewMode === 'monthly') {
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const month = date.getMonth();
                const year = date.getFullYear();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                let totalOccupiedRoomDays = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    const checkDate = new Date(year, month, day);
                    checkDate.setHours(0, 0, 0, 0);
                    totalOccupiedRoomDays += bookings.reduce((sum, b) => {
                         const checkIn = parseDate(b.checkIn);
                         const checkOut = parseDate(b.checkOut);
                         if (checkIn <= checkDate && checkDate < checkOut) {
                            return sum + b.roomIds.length;
                         }
                         return sum;
                    }, 0);
                }
                data.push({
                    name: date.toLocaleString(context.language, { month: 'short', year: '2-digit' }),
                    occupancy: totalOccupiedRoomDays / daysInMonth
                });
            }
        } else { // yearly
            const currentYear = today.getFullYear();
             for (let i = 4; i >= 0; i--) {
                 const year = currentYear - i;
                 const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
                 let totalOccupiedRoomNights = 0;
                 const yearBookings = bookings.filter(b => parseDate(b.checkIn).getFullYear() <= year && parseDate(b.checkOut).getFullYear() >= year);

                for (const booking of yearBookings) {
                    let start = parseDate(booking.checkIn);
                    let end = parseDate(booking.checkOut);

                    if (start.getFullYear() < year) start = new Date(year, 0, 1);
                    if (end.getFullYear() > year) end = new Date(year + 1, 0, 1);
                    
                    if (start < end){
                         const nights = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
                         totalOccupiedRoomNights += nights * booking.roomIds.length;
                    }
                }
                 
                 data.push({
                     name: year.toString(),
                     occupancy: totalOccupiedRoomNights / daysInYear
                 });
             }
        }

        return data;
    }, [bookings, viewMode, context.language]);
    
    const popularRoomsData = useMemo(() => {
        const roomCounts: { [roomId: string]: number } = {};
        bookings.forEach(booking => {
            booking.roomIds.forEach(roomId => {
                const room = rooms.find(r => r.id === roomId);
                if (room) {
                    if (popularRoomFilter === 'All' || room.type === popularRoomFilter) {
                        roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
                    }
                }
            });
        });
        return Object.entries(roomCounts)
            .map(([name, value]) => ({ name: `Room ${name}`, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [bookings, popularRoomFilter, rooms]);

    const COLORS = ['#e6c872', '#f3e6c0', '#d1b464', '#c5a553', '#b89643'];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('occupancy_statistics')}</h2>
                    <div className="flex space-x-1 bg-gray-200 p-1 rounded-md">
                        {(['daily', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1 text-sm rounded ${viewMode === mode ? 'bg-white shadow' : ''}`}>{t(mode)}</button>
                        ))}
                    </div>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={occupancyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} domain={[0, rooms.length]} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(1)} ${t('rooms_unit')}`} />
                            <Legend />
                            <Bar dataKey="occupancy" name={t('occupied_rooms')} fill="#e6c872" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">{t('popular_rooms')}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(['All', 'River view', 'Standard view', 'Cottage'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setPopularRoomFilter(type)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${popularRoomFilter === type ? 'bg-sunriver-yellow text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {type === 'All' ? t('all_types') : type}
                        </button>
                    ))}
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={popularRoomsData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                // Fix: Ensure 'percent' is treated as a number before performing arithmetic operations.
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {popularRoomsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;