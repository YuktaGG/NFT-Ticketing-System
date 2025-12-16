import React, { useState, useEffect } from 'react';

const WalletConnect = ({ onConnect, onDisconnect }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const account = accounts[0];
        setAccount(account);
        onConnect({ address: account });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to use this application!');
        return;
      }

      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const account = accounts[0];
      setAccount(account);
      onConnect({ address: account });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    onDisconnect();
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div style={styles.container}>
      {!account ? (
        <button 
          onClick={connectWallet} 
          disabled={loading}
          style={styles.connectButton}
        >
          {loading ? 'Connecting...' : '🦊 Connect Wallet'}
        </button>
      ) : (
        <div style={styles.connectedContainer}>
          <div style={styles.accountInfo}>
            <span style={styles.dot}>●</span>
            <span style={styles.address}>{formatAddress(account)}</span>
          </div>
          <button 
            onClick={disconnectWallet}
            style={styles.disconnectButton}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center'
  },
  connectButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  connectedContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#f0f0f0',
    borderRadius: '8px'
  },
  dot: {
    color: '#4caf50',
    fontSize: '12px'
  },
  address: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '600'
  },
  disconnectButton: {
    padding: '10px 16px',
    background: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default WalletConnect;