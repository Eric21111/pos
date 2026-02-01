import React, { useState } from 'react';

const AddBrandModal = ({ show, onClose, onAdd }) => {
    const [newBrand, setNewBrand] = useState('');
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newBrand.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/brand-partners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ brandName: newBrand }),
            });

            const data = await response.json();

            if (data.success) {
                onAdd(newBrand);
                setNewBrand('');
                onClose();
            } else {
                alert(data.message || 'Failed to add brand');
            }
        } catch (error) {
            console.error('Error adding brand:', error);
            alert('Failed to add brand. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 bg-black/50 backdrop-blur-sm pointer-events-auto">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 opacity-100">
                <h2 className="text-2xl font-bold mb-6">Add Brand</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand Name
                        </label>
                        <input
                            type="text"
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            placeholder="Enter brand name"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AD7F65] focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !newBrand.trim()}
                            className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] text-white font-medium hover:bg-[#6F4E37] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#8B5E3C]/30"
                        >
                            {loading ? 'Adding...' : 'Add Brand'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBrandModal;
