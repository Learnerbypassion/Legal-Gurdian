import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import Cookies from 'js-cookie';

const LANGUAGES = ['English', 'Hindi', 'Bengali'];
const USER_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'business', label: 'Business Owner' },
  { value: 'student', label: 'Student' },
];

export const UploadBox = ({ uploading, setUploading, analysisStatus, setAnalysisStatus }) => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('English');
  const [userType, setUserType] = useState('general');
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setSelectedFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setProgress(0);
    setAnalysisStatus('reading');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 45) {
            clearInterval(progressInterval);
            return 45;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // Create FormData
      const formData = new FormData();
      formData.append('contract', selectedFile);
      formData.append('language', language);
      formData.append('userType', userType);

      // Get token from cookie (optional for unauthenticated users)
      const token = Cookies.get('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Step 1: Upload file
      const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setProgress(50);
      setAnalysisStatus('analyzing');

      // Step 2: Analyze the contract
      const analyzeResponse = await fetch(`${import.meta.env.VITE_API_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractText: uploadData.contractText,
          filename: uploadData.filename,
          charCount: uploadData.charCount,
          language: language,
          userType: userType
        })
      });

      clearInterval(progressInterval);
      setAnalysisStatus('detecting');

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }

      const analysisData = await analyzeResponse.json();
      setProgress(100);

      // Small delay to show completion state
      setTimeout(() => {
        // Store analysis data in localStorage for persistence on refresh
        const resultData = {
          result: analysisData,
          fileName: uploadData.filename,
          documentId: uploadData.documentId,
          isUnauthenticated: !user,
          contractText: uploadData.contractText
        };
        localStorage.setItem('lastAnalysis', JSON.stringify(resultData));

        // Reset uploading state and navigate
        setUploading(false);
        
        // Navigate to result page with analysis
        // Mark if this is from unauthenticated user
        navigate('/result', { 
          state: resultData
        });
      }, 500);
    } catch (err) {
      setError(err.message || 'Upload or analysis failed. Please try again.');
      setUploading(false);
      setProgress(0);
      setAnalysisStatus('reading');
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
            <svg
              className={`w-8 h-8 ${
                selectedFile ? 'text-green-600' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>

          {selectedFile ? (
            <>
              <div>
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <p className="text-xs text-gray-500">Click to change file</p>
            </>
          ) : (
            <>
              <div>
                <p className={`text-lg font-semibold ${isDragActive ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">PDF, TXT, DOC, DOCX • Max 10MB</p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            User Type
          </label>
          <div className="flex flex-wrap gap-2">
            {USER_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setUserType(type.value)}
                disabled={uploading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  userType === type.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Output Language
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                disabled={uploading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  language === lang
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || uploading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          !selectedFile || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg'
        }`}
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analyze Document
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Upload your document</li>
          <li>AI analyzes the content</li>
          <li>Get summary, insights, and risk assessment</li>
          <li>Download your analysis report</li>
        </ul>
      </div>
    </div>
  );
};
