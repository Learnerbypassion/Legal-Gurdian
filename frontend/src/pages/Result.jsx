import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { SaveHistoryModal } from '../components/SaveHistoryModal';
import { HistoryTab } from '../components/HistoryTab';
import RiskScoreCircle from '../components/RiskScoreCircle';
import { AnalysisLoading } from '../components/AnalysisLoading';
import { getRecommendedProfessionals, contactProfessional } from '../services/api';

export const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  
  // Try to get result from location state, fall back to localStorage
  let resultData = location.state;
  if (!resultData) {
    const storedData = localStorage.getItem('lastAnalysis');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // Ensure isUnauthenticated is a boolean
        if (parsed && typeof parsed.isUnauthenticated !== 'undefined') {
          parsed.isUnauthenticated = Boolean(parsed.isUnauthenticated);
        }
        resultData = parsed;
      } catch (e) {
        console.error('Failed to parse stored analysis', e);
      }
    }
  }
  
  const { result, documentId, fileName, isUnauthenticated, contractText } = resultData || {};
  const [activeTab, setActiveTab] = useState('summary');
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [contactedIds, setContactedIds] = useState({});

  // Show modal only once per session for unauthenticated users
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    console.log('=== Modal Debug ===');
    console.log('result:', !!result);
    console.log('isUnauthenticated:', isUnauthenticated);
    console.log('user:', user);
    console.log('authLoading:', authLoading);
    
    // Show modal if:
    // 1. We have result data
    // 2. Either isUnauthenticated flag is true OR user is not logged in
    if (result && (isUnauthenticated || !user)) {
      console.log('Showing modal');
      setShowSaveModal(true);
      sessionStorage.setItem('saveModalDismissed', 'true');
    }
  }, [result, isUnauthenticated, user, authLoading]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [result]);

  useEffect(() => {
    if (result) {
      // Determine profession type
      const textType = (result.contractType || '').toLowerCase();
      let requiredProfession = 'Lawyer';
      if (textType.includes('financial') || textType.includes('loan') || textType.includes('tax') || textType.includes('investment')) {
        requiredProfession = 'CA';
      }

      getRecommendedProfessionals(requiredProfession)
        .then(res => {
          if (res.success) setProfessionals(res.data);
        })
        .catch(err => console.error("Failed to fetch professionals", err));
    }
  }, [result]);

  const handleContact = async (profId) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    try {
      setContactedIds(prev => ({ ...prev, [profId]: 'Sending...' }));
      await contactProfessional(profId);
      setContactedIds(prev => ({ ...prev, [profId]: 'Sent' }));
    } catch (err) {
      console.error(err);
      setContactedIds(prev => ({ ...prev, [profId]: 'Failed' }));
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No analysis data found. Please upload a document to analyze.</p>
          <button
            onClick={() => {
              localStorage.removeItem('lastAnalysis');
              navigate('/');
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    // Clear analysis data when navigating away from result page
    if (path === '/') {
      localStorage.removeItem('lastAnalysis');
    }
    navigate(path);
    setShowMenu(false);
  };

  const riskScore = result.riskScore?.score || 0;
  const riskLevel = result.riskScore?.label || 'Unknown';
  const riskColor = {
    'Critical': 'text-red-600',
    'High': 'text-orange-600',
    'Medium': 'text-yellow-600',
    'Low': 'text-green-600',
  }[riskLevel] || 'text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('/')}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">IX</span>
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Legal-Tech
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavigation('/')}
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Dashboard
              </button>
              {user && (
                <>
                  <button
                    onClick={() => navigate('/history')}
                    className="text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    History
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Profile
                  </button>
                </>
              )}
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {showMenu && (
            <div className="md:hidden pb-4 border-t border-gray-200">
              <button
                onClick={() => handleNavigation('/')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
              >
                Dashboard
              </button>
              {user && (
                <>
                  <button
                    onClick={() => handleNavigation('/history')}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    History
                  </button>
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    Profile
                  </button>
                </>
              )}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium"
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavigation('/signup')}
                    className="block w-full text-left px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h2>
              <p className="text-gray-600">{fileName || 'Document'}</p>
            </div>
            <button
              onClick={() => handleNavigation('/')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              New Analysis
            </button>
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Risk Score Circle */}
            <div>
              <RiskScoreCircle score={riskScore} label={riskLevel} />
            </div>

            {/* Summary Stats */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Advantages</p>
                <p className="text-3xl font-bold text-green-600">{result.pros?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Concerns</p>
                <p className="text-3xl font-bold text-red-600">{result.cons?.length || 0}</p>
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Key Info</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {result.parties && result.parties.length > 0 && (
                  <li className="flex gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Parties:</strong> {result.parties.join(', ')}</span>
                  </li>
                )}
                {result.contractType && (
                  <li className="flex gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Type:</strong> {result.contractType}</span>
                  </li>
                )}
                {result.keyDates && result.keyDates.length > 0 && (
                  <li className="flex gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span><strong>Key Dates:</strong> {result.keyDates.length} found</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {[
                { id: 'summary', label: 'Summary', icon: '📋' },
                { id: 'advantages', label: 'Advantages', icon: '✅' },
                { id: 'concerns', label: 'Concerns', icon: '⚠️' },
                { id: 'clauses', label: 'Clauses', icon: '📄' },
                { id: 'professionals', label: 'Professionals', icon: '👔' },
                { id: 'history', label: 'History', icon: '⏱️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Executive Summary</h3>
                  {Array.isArray(result.summary) && result.summary.length > 0 ? (
                    <div className="space-y-3">
                      {result.summary.map((point, idx) => (
                        <p key={idx} className="text-gray-700 leading-relaxed">
                          {point}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {result.summary || 'No summary available'}
                    </p>
                  )}
                </div>

                {result.overallAdvice && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Overall Advice</h3>
                    <p className="text-gray-700">{result.overallAdvice}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advantages' && (
              <div className="space-y-4">
                {result.pros && result.pros.length > 0 ? (
                  result.pros.map((pro, idx) => (
                    <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex gap-3">
                        <span className="text-green-600 font-bold mt-1">✓</span>
                        <div className="flex-1">
                          {typeof pro === 'string' ? (
                            <p className="text-gray-700">{pro}</p>
                          ) : (
                            <div>
                              {pro.clause && <p className="text-gray-900 font-semibold mb-2">{pro.clause}</p>}
                              {pro.explanation && <p className="text-gray-700 mb-2">{pro.explanation}</p>}
                              {pro.advice && <p className="text-gray-600 text-sm italic">{pro.advice}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">No advantages identified</p>
                )}
              </div>
            )}

            {activeTab === 'concerns' && (
              <div className="space-y-4">
                {result.cons && result.cons.length > 0 ? (
                  result.cons.map((con, idx) => (
                    <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex gap-3">
                        <span className="text-red-600 font-bold mt-1">!</span>
                        <div className="flex-1">
                          {typeof con === 'string' ? (
                            <p className="text-gray-700">{con}</p>
                          ) : (
                            <div>
                              {con.clause && <p className="text-gray-900 font-semibold mb-2">{con.clause}</p>}
                              {con.explanation && <p className="text-gray-700 mb-2">{con.explanation}</p>}
                              {con.advice && <p className="text-gray-600 text-sm italic">{con.advice}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">No concerns identified</p>
                )}
              </div>
            )}

            {activeTab === 'clauses' && (
              <div className="space-y-4">
                {result.highlightedClauses && result.highlightedClauses.length > 0 ? (
                  result.highlightedClauses.map((clause, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {typeof clause === 'string' ? (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-2">Clause {idx + 1}</h4>
                          <p className="text-gray-700 text-sm">{clause}</p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {clause.title || `Clause ${idx + 1}`}
                          </h4>
                          {clause.type && (
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{clause.type}</p>
                          )}
                          {clause.text && (
                            <p className="text-gray-700 text-sm mb-2">{clause.text}</p>
                          )}
                          {clause.explanation && (
                            <p className="text-gray-600 text-sm italic">{clause.explanation}</p>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-8">No highlighted clauses</p>
                )}
              </div>
            )}

            {activeTab === 'professionals' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recommended Professionals</h3>
                  <p className="text-gray-600 text-sm">Based on the anomaly detected in this document, here are professionals you might want to contact.</p>
                </div>
                {professionals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professionals.map(prof => (
                      <div key={prof._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
                        <div className="flex-1 mb-4">
                          <h4 className="text-lg font-bold text-gray-900">{prof.name}</h4>
                          <p className="text-sm font-medium text-indigo-600 mb-2">{prof.professionalDetails?.profession}</p>
                          {prof.professionalDetails?.education && (
                            <p className="text-xs text-gray-600 mb-1"><strong>Education:</strong> {prof.professionalDetails.education}</p>
                          )}
                          {prof.professionalDetails?.experience && (
                            <p className="text-xs text-gray-600 mb-1"><strong>Experience:</strong> {prof.professionalDetails.experience}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleContact(prof._id)}
                          disabled={contactedIds[prof._id] === 'Sent' || contactedIds[prof._id] === 'Sending...'}
                          className={`w-full py-2 rounded-lg font-medium transition ${
                            contactedIds[prof._id] === 'Sent'
                              ? 'bg-green-100 text-green-700'
                              : contactedIds[prof._id] === 'Sending...'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {contactedIds[prof._id] || 'Send Email'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No professionals available for this issue right now.</p>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryTab />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => handleNavigation('/')}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            New Analysis
          </button>
          <button
            onClick={() => {
              if (!user) {
                setShowAuthPrompt(true);
                return;
              }
              // Basic download as JSON
              const dataStr = JSON.stringify(result, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'analysis_report.json';
              link.click();
            }}
            className="flex-1 px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
          >
            Download Report
          </button>
        </div>

        {/* ChatBox Component */}
        <div className="mt-12 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <ChatBox contractText={contractText || ''} language="English" />
          </div>
        </div>

        {/* Auth Prompt Banner */}
        {showAuthPrompt && !user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Save Your Analysis</h3>
                <p className="text-gray-600">Create an account to save your analysis</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Save all your analyses</p>
                    <p className="text-sm text-gray-600">Access your reports anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Track your history</p>
                    <p className="text-sm text-gray-600">View all past analyses</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full py-2 px-4 text-gray-600 font-medium hover:bg-gray-50 transition rounded-lg"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save History Modal */}
        <SaveHistoryModal
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            sessionStorage.setItem('saveModalDismissed', 'true');
          }}
          onSave={() => {
            // Save the analysis for later when user logs in
            sessionStorage.setItem('pendingAnalysis', JSON.stringify({
              result,
              fileName,
              documentId,
              timestamp: new Date().toISOString()
            }));
          }}
          fileName={fileName}
        />
      </main>
    </div>
  );
};
