import { type DefaultSession } from "next-auth";

export type Role = "SUPER_ADMIN" | "HR" | "MANAGER" | "KARYAWAN";
export type LeaveType = "CUTI_TAHUNAN" | "CUTI_SAKIT" | "CUTI_KELUARGA" | "CUTI_HAID" | "CUTI_MELAHIRKAN" | "CUTI_IBADAH" | "CUTI_LAINNYA";
export type LeaveStatus = "PENDING" | "DISETUJUI" | "DITOLAK";
export type VerifikasiStatus = "AMAN" | "BERBOHONG";

export type UserRole = Role;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      nomorInduk: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
    nomorInduk: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    nomorInduk: string;
  }
}
