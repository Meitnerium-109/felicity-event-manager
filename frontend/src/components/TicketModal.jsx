import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TicketModal = ({ isOpen, onClose, registration }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen || !registration) return null;

    const { eventId, ticketId, participantId } = registration;
    // Fallbacks if populations are missing
    const eventName = eventId?.eventName || eventId?.title || 'Unknown Event';
    const participantName = participantId?.name || participantId?.firstName || 'Participant';

    // QR Code Data format - this is what the scanner will read
    const qrData = JSON.stringify({
        ticketId: ticketId || registration._id,
        eventId: eventId?._id || eventId,
        userId: participantId?._id || participantId
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(ticketId || registration._id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity">

            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">

                {/* Header Ribbon */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-center text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-indigo-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="uppercase tracking-widest text-xs font-bold text-indigo-200 mb-1">Entry Ticket</div>
                    <h2 className="text-2xl font-extrabold line-clamp-2">{eventName}</h2>
                </div>

                {/* Modal Body */}
                <div className="p-8 text-center bg-gray-50 flex flex-col items-center">

                    <p className="text-gray-500 text-sm mb-1">Admit One</p>
                    <p className="text-xl font-bold text-gray-900 mb-6">{participantName}</p>

                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 mb-6 flex justify-center w-full max-w-[200px]">
                        <QRCodeSVG
                            value={qrData}
                            size={160}
                            bgColor={"#ffffff"}
                            fgColor={"#111827"}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>

                    {/* Ticket ID Box */}
                    <div className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center group cursor-copy" onClick={handleCopy} title="Click to copy">
                        <div>
                            <span className="block text-xs text-indigo-500 font-bold uppercase tracking-wider mb-0.5 text-left">Ticket ID</span>
                            <span className="font-mono font-bold text-indigo-900 tracking-widest">
                                {ticketId || registration._id.substring(0, 8)}
                            </span>
                        </div>
                        <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors">
                            {copied ? (
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            )}
                        </div>
                    </div>

                    {eventId?.eventType === 'Merchandise' && (
                        <div className="mt-4 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 w-full text-center">
                            Merchandise Purchase
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Close Ticket
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TicketModal;
