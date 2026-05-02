import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SaveHistoryModal = ({ isOpen, onClose, onSave, fileName }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
    // Navigate to signup for saving
    navigate('/signup', { state: { from: 'save-history', shouldSaveAnalysis: true } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Save Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Want to save this analysis to your account?
          </p>
          <p className="text-sm text-gray-500">
            File: <span className="font-semibold text-gray-700">{fileName}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to your account to save your analysis history and access it anytime.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-indigo-900 mb-2">Benefits of saving:</p>
          <ul className="text-xs text-indigo-800 space-y-1">
            <li>✓ Access your analysis history anytime</li>
            <li>✓ Chat with AI about your documents</li>
            <li>✓ Get personalized insights</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 font-medium transition"
          >
            Sign In & Save
          </button>
        </div>
      </div>
    </div>
  );
};
