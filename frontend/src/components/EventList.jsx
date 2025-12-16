import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EventList = ({ onSelectEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/events`);
      setEvents(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <button onClick={fetchEvents} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <h2>No Events Available</h2>
        <p>Check back later for upcoming events!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Available Events</h2>
      <div style={styles.eventGrid}>
        {events.map((event) => (
          <div key={event._id} style={styles.eventCard}>
            <div style={styles.eventHeader}>
              <h3 style={styles.eventName}>{event.name}</h3>
              <span style={styles.eventPrice}>${event.ticketPrice}</span>
            </div>
            
            <div style={styles.eventDetails}>
              <p style={styles.eventLocation}>📍 {event.location}</p>
              <p style={styles.eventDate}>
                📅 {new Date(event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p style={styles.eventTime}>
                🕐 {new Date(event.eventDate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div style={styles.ticketInfo}>
              <span style={styles.ticketsAvailable}>
                {event.totalTickets - event.ticketsSold} / {event.totalTickets} available
              </span>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(event.ticketsSold / event.totalTickets) * 100}%`
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => onSelectEvent(event)}
              disabled={event.ticketsSold >= event.totalTickets}
              style={
                event.ticketsSold >= event.totalTickets 
                  ? styles.buttonDisabled 
                  : styles.buyButton
              }
            >
              {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Buy Ticket'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  title: {
    fontSize: '2em',
    marginBottom: '30px',
    textAlign: 'center'
  },
  eventGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  },
  eventCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
    }
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '16px'
  },
  eventName: {
    fontSize: '1.3em',
    margin: 0,
    flex: 1
  },
  eventPrice: {
    fontSize: '1.5em',
    fontWeight: '700',
    color: '#667eea'
  },
  eventDetails: {
    marginBottom: '20px'
  },
  eventLocation: {
    margin: '8px 0',
    color: '#666'
  },
  eventDate: {
    margin: '8px 0',
    color: '#666'
  },
  eventTime: {
    margin: '8px 0',
    color: '#666'
  },
  ticketInfo: {
    marginBottom: '16px'
  },
  ticketsAvailable: {
    fontSize: '0.9em',
    color: '#666',
    display: 'block',
    marginBottom: '8px'
  },
  progressBar: {
    height: '6px',
    background: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.3s'
  },
  buyButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  buttonDisabled: {
    width: '100%',
    padding: '12px',
    background: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px'
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
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  errorText: {
    color: '#c33',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  }
};

export default EventList;