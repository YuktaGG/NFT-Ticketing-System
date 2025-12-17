import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QRScannerPage = ({ walletAddress, onBack }) => {
  const [inputQR, setInputQR] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // UPDATED: Test QR data with valid Hardhat account
  const testQRData = "TICKET-NFT-12345-EVENT-001-OWNER-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // All Hardhat accounts for reference
  const hardhatAccounts = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
  ];

  const verifyTicket = async () => {
    if (!inputQR.trim()) {
      alert('Please enter QR code data');
      return;
    }

    setLoading(true);
    try {
      // Extract owner address from QR code
      const ownerMatch = inputQR.match(/OWNER-([0-9a-fA-Fx]+)/);
      const ownerAddress = ownerMatch ? ownerMatch[1] : null;

      // Check if it's a Hardhat account
      const isHardhatAccount = ownerAddress && hardhatAccounts.some(
        addr => addr.toLowerCase() === ownerAddress.toLowerCase()
      );

      // Local verification for test QR codes
      if (inputQR.startsWith('TICKET-NFT-') && ownerAddress) {
        setVerificationStatus({
          valid: true,
          ticket: {
            tokenId: inputQR.match(/TICKET-NFT-(\d+)/)?.[1] || '12345',
            event: {
              name: 'Rock Concert 2024',
              eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            currentOwner: ownerAddress,
            isUsed: false,
            isHardhatAccount: isHardhatAccount
          }
        });
      } else {
        // Backend verification (real tickets from your system)
        const response = await axios.post(`${API_URL}/tickets/verify`, {
          qrCode: inputQR,
          validatorAddress: walletAddress || 'anonymous'
        });

        if (response.data.success && response.data.data) {
          const ticket = response.data.data;

          setVerificationStatus({
            valid: true,
            ticket: {
              tokenId: ticket.tokenId,
              event: {
                name: ticket.eventName,
                eventDate: ticket.eventDate
              },
              currentOwner: ticket.owner,
              isUsed: ticket.isUsed,
              isHardhatAccount: ticket.isHardhatAccount || false,
              purchaseDate: ticket.purchaseDate,
              transactionHash: ticket.transactionHash
            }
          });
        } else {
          setVerificationStatus({
            valid: false,
            message: response.data.message || 'Invalid ticket'
          });
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationStatus({
        valid: false,
        message: err.response?.data?.message || 'Ticket not found or verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInputQR('');
    setVerificationStatus(null);
  };

  const useTestQR = () => {
    setInputQR(testQRData);
  };



  return (
    <div style={styles.container}>
      {/* Back Button */}
      {onBack && (
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Home
        </button>
      )}

      <h1 style={styles.mainTitle}>🎫 Ticket Verification System</h1>
      <p style={styles.mainSubtitle}>No wallet required - Verify tickets instantly</p>

      <div style={styles.content}>
        <div style={styles.leftSection}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📱 Test QR Code</h2>
            <p style={styles.subtitle}>Use this QR data for testing</p>
            
            <div style={styles.qrDisplay}>
              <div style={styles.qrBox}>
                <div style={styles.qrPattern}>
                  <div style={{...styles.qrCorner, top: 0, left: 0}}></div>
                  <div style={{...styles.qrCorner, top: 0, right: 0}}></div>
                  <div style={{...styles.qrCorner, bottom: 0, left: 0}}></div>
                  <div style={{...styles.qrCorner, bottom: 0, right: 0}}></div>
                  <div style={styles.qrCenter}>QR</div>
                </div>
              </div>
              <p style={styles.qrLabel}>Sample Ticket QR Code</p>
            </div>

            <div style={styles.dataBox}>
              <p style={styles.dataLabel}>QR Code Data:</p>
              <code style={styles.code}>{testQRData}</code>
              <button onClick={useTestQR} style={styles.copyButton}>
                📋 Use This QR
              </button>
            </div>

            <div style={styles.ticketInfo}>
              <h3 style={styles.infoTitle}>Sample Ticket Details</h3>
              <div style={styles.infoRow}>
                <span>Token ID:</span>
                <span style={styles.infoValue}>12345</span>
              </div>
              <div style={styles.infoRow}>
                <span>Event:</span>
                <span style={styles.infoValue}>Rock Concert 2024</span>
              </div>
              <div style={styles.infoRow}>
                <span>Owner:</span>
                <span style={styles.infoValue}>0xf39F...92266</span>
              </div>
              <div style={styles.infoRow}>
                <span>Account Type:</span>
                <span style={styles.hardhatBadge}>🔧 Hardhat Test Account</span>
              </div>
              <div style={styles.infoRow}>
                <span>Status:</span>
                <span style={styles.statusBadge}>✅ Valid</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔍 Verify Ticket</h2>
            <p style={styles.subtitle}>Enter QR code data to verify</p>

            {!verificationStatus ? (
              <>
                <div style={styles.inputSection}>
                  <label style={styles.label}>QR Code Data:</label>
                  <textarea
                    value={inputQR}
                    onChange={(e) => setInputQR(e.target.value)}
                    placeholder="Paste QR code data here or use test QR..."
                    style={styles.textarea}
                    rows="4"
                  />
                  
                  <button 
                    onClick={verifyTicket} 
                    disabled={loading}
                    style={styles.verifyButton}
                  >
                    {loading ? '🔄 Verifying...' : '✓ Verify Ticket'}
                  </button>
                </div>

                <div style={styles.instructions}>
                  <p style={styles.instructionTitle}>📋 How to Test:</p>
                  <ol style={styles.instructionList}>
                    <li>Click "Use This QR" button on the left</li>
                    <li>Click "Verify Ticket" to check validity</li>
                    <li>See approval/rejection result</li>
                    <li>Any of the 20 Hardhat accounts will be approved ✅</li>
                  </ol>
                </div>
              </>
            ) : (
              <div style={styles.resultSection}>
                {verificationStatus.valid ? (
                  <div style={styles.successResult}>
                    <div style={styles.successIcon}>✓</div>
                    <h3 style={styles.resultTitle}>APPROVED ✅</h3>
                    <p style={styles.resultSubtitle}>Valid Ticket - Entry Granted</p>

                    <div style={styles.ticketDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Event:</span>
                        <span style={styles.detailValue}>{verificationStatus.ticket.event?.name}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Token ID:</span>
                        <span style={styles.detailValue}>{verificationStatus.ticket.tokenId}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Owner:</span>
                        <span style={styles.detailValue}>
                          {verificationStatus.ticket.currentOwner?.substring(0, 10)}...
                          {verificationStatus.ticket.currentOwner?.substring(verificationStatus.ticket.currentOwner.length - 8)}
                        </span>
                      </div>
                      {verificationStatus.ticket.isHardhatAccount && (
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Account Type:</span>
                          <span style={styles.hardhatBadge}>
                            🔧 Hardhat Test Account
                          </span>
                        </div>
                      )}
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Used:</span>
                        <span style={verificationStatus.ticket.isUsed ? styles.usedBadge : styles.notUsedBadge}>
                          {verificationStatus.ticket.isUsed ? '🎫 Already Used' : '✅ Not Used'}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Event Date:</span>
                        <span style={styles.detailValue}>
                          {new Date(verificationStatus.ticket.event?.eventDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button onClick={reset} style={styles.approveButton}>
                      ✓ Approve & Scan Next
                    </button>
                  </div>
                ) : (
                  <div style={styles.errorResult}>
                    <div style={styles.errorIcon}>✗</div>
                    <h3 style={styles.resultTitle}>REJECTED ❌</h3>
                    <p style={styles.resultSubtitle}>Invalid or Unrecognized Ticket</p>
                    
                    <div style={styles.errorBox}>
                      <p style={styles.errorMessage}>{verificationStatus.message}</p>
                    </div>

                    <button onClick={reset} style={styles.rejectButton}>
                      ✗ Reject & Scan Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '12px 24px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100
  },
  mainTitle: {
    textAlign: 'center',
    color: 'white',
    fontSize: '2.5em',
    marginBottom: '8px',
    marginTop: '20px',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  mainSubtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '1.2em',
    marginBottom: '40px'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  leftSection: {},
  rightSection: {},
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    height: '100%'
  },
  cardTitle: {
    fontSize: '1.8em',
    marginBottom: '8px',
    color: '#333',
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '24px'
  },
  qrDisplay: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  qrBox: {
    display: 'inline-block',
    padding: '20px',
    background: 'white',
    border: '3px solid #667eea',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
  },
  qrPattern: {
    width: '250px',
    height: '250px',
    background: `
      repeating-linear-gradient(0deg, #000 0px, #000 10px, transparent 10px, transparent 20px),
      repeating-linear-gradient(90deg, #000 0px, #000 10px, transparent 10px, transparent 20px)
    `,
    position: 'relative',
    borderRadius: '8px'
  },
  qrCorner: {
    position: 'absolute',
    width: '50px',
    height: '50px',
    border: '8px solid #000',
    borderRadius: '8px'
  },
  qrCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#000'
  },
  qrLabel: {
    marginTop: '12px',
    color: '#666',
    fontSize: '0.9em'
  },
  dataBox: {
    background: '#f0f4ff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  dataLabel: {
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333'
  },
  code: {
    display: 'block',
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    fontSize: '0.85em',
    wordBreak: 'break-all',
    color: '#667eea',
    fontFamily: 'monospace',
    marginBottom: '12px'
  },
  copyButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  ticketInfo: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px'
  },
  infoTitle: {
    fontSize: '1.1em',
    marginBottom: '16px',
    color: '#333'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e0e0e0',
    alignItems: 'center'
  },
  infoValue: {
    fontWeight: '600',
    color: '#667eea'
  },
  statusBadge: {
    padding: '4px 12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '0.9em',
    fontWeight: '600'
  },
  hardhatBadge: {
    padding: '4px 12px',
    background: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '12px',
    fontSize: '0.9em',
    fontWeight: '600'
  },
  inputSection: {
    marginBottom: '32px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333'
  },
  textarea: {
    width: '100%',
    padding: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'monospace',
    resize: 'vertical',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  verifyButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)'
  },
  instructions: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px'
  },
  instructionTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333'
  },
  instructionList: {
    paddingLeft: '24px',
    lineHeight: '1.8',
    color: '#666'
  },
  resultSection: {
    padding: '20px 0'
  },
  successResult: {
    textAlign: 'center'
  },
  successIcon: {
    width: '120px',
    height: '120px',
    background: '#4caf50',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '72px',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
  },
  errorResult: {
    textAlign: 'center'
  },
  errorIcon: {
    width: '120px',
    height: '120px',
    background: '#f44336',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '72px',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)'
  },
  resultTitle: {
    fontSize: '2em',
    marginBottom: '8px',
    color: '#333'
  },
  resultSubtitle: {
    fontSize: '1.2em',
    color: '#666',
    marginBottom: '32px'
  },
  ticketDetails: {
    background: '#f8f9fa',
    padding: '24px',
    borderRadius: '12px',
    margin: '24px 0',
    textAlign: 'left'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid #e0e0e0',
    alignItems: 'center'
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333'
  },
  detailValue: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: '0.95em'
  },
  notUsedBadge: {
    padding: '4px 12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '0.9em',
    fontWeight: '600'
  },
  usedBadge: {
    padding: '4px 12px',
    background: '#fff3e0',
    color: '#e65100',
    borderRadius: '12px',
    fontSize: '0.9em',
    fontWeight: '600'
  },
  errorBox: {
    background: '#ffebee',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  errorMessage: {
    color: '#c62828',
    fontSize: '1.1em',
    fontWeight: '600'
  },
  approveButton: {
    padding: '16px 48px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(76, 175, 80, 0.4)'
  },
  rejectButton: {
    padding: '16px 48px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(244, 67, 54, 0.4)'
  }
};

export default QRScannerPage;