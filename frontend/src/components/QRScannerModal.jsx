import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '../services/api';

const QRScannerModal = ({ eventId, onClose, onScanSuccessCallback }) => {
    const [scanMessage, setScanMessage] = useState(null);
    const scannerRef = useRef(null);
    const apiLock = useRef(false);

    useEffect(() => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            config,
            false
        );

        scannerRef.current = html5QrcodeScanner;

        const onScanSuccess = async (decodedText) => {
            if (apiLock.current) return;
            apiLock.current = true;

            try {
                // Parse the QR string (which we serialized as JSON earlier in registrationController)
                const data = JSON.parse(decodedText);
                const { ticketId, eventId: scannedEventId } = data;

                if (scannedEventId !== eventId) {
                    setScanMessage({ type: 'error', text: 'Invalid Ticket! This ticket belongs to a different event.' });
                    setTimeout(() => { apiLock.current = false; }, 2000);
                    return;
                }

                // Call the API
                const res = await api.put('/registrations/attendance', { ticketId, isManualOverride: false });

                setScanMessage({
                    type: 'success',
                    text: `✅ ${res.data.participantName} marked present!`
                });

                // Notify parent to refresh stats
                if (onScanSuccessCallback) onScanSuccessCallback();

            } catch (error) {
                // Handle duplicate scans or network errors
                let msg = 'Failed to process QR Code.';

                if (error instanceof SyntaxError) {
                    msg = 'Unrecognized QR Code format.';
                } else if (error.response?.data?.message) {
                    msg = `❌ ${error.response.data.message}`;
                    if (error.response.data.participantName) {
                        msg += ` (${error.response.data.participantName})`;
                    }
                }

                setScanMessage({ type: 'error', text: msg });
            } finally {
                // Allow the next scan after a short delay so we don't spam the API on a single barcode hold
                setTimeout(() => {
                    setScanMessage(null);
                    apiLock.current = false;
                }, 3000);
            }
        };

        const onScanFailure = (error) => {
            // Ignore normal continuous scan failures
        };

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [eventId, onScanSuccessCallback]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#05110a] border border-emerald-500/30 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-900 to-[#032e19] px-6 py-4 flex justify-between items-center border-b border-emerald-500/20">
                    <h2 className="text-xl font-bold text-emerald-50 flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        QR Scanner
                    </h2>
                    <button onClick={onClose} className="text-emerald-500 hover:text-white transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Scanner Interface */}
                <div className="p-4 relative">
                    <p className="text-center text-sm text-gray-400 mb-4">Position the ticket QR code securely within the frame.</p>

                    <div className="rounded-xl overflow-hidden border border-emerald-500/20">
                        <div id="qr-reader" className="w-full"></div>
                    </div>

                    {/* Status Overlay */}
                    {scanMessage && (
                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 p-4 rounded-xl shadow-2xl backdrop-blur-md border text-center z-10 animate-fade-in
                            ${scanMessage.type === 'success'
                                ? 'bg-emerald-900/90 border-emerald-400 text-emerald-50'
                                : 'bg-red-900/90 border-red-500 text-red-50'}`}
                        >
                            <p className="font-bold text-lg">{scanMessage.text}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-black/30 px-6 py-4 flex justify-between items-center text-xs text-gray-500 border-t border-emerald-500/20">
                    <span>Keep the camera steady for rapid scanning.</span>
                    <button onClick={onClose} className="text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider">Close Scanner</button>
                </div>
            </div>

            <style>{`
                /* Hide HTML5-QRCode native branding and gross UI elements to match our glassmorphism theme */
                #qr-reader { border: none !important; }
                #qr-reader__dashboard_section_csr span { color: #10b981 !important; }
                #qr-reader__dashboard_section_csr button { 
                    background-color: #047857 !important; 
                    color: white !important; 
                    border: none !important; 
                    padding: 8px 16px !important; 
                    border-radius: 6px !important; 
                }
                #qr-reader__status_span { display: none !important; }
                #qr-reader img { display: none !important; }
            `}</style>
        </div>
    );
};

export default QRScannerModal;
