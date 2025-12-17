import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import EventList from './components/EventList';
import TicketPurchase from './components/TicketPurchase';
import QRScannerPage from './components/QRScannerPage';
import './App.css';

function App() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleWalletConnect = (info) => {
    setWalletInfo(info);
    console.log('Wallet connected:', info);
  };

  const handleWalletDisconnect = () => {
    setWalletInfo(null);
    console.log('Wallet disconnected');
  };

  const handleSelectEvent = (event) => {
    if (!walletInfo) {
      alert('Please connect your wallet first!');
      return;
    }
    setSelectedEvent(event);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = (ticket) => {
    console.log('Ticket purchased:', ticket);
    alert(`Ticket purchased successfully! Token ID: ${ticket.tokenId}\n\nQR Code: ${ticket.qrCode}\n\nUse "Scan QR" to verify this ticket!`);
    setShowPurchaseModal(false);
    setSelectedEvent(null);
  };

  const handleClosePurchase = () => {
    setShowPurchaseModal(false);
    setSelectedEvent(null);
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // If scanner is open, show scanner page
  if (showScanner) {
    return (
      <QRScannerPage 
        walletAddress={walletInfo?.address}
        onBack={handleCloseScanner}
      />
    );
  }

  // Otherwise show main app
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>🎫 NFT Ticketing</h1>
            <p className="tagline">Blockchain-Powered Event Tickets</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={handleOpenScanner}
              style={{
                padding: '12px 24px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📱 Scan QR
            </button>
            <WalletConnect 
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="main-content">
        {!walletInfo && (
          <div className="connect-prompt">
            <div className="prompt-card">
              <h2>Welcome to NFT Ticketing</h2>
              <p>Connect your wallet to start buying tickets</p>
              <ul>
                <li>✅ Secure NFT-based tickets</li>
                <li>✅ Resell with price protection</li>
                <li>✅ Instant QR validation</li>
                <li>✅ Royalties for organizers</li>
              </ul>
            </div>
          </div>
        )}

        {walletInfo && (
          <EventList onSelectEvent={handleSelectEvent} />
        )}
      </main>

      {showPurchaseModal && selectedEvent && (
        <TicketPurchase
          event={selectedEvent}
          walletAddress={walletInfo?.address}
          onClose={handleClosePurchase}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      <footer className="app-footer">
        <p>Built with React, Node.js, and Ethereum</p>
        <p>Running on Local Hardhat Network</p>
      </footer>
    </div>
  );
}

export default App;