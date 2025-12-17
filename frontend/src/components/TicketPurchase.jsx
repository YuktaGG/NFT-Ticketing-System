import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TicketPurchase = ({ event, walletAddress, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Payment, 2: Processing, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentInfo({ ...paymentInfo, [name]: formatted });
      return;
    }
    
    if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
      setPaymentInfo({ ...paymentInfo, [name]: formatted });
      return;
    }
    
    setPaymentInfo({ ...paymentInfo, [name]: value });
  };

  const validatePayment = () => {
    const errors = [];
    
    const cardNum = paymentInfo.cardNumber.replace(/\s/g, '');
    if (cardNum.length !== 16) {
      errors.push('Card number must be 16 digits');
    }
    
    if (!paymentInfo.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      errors.push('Invalid expiry date format (MM/YY)');
    }
    
    if (paymentInfo.cvv.length !== 3) {
      errors.push('CVV must be 3 digits');
    }
    
    if (!paymentInfo.cardholderName.trim()) {
      errors.push('Cardholder name is required');
    }
    
    return errors;
  };

  const handlePurchase = async () => {
    setError(null);
    
    const validationErrors = validatePayment();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      const response = await axios.post(`${API_URL}/tickets/buy`, {
        eventId: event._id,
        buyerAddress: walletAddress,
        paymentDetails: {
          cardNumber: paymentInfo.cardNumber.replace(/\s/g, ''),
          expiryDate: paymentInfo.expiryDate,
          cvv: paymentInfo.cvv,
          cardholderName: paymentInfo.cardholderName
        }
      });

      if (response.data.success) {
        setTicket(response.data.data);
        setStep(3);
        
        if (onSuccess) {
          onSuccess(response.data.data.ticket);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed. Please try again.');
      setStep(1);
      console.error('Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        
        {step === 1 && (
          <div style={styles.content}>
            <h2>Purchase Ticket</h2>
            
            <div style={styles.eventSummary}>
              <h3>{event.name}</h3>
              <p>{new Date(event.eventDate).toLocaleDateString()}</p>
              <p style={styles.price}>${event.ticketPrice}</p>
            </div>

            <div style={styles.formGroup}>
              <label>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentInfo.cardNumber}
                onChange={handleInputChange}
                maxLength="19"
                style={styles.input}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={paymentInfo.expiryDate}
                  onChange={handleInputChange}
                  maxLength="5"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={paymentInfo.cvv}
                  onChange={handleInputChange}
                  maxLength="3"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Cardholder Name</label>
              <input
                type="text"
                name="cardholderName"
                placeholder="John Doe"
                value={paymentInfo.cardholderName}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button 
              style={styles.button}
              onClick={handlePurchase}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay $${event.ticketPrice}`}
            </button>

            <p style={styles.secureNote}>🔒 Secure payment processing</p>
          </div>
        )}

        {step === 2 && (
          <div style={styles.processing}>
            <div style={styles.spinner} />
            <h2>Processing Your Purchase</h2>
            <p>Minting your NFT ticket on the blockchain...</p>
            <p style={styles.note}>This may take a few moments</p>
          </div>
        )}

        {step === 3 && ticket && (
          <div style={styles.success}>
            <div style={styles.successIcon}>✓</div>
            <h2>Purchase Successful!</h2>
            <p>Your NFT ticket has been minted</p>

            <div style={styles.qrContainer}>
              <img
               src={ticket.ticket.qrCode}
               alt="Ticket QR Code"
               style={styles.qrImage}
              />
             <p style={styles.qrNote}>Save this QR code for event entry</p>
            </div>

            <div style={styles.ticketDetails}>
              <div style={styles.detailRow}>
                <span>Token ID:</span>
                <span style={styles.value}>{ticket.ticket.tokenId}</span>
              </div>
              <div style={styles.detailRow}>
                <span>Transaction:</span>
                <a 
                  href={`http://localhost:8545`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Local Network
                </a>
              </div>
            </div>

            <button onClick={onClose} style={styles.button}>
              Done
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
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
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
  content: {
    paddingTop: '20px'
  },
  eventSummary: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  price: {
    fontSize: '1.5em',
    fontWeight: '700',
    color: '#667eea',
    marginTop: '8px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer'
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  secureNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9em',
    marginTop: '16px'
  },
  processing: {
    textAlign: 'center',
    padding: '40px 0'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px'
  },
  note: {
    color: '#999',
    fontSize: '0.9em'
  },
  success: {
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
  ticketDetails: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '24px 0',
    textAlign: 'left'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e0e0e0'
  },
  value: {
    fontWeight: '600'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none'
  },
  qrContainer: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '24px 0'
  },
  qrImage: {
    width: '200px',
    height: '200px',
    display: 'block',
    margin: '0 auto'
  },
  qrNote: {
    color: '#666',
    fontSize: '0.9em',
    marginTop: '12px',
    textAlign: 'center'
}
};

export default TicketPurchase;