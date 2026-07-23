import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (keep only structure tables + users)
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const deptIT = await prisma.department.create({
    data: { nama: 'IT', deskripsi: 'Teknologi Informasi' },
  });
  const deptHR = await prisma.department.create({
    data: { nama: 'HR', deskripsi: 'Human Resources' },
  });
  const deptFinance = await prisma.department.create({
    data: { nama: 'Finance', deskripsi: 'Keuangan' },
  });
  const deptMarketing = await prisma.department.create({
    data: { nama: 'Marketing', deskripsi: 'Pemasaran' },
  });
  const deptOperasional = await prisma.department.create({
    data: { nama: 'Operasional', deskripsi: 'Operasional' },
  });
  console.log('✅ Departments created');

  // Create Shifts
  const shiftPagi = await prisma.shift.create({
    data: { nama: 'Pagi', jamMasuk: '08:00', jamPulang: '17:00', toleransi: 15 },
  });
  const shiftSiang = await prisma.shift.create({
    data: { nama: 'Siang', jamMasuk: '13:00', jamPulang: '22:00', toleransi: 15 },
  });
  const shiftMalam = await prisma.shift.create({
    data: { nama: 'Malam', jamMasuk: '22:00', jamPulang: '07:00', toleransi: 15 },
  });
  const shiftFlexible = await prisma.shift.create({
    data: { nama: 'Flexible', jamMasuk: '09:00', jamPulang: '18:00', toleransi: 30 },
  });
  console.log('✅ Shifts created');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const hrPassword = await bcrypt.hash('hr123', 12);
  const managerPassword = await bcrypt.hash('mgr123', 12);
  const karyawanPassword = await bcrypt.hash('kry123', 12);

  // Create Users
  await prisma.user.create({
    data: {
      nomorInduk: 'SA001',
      email: 'superadmin@absensi.app',
      password: adminPassword,
      nama: 'Super Admin',
      role: 'SUPER_ADMIN',
      jabatan: 'Direktur Utama',
      noTelpon: '081234567890',
      alamat: 'Jl. Kantor No. 1, Jakarta',
      departmentId: deptIT.id,
      shiftId: shiftPagi.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      nomorInduk: 'HR001',
      email: 'hr@absensi.app',
      password: hrPassword,
      nama: 'Ayu Lestari',
      role: 'HR',
      jabatan: 'Kepala HRD',
      noTelpon: '081234567891',
      alamat: 'Jl. HR No. 1, Jakarta',
      departmentId: deptHR.id,
      shiftId: shiftPagi.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      nomorInduk: 'MGR001',
      email: 'manager@absensi.app',
      password: managerPassword,
      nama: 'Bambang Suprapto',
      role: 'MANAGER',
      jabatan: 'Manager IT',
      noTelpon: '081234567892',
      alamat: 'Jl. Manager No. 1, Jakarta',
      departmentId: deptIT.id,
      shiftId: shiftPagi.id,
      isActive: true,
    },
  });

  // Create Karyawan
  const karyawanData = [
    // Original 10 sample karyawan
    { nomorInduk: 'KRY001', nama: 'Citra Dewi', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY002', nama: 'Dedi Kurniawan', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY003', nama: 'Eka Fitriani', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY004', nama: 'Fajar Ramadhan', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY005', nama: 'Gita Pratama', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftSiang },
    { nomorInduk: 'KRY006', nama: 'Hendra Gunawan', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftMalam },
    { nomorInduk: 'KRY007', nama: 'Indah Permata', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY008', nama: 'Joko Susilo', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftSiang },
    { nomorInduk: 'KRY009', nama: 'Kiki Amalia', jabatan: 'Staff HR', dept: deptHR, shift: shiftFlexible },
    { nomorInduk: 'KRY010', nama: 'Lukman Hakim', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    // 66 Karyawan baru
    { nomorInduk: 'KRY011', nama: 'MUHAMMAD BHIMANTARA WIRA EKA PUTRA', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY012', nama: 'LINTANG SHANDY LANANG SEJATI', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY013', nama: 'SALSA ARISYA ARIMBI', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY014', nama: 'MAULANA ADI HENDYANSYAH', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY015', nama: 'ARFAN RESTU RACHMATDHANI', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY016', nama: 'LINDA LAURA', jabatan: 'Staff IT', dept: deptIT, shift: shiftSiang },
    { nomorInduk: 'KRY017', nama: "ABDUL A'LA BANGSAWAN BAVANA PARISI", jabatan: 'Staff HR', dept: deptHR, shift: shiftSiang },
    { nomorInduk: 'KRY018', nama: 'DINDA NUR AISYAH', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY019', nama: 'BIMA MAULANA PUTRA SETIAWAN', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY020', nama: 'STEFANY ANABEL TUYU', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftSiang },
    { nomorInduk: 'KRY021', nama: 'DAVINZA NAUFAL FAHRURRAMADHAN', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY022', nama: 'MUH RIZAT MAULANA BAYUSEJATI', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY023', nama: 'MOH FARHAN ADIEN ALFAHREZY', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftMalam },
    { nomorInduk: 'KRY024', nama: 'ALMIRA LEONY TUNGGA DEWI', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY025', nama: 'SHINTA AYUNDA ARERIA', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY026', nama: 'SUCI ANITA', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY027', nama: 'RAISSA NARARYA ANGGARA', jabatan: 'Staff HR', dept: deptHR, shift: shiftFlexible },
    { nomorInduk: 'KRY028', nama: 'SABRINA RIZKY ANISA', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY029', nama: 'DEANISSA SHERLY SABILLA', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftSiang },
    { nomorInduk: 'KRY030', nama: 'ZARAH NAILATUL PRITAMA', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY031', nama: 'KEVIN ANANDA ADITIYA PRATAMA', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY032', nama: 'IQBAL ARGA MARTADINATA', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY033', nama: 'MUHAMMAD DAFA AMWALUDDIN', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftSiang },
    { nomorInduk: 'KRY034', nama: 'MOCHAMMAD IRSHAD ARASY', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY035', nama: 'RUSTU MAULANA', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftMalam },
    { nomorInduk: 'KRY036', nama: 'OLIVIA RISTA', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY037', nama: 'BIMA SETYA NUGRAHA KURNIAWAN', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY038', nama: 'M. FATIH AL GHIFARY', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY039', nama: 'DANICA NASYWA PUTRINIAR', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY040', nama: "MOHAMMAD SYIFA'UL FAJ ISMUNIR", jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftFlexible },
    { nomorInduk: 'KRY041', nama: 'GWIDO PUTRA WIJAYA', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY042', nama: 'LUTHFI PUTRA MAHARDIKA', jabatan: 'Staff HR', dept: deptHR, shift: shiftSiang },
    { nomorInduk: 'KRY043', nama: 'MALIK ADZANO ARYASATYA DHARMAPUTERA', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY044', nama: 'NADYA HAPSARI PUTRI', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY045', nama: 'MOCHAMMAD WYLDAN DAFRIANSYAH', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY046', nama: "MUHAMMAD ULIL FAHMI MA'RIFATULLOH", jabatan: 'Staff IT', dept: deptIT, shift: shiftSiang },
    { nomorInduk: 'KRY047', nama: 'ROCKY ALESSANDRO KRISTANTO', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY048', nama: 'MOHAMMAD SYAIFUDIN ZAKARIA', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY049', nama: 'MUHAMMAD AINNUR LATIF BOSTOMI', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY050', nama: 'MUHAMMAD ZAKI TSAQIF KHOIRULLAH', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftSiang },
    { nomorInduk: 'KRY051', nama: 'MUHAMMAD ASHERIL RIZKY YULIANSYAH', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY052', nama: 'ASLAM ROSUL AHMAD', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY053', nama: 'ALFIN AFRIANSYAH', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftFlexible },
    { nomorInduk: 'KRY054', nama: 'AGUNG SATRIA WIBAWA ARIFIN', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY055', nama: 'MUHAMAD ALFAQIH AHNAF', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY056', nama: 'CINDY HARIATI SYAPUTRI', jabatan: 'Staff IT', dept: deptIT, shift: shiftMalam },
    { nomorInduk: 'KRY057', nama: 'HIFNA WARDATUN NAZWA', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY058', nama: 'ANGGA AHMAD ROMANSA', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY059', nama: 'ENGGITA SEPTIANA NADEAK', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftSiang },
    { nomorInduk: 'KRY060', nama: 'DEWI SULISTIYOWATI', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY061', nama: 'IVANSYAH EKA OKTAVIADI SANTOSO', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY062', nama: 'ALYSSA TIFARA YUWONO', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY063', nama: 'MUHAMMAD SHIROJUL MUNIR', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY064', nama: 'ALVI CHOIRINNIKMAH', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY065', nama: 'MAULANA ZULFIKAR KHASBULLOH', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY066', nama: 'QUEENSHA LOVELY KRISTIANDI', jabatan: 'Staff IT', dept: deptIT, shift: shiftSiang },
    { nomorInduk: 'KRY067', nama: 'ANGELA PUTRI KEZIA SYAFRANIE', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY068', nama: 'SAKA NABIL', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftPagi },
    { nomorInduk: 'KRY069', nama: 'TIONUSA CATUR PAMUNGKAS', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftFlexible },
    { nomorInduk: 'KRY070', nama: 'DEWITA ANGGRAINI', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY071', nama: 'MARISKA PUTRI', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
    { nomorInduk: 'KRY072', nama: 'NADIA RAHMA KAMILA', jabatan: 'Staff HR', dept: deptHR, shift: shiftPagi },
    { nomorInduk: 'KRY073', nama: 'AFRIZAL QURRATUL FAIZIN', jabatan: 'Staff Finance', dept: deptFinance, shift: shiftSiang },
    { nomorInduk: 'KRY074', nama: 'MAULANA RENGGA RAMADAN', jabatan: 'Staff Marketing', dept: deptMarketing, shift: shiftPagi },
    { nomorInduk: 'KRY075', nama: 'FAIZA ANATHASYA EKA FALEN', jabatan: 'Staff Operasional', dept: deptOperasional, shift: shiftPagi },
    { nomorInduk: 'KRY076', nama: 'RIZKI MAULANA PUTRA SUGI IRAWAN', jabatan: 'Staff IT', dept: deptIT, shift: shiftPagi },
  ];

  const createdKaryawan = [];
  for (let i = 0; i < karyawanData.length; i++) {
    const k = karyawanData[i];
    const user = await prisma.user.create({
      data: {
        nomorInduk: k.nomorInduk,
        email: `${k.nomorInduk.toLowerCase()}@absensi.app`,
        password: karyawanPassword,
        nama: k.nama,
        role: 'KARYAWAN',
        jabatan: k.jabatan,
        noTelpon: `08123456789${i}`,
        alamat: `Jl. Karyawan No. ${i + 1}, Jakarta`,
        departmentId: k.dept.id,
        shiftId: k.shift.id,
        isActive: true,
      },
    });
    createdKaryawan.push(user);
  }
  console.log(`✅ ${createdKaryawan.length} Karyawan created`);

  console.log('✅ Locations skipped (no dummy data)');
  console.log('✅ Attendances skipped (no dummy data)');
  console.log('✅ Leave requests skipped (no dummy data)');
  console.log('');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📋 Akun yang tersedia:');
  console.log('   Super Admin : SA001 / admin123');
  console.log('   HR          : HR001 / hr123');
  console.log('   Manager     : MGR001 / mgr123');
  console.log('   Karyawan    : KRY001 - KRY076 / kry123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
