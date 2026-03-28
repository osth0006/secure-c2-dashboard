'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface WSMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface UseWebSocketReturn {
  lastMessage: WSMessage | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

const MAX_BACKOFF = 30000;

export function useWebSocket(url: string): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        backoffRef.current = 1000;

        // Ping every 30s to keep alive
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type) {
            setLastMessage(msg);
          }
        } catch {
          // Ignore non-JSON messages (like "pong")
        }
      };

      ws.onclose = () => {
        setConnectionStatus('reconnecting');
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setConnectionStatus('reconnecting');
      scheduleReconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const scheduleReconnect = useCallback(() => {
    const delay = backoffRef.current;
    backoffRef.current = Math.min(delay * 2, MAX_BACKOFF);
    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { lastMessage, connectionStatus };
}
