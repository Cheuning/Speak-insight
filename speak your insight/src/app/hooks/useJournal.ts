import { useState, useEffect } from 'react';

export interface JournalRecord {
  id: string;
  title: string;
  transcript: string;
  date: string;
  createdAt: number;
  duration?: number;
}

const STORAGE_KEY = 'diary_records_v1';

export function useJournal() {
  const [records, setRecords] = useState<JournalRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse records", e);
      }
    }
  }, []);

  const saveRecord = (record: JournalRecord) => {
    setRecords(prev => {
      const newRecords = [record, ...prev].sort((a, b) => b.createdAt - a.createdAt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => {
      const newRecords = prev.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      return newRecords;
    });
  };

  return {
    records,
    saveRecord,
    deleteRecord
  };
}
