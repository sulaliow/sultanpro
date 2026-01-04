
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string;
  department: string;
  joinedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'late' | 'half-day';
  location?: {
    lat: number;
    lng: number;
  };
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  attendance: AttendanceRecord[];
}
