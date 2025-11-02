import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [answer, setAnswer] = useState('');
  const [supervisorName, setSupervisorName] = useState('');

  // Fetch help requests
  const fetchRequests = async (status = '') => {
    setLoading(true);
    try {
      const url = status ? `${API_URL}/help-requests?status=${status}` : `${API_URL}/help-requests`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch requests');
    }
    setLoading(false);
  };

  // Fetch knowledge base
  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/knowledge-base`);
      const data = await res.json();
      setKnowledge(data.knowledge || []);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      alert('Failed to fetch knowledge base');
    }
    setLoading(false);
  };

  // Handle tab change
  useEffect(() => {
    if (activeTab === 'knowledge') {
      fetchKnowledge();
    } else {
      const statusMap = {
        'pending': 'pending',
        'resolved': 'resolved',
        'timeout': 'timeout'
      };
      fetchRequests(statusMap[activeTab]);
    }
  }, [activeTab]);

  // Auto-refresh pending requests every 10 seconds
  useEffect(() => {
    if (activeTab === 'pending') {
      const interval = setInterval(() => {
        fetchRequests('pending');
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Submit answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/help-requests/${selectedRequest._id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answer: answer.trim(),
          supervisorName: supervisorName.trim() || 'Supervisor'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Answer submitted! Customer notified and knowledge base updated.');
        setSelectedRequest(null);
        setAnswer('');
        fetchRequests('pending');
      } else {
        alert('Failed to submit answer: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 Frontdesk AI Supervisor Dashboard</h1>
        <p>Human-in-the-Loop Request Management</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          📋 Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={activeTab === 'resolved' ? 'active' : ''} 
          onClick={() => setActiveTab('resolved')}
        >
          ✅ Resolved
        </button>
        <button 
          className={activeTab === 'timeout' ? 'active' : ''} 
          onClick={() => setActiveTab('timeout')}
        >
          ⏰ Timeout
        </button>
        <button 
          className={activeTab === 'knowledge' ? 'active' : ''} 
          onClick={() => setActiveTab('knowledge')}
        >
          📚 Knowledge Base
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'knowledge' ? (
          <KnowledgeBaseView knowledge={knowledge} />
        ) : (
          <RequestsView 
            requests={requests} 
            status={activeTab}
            onSelectRequest={setSelectedRequest}
          />
        )}
      </div>

      {/* Answer Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>📝 Provide Answer</h2>
            
            <div className="request-details">
              <p><strong>Question:</strong></p>
              <p className="question">{selectedRequest.question}</p>
              <p><strong>Caller:</strong> {selectedRequest.callerPhone}</p>
              <p><strong>Received:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
            </div>

            <form onSubmit={handleSubmitAnswer}>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="input-field"
              />
              
              <textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                className="textarea-field"
                autoFocus
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedRequest(null)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Answer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestsView({ requests, status, onSelectRequest }) {
  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <p>No {status} requests</p>
      </div>
    );
  }

  return (
    <div className="requests-grid">
      {requests.map(request => (
        <div key={request._id} className="request-card">
          <div className="request-header">
            <span className={`status-badge status-${request.status}`}>
              {request.status.toUpperCase()}
            </span>
            <span className="request-time">
              {new Date(request.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="request-body">
            <p className="request-question">
              <strong>Q:</strong> {request.question}
            </p>
            <p className="request-caller">
              <strong>📞 Caller:</strong> {request.callerPhone}
            </p>

            {request.answer && (
              <p className="request-answer">
                <strong>A:</strong> {request.answer}
              </p>
            )}

            {request.resolvedBy && (
              <p className="request-resolver">
                <strong>Resolved by:</strong> {request.resolvedBy} at {new Date(request.resolvedAt).toLocaleString()}
              </p>
            )}
          </div>

          {request.status === 'pending' && (
            <button 
              className="btn-respond"
              onClick={() => onSelectRequest(request)}
            >
              Respond
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function KnowledgeBaseView({ knowledge }) {
  if (knowledge.length === 0) {
    return (
      <div className="empty-state">
        <p>No learned answers yet</p>
      </div>
    );
  }

  return (
    <div className="knowledge-grid">
      {knowledge.map(item => (
        <div key={item._id} className="knowledge-card">
          <div className="knowledge-meta">
            <span className="knowledge-date">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <span className="knowledge-usage">
              Used {item.usageCount} times
            </span>
          </div>

          <div className="knowledge-content">
            <p className="knowledge-question">
              <strong>Q:</strong> {item.question}
            </p>
            <p className="knowledge-answer">
              <strong>A:</strong> {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;