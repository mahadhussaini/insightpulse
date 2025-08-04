'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setMounted(true);
    
    // Try to get user from localStorage directly to avoid dependency on AuthContext
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // You can decode the token or make a simple API call to get user info
        // For now, we'll just set a basic user object
        setUser({ id: 'temp-user-id' });
      }
    } catch (error) {
      console.log('No user token found');
    }
  }, []);

  const connect = () => {
    if (!mounted) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Only connect if we have a token
    if (!token) {
      console.log('No token available, skipping socket connection');
      return;
    }
    
    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join user's dashboard room
      newSocket.emit('join-dashboard', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for real-time updates
    newSocket.on('feedback-updated', (data) => {
      console.log('Feedback updated:', data);
      // You can emit a custom event or use a state management solution
      // to update the UI with the new feedback data
    });

    newSocket.on('new-feedback', (data) => {
      console.log('New feedback received:', data);
      // Handle new feedback notification
    });

    newSocket.on('sentiment-alert', (data) => {
      console.log('Sentiment alert:', data);
      // Handle sentiment alerts
    });

    newSocket.on('dashboard-update', (data) => {
      console.log('Dashboard update:', data);
      // Handle dashboard updates
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Connect when component is mounted and token is available
  useEffect(() => {
    if (mounted && !socket) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        connect();
      }
    }
  }, [mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
} 