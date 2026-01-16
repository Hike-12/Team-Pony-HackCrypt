import { useState, useEffect } from 'react';

export const useSidebarState = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Listen for sidebar toggle events
    const handleSidebarToggle = (e) => {
      setIsExpanded(e.detail.isExpanded);
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    // Get initial state
    const initialState = localStorage.getItem('sidebar-expanded');
    if (initialState !== null) {
      setIsExpanded(initialState === 'true');
    }

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  return isExpanded;
};