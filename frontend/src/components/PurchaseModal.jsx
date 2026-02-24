import React, { useState } from 'react';

const PurchaseModal = ({ event, onClose, onSubmit }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selected);
        }
    };

    const handleSubmit = async () => {
        if (!preview) {
            alert("Please upload a payment screenshot to proceed.");
            return;
        }

        setIsProcessing(true);
        try {
            // Send the base64 string up to the parent
            await onSubmit(preview);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0f2118] border border-green-500/30 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden text-gray-100 flex flex-col transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-900 to-[#0a1f16] px-6 py-4 border-b border-green-500/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-green-50">Checkout: {event.eventName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm text-gray-300 mb-2">To complete your purchase, please pay the exact amount via UPI.</p>
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <span className="text-3xl font-black text-green-400">₹{event.fee || 0}</span>
                        </div>
                        <p className="text-xs tracking-widest text-green-200/70 uppercase">UPI ID: felicity@upi</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-green-100 uppercase tracking-wide">
                            Upload Payment Screenshot *
                        </label>

                        {/* File Upload Area */}
                        {!preview ? (
                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-green-500/30 border-dashed rounded-xl hover:bg-green-900/20 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
                                />
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-green-400/60" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-400 justify-center">
                                        <span className="relative rounded-md font-medium text-green-400 hover:text-green-300 cursor-pointer">
                                            Upload a file
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 relative rounded-xl overflow-hidden border border-green-500/30 group">
                                <img src={preview} alt="Payment Preview" className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => setPreview(null)}
                                        className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-black/30 px-6 py-4 flex justify-end gap-3 border-t border-green-500/20">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing || !preview}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : 'Submit Order & Upload Proof'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseModal;
