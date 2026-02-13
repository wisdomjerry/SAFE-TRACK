import { useState, useEffect } from 'react';
import api from '../api/axios'; // Your custom axios instance

export const useUser = () => {
  const [userData, setUserData] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUserData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user from DB");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { userData, loading };
};