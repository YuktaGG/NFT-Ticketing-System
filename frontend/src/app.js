import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import EventList from './components/EventList';
import TicketPurchase from './components/TicketPurchase';
import './App.css';

function App() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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
    alert(`Ticket purchased successfully! Token ID: ${ticket.tokenId}\n\nCheck MetaMask NFTs tab to see your ticket!`);
    setShowPurchaseModal(false);
    setSelectedEvent(null);
  };

  const handleClosePurchase = () => {
    setShowPurchaseModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>🎫 NFT Ticketing</h1>
            <p className="tagline">Blockchain-Powered Event Tickets</p>
          </div>
          
          <WalletConnect 
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
          />
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