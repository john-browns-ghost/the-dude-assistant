'use client';

import { useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <main className="h-full flex flex-col bg-brody-bg">
      <ChatInterface />
    </main>
  );
}
