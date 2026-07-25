import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { User } from '../types';

const API_URL = '/api';

interface StaffContextType {
  users: User[];
  addUser: (user: User) => Promise<boolean>;
  updateUser: (user: User) => Promise<boolean>;
  removeUser: (id: string) => Promise<boolean>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);

  const addUser = async (user: User): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) { setUsers(prev => [...prev, user]); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateUser = async (user: User): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) { setUsers(prev => prev.map(u => u.id === user.id ? user : u)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const removeUser = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) { setUsers(prev => prev.filter(u => u.id !== id)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <StaffContext.Provider value={{ users, addUser, updateUser, removeUser, setUsers }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within a StaffProvider");
  return context;
};
