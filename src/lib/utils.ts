import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeStyle: "short",
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status) {
    case "HADIR":
      return "text-green-600 bg-green-100";
    case "TERLAMBAT":
      return "text-yellow-600 bg-yellow-100";
    case "IZIN":
    case "SAKIT":
    case "CUTI":
      return "text-blue-600 bg-blue-100";
    case "ALPA":
      return "text-red-600 bg-red-100";
    case "PENDING":
      return "text-yellow-600 bg-yellow-100";
    case "DISETUJUI":
      return "text-green-600 bg-green-100";
    case "DITOLAK":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getRoleLabel(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "HR":
      return "HR";
    case "MANAGER":
      return "Manager";
    case "KARYAWAN":
      return "Karyawan";
    default:
      return role;
  }
}

export function calculateLateMinutes(
  checkInTime: Date,
  shiftStart: string,
  gracePeriod: number
) {
  const [hours, minutes] = shiftStart.split(":").map(Number);
  const shiftStartDate = new Date(checkInTime);
  shiftStartDate.setHours(hours, minutes, 0, 0);
  const graceEnd = new Date(shiftStartDate.getTime() + gracePeriod * 60000);
  if (checkInTime <= graceEnd) return 0;
  return Math.round(
    (checkInTime.getTime() - shiftStartDate.getTime()) / 60000
  );
}

export function getWIBRange() {
  const now = new Date();
  // Shift now by +7 hours to represent it in WIB timezone
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  // Zero out the hours, minutes, seconds, milliseconds in UTC presentation (which represents midnight WIB)
  wibTime.setUTCHours(0, 0, 0, 0);
  // Shift back by 7 hours to get the actual UTC time of midnight WIB
  const startOfDay = new Date(wibTime.getTime() - 7 * 60 * 60 * 1000);
  // The end of the WIB day is exactly 24 hours after the start of the WIB day
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return { startOfDay, endOfDay };
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusMeters;
}

