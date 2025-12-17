import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QRScanner = ({ onClose, walletAddress }) => {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scanner.render(onScanSuccess, onScanError);

      function onScanSuccess(decodedText, decodedResult) {
        setResult(decodedText);
        setScanning(false);
        scanner.clear();
        verifyTicket(decodedText);
      }

      function onScanError(err) {
        // Handle scan error silently
      }

      return () => {
        scanner.clear();
      };
    }
  }, [scanning]);

  const verifyTicket = async (qrData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/tickets/verify`, {
        qrCode: qrData,
        scannerAddress: walletAddress
      });

      if (response.data.success) {
        setVerificationStatus('valid');
        setTicketDetails(response.data.data);
      } else {
        setVerificationStatus('invalid');
      }
    } catch (err) {
      setVerificationStatus('error');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
    setVerificationStatus(null);
    setTicketDetails(null);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 style={styles.title}>Scan Ticket QR Code</h2>

        {scanning && (
          <div>
            <div id="qr-reader" style={styles.scanner}></div>
            <p style={styles.instruction}>Position the QR code within the frame</p>
          </div>
        )}

        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Verifying ticket...</p>
          </div>
        )}

        {verificationStatus === 'valid' && ticketDetails && (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.successTitle}>Valid Ticket!</h3>
            
            <div style={styles.ticketInfo}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Event:</span>
                <span style={styles.value}>{ticketDetails.event?.name}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Token ID:</span>
                <span style={styles.value}>{ticketDetails.tokenId}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Owner:</span>
                <span style={styles.value}>
                  {ticketDetails.currentOwner?.substring(0, 10)}...
                  {ticketDetails.currentOwner?.substring(ticketDetails.currentOwner.length - 8)}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Status:</span>
                <span style={{...styles.value, ...styles.statusValid}}>
                  {ticketDetails.isUsed ? '🎫 Already Used' : '✅ Not Used'}
                  
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Event Date:</span>
                <span style={styles.value}>
                  {new Date(ticketDetails.event?.eventDate).toLocaleString()}
                </span>
              </div>
            </div>

            <button onClick={resetScanner} style={styles.scanButton}>
              Scan Another Ticket
            </button>
          </div>
        )}

        {verificationStatus === 'invalid' && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>✗</div>
            <h3 style={styles.errorTitle}>Invalid Ticket</h3>
            <p style={styles.errorText}>This ticket could not be verified</p>
            
            <button onClick={resetScanner} style={styles.scanButton}>
              Try Again
            </button>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠</div>
            <h3 style={styles.errorTitle}>Verification Error</h3>
            <p style={styles.errorText}>Could not connect to verification service</p>
            
            <button onClick={resetScanner} style={styles.scanButton}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#999'
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333'
  },
  scanner: {
    width: '100%',
    marginBottom: '16px'
  },
  instruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9em'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px 0'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite'
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px 0'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    background: '#4caf50',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    margin: '0 auto 24px'
  },
  successTitle: {
    color: '#4caf50',
    marginBottom: '24px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '20px 0'
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    background: '#f44336',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    margin: '0 auto 24px'
  },
  errorTitle: {
    color: '#f44336',
    marginBottom: '16px'
  },
  errorText: {
    color: '#666',
    marginBottom: '24px'
  },
  ticketInfo: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '24px 0',
    textAlign: 'left'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e0e0e0'
  },
  label: {
    fontWeight: '600',
    color: '#333'
  },
  value: {
    color: '#666',
    fontFamily: 'monospace'
  },
  statusValid: {
    color: '#4caf50',
    fontWeight: '600'
  },
  scanButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px'
  },
  hardhatBadge: {
  padding: '4px 12px',
  background: '#e3f2fd',
  color: '#1565c0',
  borderRadius: '12px',
  fontSize: '0.9em',
  fontWeight: '600'
}
};

export default QRScanner;