
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ROOMS } from '../constants';
import { CleaningStatus, Room } from '../types';
import { getTodayDateString, parseDate } from '../utils/helpers';

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const context = useContext(AppContext);
    
    if (!isOpen || !context) {
        return null;
    }

    const { t } = context;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-sunriver-yellow text-white rounded hover:bg-opacity-90">{t('confirm')}</button>
                </div>
            </div>
        </div>
    );
};


const CleaningPage: React.FC = () => {
    const context = useContext(AppContext);
    const [modalState, setModalState] = useState<{ isOpen: boolean; room: Room | null; newStatus: CleaningStatus | null }>({ isOpen: false, room: null, newStatus: null });

    if (!context) return null;
    const { t, bookings, cleaningStatus, updateCleaningStatus } = context;

    const roomDetails = useMemo(() => {
        const today = getTodayDateString();
        const todayDateObj = parseDate(today);
        todayDateObj.setHours(0, 0, 0, 0);

        return ROOMS.map(room => {
            const relevantBookings = bookings.filter(b => {
                if (!b.roomIds.includes(room.id)) return false;
                const checkIn = parseDate(b.checkIn);
                const checkOut = parseDate(b.checkOut);
                const isStaying = checkIn <= todayDateObj && todayDateObj < checkOut;
                const isCheckingOut = b.checkOut === today;
                return isStaying || isCheckingOut;
            });

            const uniqueBookings = Array.from(new Set(relevantBookings.map(b => b.id))).map(id => relevantBookings.find(b => b.id === id)!);
            
            const statuses: string[] = [];
            if (uniqueBookings.length === 0) {
                statuses.push(t('status_vacant'));
            } else {
                const hasCheckIn = uniqueBookings.some(b => b.checkIn === today);
                const hasCheckOut = uniqueBookings.some(b => b.checkOut === today);
                const hasInHouse = uniqueBookings.some(b => parseDate(b.checkIn) < todayDateObj && todayDateObj < parseDate(b.checkOut));

                if(hasCheckIn) statuses.push(t('status_check_in'));
                if(hasCheckOut) statuses.push(t('status_check_out'));
                if(hasInHouse) statuses.push(t('status_in_house'));
            }

            return { room, statuses };
        });
    }, [bookings, t]);

    const sortedRooms = useMemo(() => {
      return [...roomDetails].sort((a, b) => a.room.id.localeCompare(b.room.id, undefined, { numeric: true }));
    }, [roomDetails]);

    const handleStatusChangeClick = (room: Room, newStatus: CleaningStatus) => {
        setModalState({ isOpen: true, room, newStatus });
    };

    const handleConfirmStatusChange = () => {
        if (modalState.room && modalState.newStatus) {
            updateCleaningStatus(modalState.room.id, modalState.newStatus);
        }
        setModalState({ isOpen: false, room: null, newStatus: null });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('cleaning')}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sortedRooms.map(({ room, statuses }) => {
                    const currentStatus = cleaningStatus[room.id] || 'CLEAN';
                    const isClean = currentStatus === 'CLEAN';
                    const isVacant = statuses.includes(t('status_vacant'));

                    return (
                        <div key={room.id} className={`p-4 border rounded-lg shadow-sm flex flex-col justify-between min-h-[200px] ${isClean && isVacant ? 'bg-white' : 'bg-gray-50'}`}>
                            <div>
                                <h3 className="text-xl font-bold">Room {room.id}</h3>
                                <p className="text-sm text-gray-600">{room.type}</p>
                                <div className="text-xs space-y-1 my-2">
                                    {statuses.map((statusText, i) => (
                                      <span key={i} className={`block px-2 py-1 rounded-full text-center whitespace-nowrap font-medium bg-gray-100 text-gray-800`}>
                                          {statusText}
                                      </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleStatusChangeClick(room, isClean ? 'DIRTY' : 'CLEAN')}
                                className={`w-full mt-2 p-2 rounded-md text-white font-semibold transition-colors ${isClean ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {isClean ? t('clean') : t('dirty')}
                            </button>
                        </div>
                    );
                })}
            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, room: null, newStatus: null })}
                onConfirm={handleConfirmStatusChange}
                title={t('confirm_status_change')}
                message={modalState.newStatus === 'CLEAN' ? t('confirm_clean_message') : t('confirm_dirty_message')}
            />
        </div>
    );
};

export default CleaningPage;
