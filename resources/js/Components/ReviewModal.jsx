import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function ReviewModal({ booking, onClose }) {
    const [hoverRating, setHoverRating] = useState(0);
    
    // Inertia Form Helper
    const { data, setData, post, processing, reset } = useForm({
        rating: 0,
        comment: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (data.rating === 0) {
            alert("Please select a star rating.");
            return;
        }
        
        post(`/bookings/${booking.id}/review`, {
            onSuccess: () => {
                alert("Review Submitted! Thank you.");
                reset();
                onClose(); // Close the modal on success
            },
            onError: (errors) => {
                console.error(errors);
                alert("Something went wrong. Please try again.");
            }
        });
    };

    return (
        // Backdrop (Clicking outside closes modal)
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            
            {/* Modal Content */}
            <div 
                className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
            >
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Rate Service</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black text-xl font-bold">×</button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                            {booking.service_type === 'Plumbing' ? '🚰' : 
                             booking.service_type === 'Electrical' ? '⚡' : '🛠️'}
                        </div>
                        <h4 className="font-bold text-gray-900">{booking.service_type}</h4>
                        <p className="text-xs text-gray-500">Completed on {new Date(booking.updated_at).toLocaleDateString()}</p>
                    </div>

                    {/* Star Rating System */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setData('rating', star)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            >
                                <svg 
                                    className={`w-10 h-10 ${
                                        star <= (hoverRating || data.rating) 
                                        ? "text-yellow-400 fill-yellow-400" 
                                        : "text-gray-200 fill-gray-200"
                                    }`}
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                                </svg>
                            </button>
                        ))}
                    </div>
                    
                    {/* Rating Text Feedback */}
                    <p className="text-center text-sm font-bold text-gray-600 mb-4">
                        {data.rating === 5 ? "Excellent! 🤩" :
                         data.rating === 4 ? "Great! 😀" :
                         data.rating === 3 ? "It was okay 🙂" :
                         data.rating === 2 ? "Could be better 😕" :
                         data.rating === 1 ? "Bad experience 😞" : "Tap a star to rate"}
                    </p>

                    {/* Comment Box */}
                    <textarea
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        placeholder="Write a comment (optional)..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-6"
                        rows="3"
                    ></textarea>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={processing || data.rating === 0}
                            className="flex-1 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {processing ? 'Sending...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}