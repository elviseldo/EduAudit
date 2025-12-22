import { useEffect, useState } from 'react';

export function useSchool() {
  const [school, setSchool] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSchool') || 'millennium';
    }
    return 'millennium';
  });

  const selectSchool = (schoolId: string) => {
    localStorage.setItem('selectedSchool', schoolId);
    setSchool(schoolId);
  };

  const resetSchool = () => {
    localStorage.removeItem('selectedSchool');
    setSchool('millennium');
  };

  return { school, selectSchool, resetSchool };
}
