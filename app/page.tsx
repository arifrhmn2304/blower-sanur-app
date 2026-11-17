"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  HardHat,
  Info,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  Receipt,
  Send,
  ShieldCheck,
  Trash,
  Truck,
  Users,
  Wallet,
  Sun,
  Moon,
  CircleExclamationPoint,
} from 'lucide-react';
import { db, ref, onValue, update, remove } from '@/lib/firebase';
import TabFormJob from '../components/TabFormJob';
import TabDashboard from '../components/TabDashboard';
import TabPengeluaran from '../components/TabPengeluaran';
import TabVendor from '../components/TabVendor';
import TabRiwayat from '../components/TabRiwayat';
import KaryawanView from '../components/KaryawanView';
import AuthBrandPanel from '../components/AuthBrandPanel';
import BrandMark from '../components/BrandMark';

const NAV_ITEMS = [
  { id: 'pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'form', label: 'Home', icon: ClipboardList },
  { id: 'vendor', label: 'Vendor', icon: Users },
  { id: 'riwayat', label: 'Riwayat', icon: Clock },
];

type ToastType = 'success' | 'error' | 'info';

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [pinOwner, setPinOwner] = useState('');
  const [showPassModal, setShowPassModal] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  const [currentSelectedBulan, setCurrentSelectedBulan] = useState('01');
  const [currentSelectedTahun, setCurrentSelectedTahun] = useState('2026');

  const [globalData, setGlobalData] = useState<any[]>([]);
  const [globalPengeluaran, setGlobalPengeluaran] = useState<any[]>([]);

  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  const [selectedKurir, setSelectedKurir] = useState('');
  const [showDetailKurir, setShowDetailKurir] = useState(false);
  const [showPelunasanKurir, setShowPelunasanKurir] = useState(false);
  const [waInput, setWaInput] = useState('');

  const [selectedVendor, setSelectedVendor] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showConfirmHapus, setShowConfirmHapus] = useState(false);
  const [idTransaksiHapus, setIdTransaksiHapus] = useState<string | null>(null);

  useEffect(() => {
    const tglSekarang = new Date();
    setCurrentSelectedBulan(String(tglSekarang.getMonth() + 1).padStart(2, '0'));
    setCurrentSelectedTahun(String(tglSekarang.getFullYear()));

    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }

    const rootRef = ref(db, '/');
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      const listJob: any[] = [];
      const listExp: any[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          if (key === 'pengeluaran' && typeof data[key] === 'object') {
            Object.keys(data[key]).forEach((pKey) => listExp.push({ ...data[key][pKey], firebaseKey: pKey }));
          } else if (typeof data[key] === 'object' && data[key] !== null && data[key].id) {
            listJob.push({ ...data[key], firebaseKey: key });
          }
        });
      }
      setGlobalData(listJob);
      setGlobalPengeluaran(listExp);
    });

    return () => unsubscribe();
  }, []);

  const handlePilihRole = (role: string) => {
    if (role === 'KARYAWAN') {
      setUserRole('KARYAWAN');
      localStorage.setItem('userRole', 'KARYAWAN');
      showToast('Masuk sebagai Karyawan', 'success');
    } else if (role === 'OWNER') {
      setShowPassModal(true);
    }
  };

  const handleVerifikasiPIN = () => {
    if (pinOwner === '212121') {
      setUserRole('OWNER');
      localStorage.setItem('userRole', 'OWNER');
      setShowPassModal(false);
      setPinOwner('');
      showToast('Berhasil masuk sebagai Owner!', 'success');
    } else {
      showToast('PIN Owner salah!', 'error');
      setPinOwner('');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
    setActiveTab('form');
    showToast('Berhasil Logout', 'info');
  };

  const parseStandardDate = (rawDate: string) => {
    if (!rawDate) return null;
    let str = String(rawDate);
    if (str.includes('T')) str = str.split('T')[0];
    const p = str.split('-');
    if (p.length === 3 && p[0].length === 4) return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTanggal = (rawDate: string) => {
    const d = parseStandardDate(rawDate);
    if (!d) return '-';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  };

  const cleanNumber = (valStr: string) => {
    if (!valStr) return 0;
    return parseInt(String(valStr).replace(/[^0-9]/g, ''), 10) || 0;
  };

  // Logika Kurir
  const detailJobsKurir: any[] = [];
  let totalGajiKurirDetail = 0;
  if ((showDetailKurir || showPelunasanKurir) && selectedKurir) {
    const keyK = selectedKurir.replace(/[^a-zA-Z0-9]/g, '_');
    globalData.forEach((item) => {
      const d = parseStandardDate(item.tanggal);
      if (!d) return;
      const itemBulan = String(d.getMonth() + 1).padStart(2, '0');
      const itemTahun = String(d.getFullYear());

      if ((currentSelectedBulan === 'ALL' || itemBulan === currentSelectedBulan) && itemTahun === currentSelectedTahun) {
        if (!item[`lunas_${keyK}`] && item.statusKurir !== 'LUNAS') {
          const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean);
          const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean);
          const unit = item.jumlahUnit || 1;

          const tarifAntar = (unit * 30000) / (kAntar.length || 1);
          const tarifJemput = (unit * 20000) / (kJemput.length || 1);

          const isAntar = kAntar.includes(selectedKurir);
          const isJemput = kJemput.includes(selectedKurir);

          if (isAntar || isJemput) {
            const peranArr = [];
            let totalNominal = 0;

            if (isAntar) {
              const partnerAntar = kAntar.filter((k) => k !== selectedKurir).join(' & ');
              peranArr.push(partnerAntar ? `Antar (Bersama: ${partnerAntar})` : 'Antar (Sendiri)');
              totalNominal += tarifAntar;
            }
            if (isJemput) {
              const partnerJemput = kJemput.filter((k) => k !== selectedKurir).join(' & ');
              peranArr.push(partnerJemput ? `Jemput (Bersama: ${partnerJemput})` : 'Jemput (Sendiri)');
              totalNominal += tarifJemput;
            }

            detailJobsKurir.push({
              id: item.id,
              tanggal: item.tanggal,
              alamat: item.alamat,
              unit,
              peran: peranArr.join(', '),
              nominal: totalNominal,
            });
            totalGajiKurirDetail += totalNominal;
          }
        }
      }
    });
    detailJobsKurir.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));
  }

  const eksekusiPelunasan = async (kirimWA: boolean) => {
    if (!selectedKurir) return;
    if (kirimWA && waInput.trim() === '') {
      showToast('Isi nomor WhatsApp dulu untuk mengirim via WA.', 'error');
      document.getElementById('wa-kurir')?.focus();
      return;
    }
    const keyK = selectedKurir.replace(/[^a-zA-Z0-9]/g, '_');
    const updates: any = {};

    let textWA = `*REKAP GAJI BLOWER SANUR*\n👤 *${selectedKurir}*\n\n`;

    detailJobsKurir.forEach((j) => {
      textWA += `📅 *${formatTanggal(j.tanggal)}* (${j.unit} Unit)\n📍 Lokasi: ${j.alamat}\n🚚 Role: ${j.peran}\n💰 Upah: Rp ${j.nominal.toLocaleString('id-ID')}\n\n`;
    });

    textWA += `------------------------\n*TOTAL DITERIMA: Rp ${totalGajiKurirDetail.toLocaleString('id-ID')}* ✅\nTerima kasih atas kerja samanya!`;

    if (kirimWA && waInput.trim() !== '') {
      localStorage.setItem(`wa_kurir_${selectedKurir}`, waInput);
      let phone = waInput.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(textWA)}`;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    detailJobsKurir.forEach((job) => (updates[`/${job.id}/lunas_${keyK}`] = true));
    try {
      await update(ref(db), updates);
      showToast(`Status gaji untuk ${selectedKurir} berhasil LUNAS!`, 'success');
      setShowPelunasanKurir(false);
    } catch (e) {
      console.error(e);
      showToast('Gagal mengupdate database!', 'error');
    }
  };

  // Logika Vendor & Edit
  const vendorJobs = globalData.filter((x) => String(x.vendor || '').trim().toLowerCase() === selectedVendor.trim().toLowerCase());
  vendorJobs.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  const handleBukaDetailVendor = (nama: string) => {
    setSelectedVendor(nama);
    setShowVendorModal(true);
  };

  const handleBukaEditModal = (id: string) => {
    const item = globalData.find((x) => x.id === id);
    if (item) {
      setEditData({
        ...item,
        uangVendorStr: Number(item.uangVendor || 0).toLocaleString('id-ID'),
        sudahBayarStr: Number(item.sudahBayar || 0).toLocaleString('id-ID'),
        jmlAntar: item.kurirAntar2 ? '2' : '1',
        jmlJemput: item.kurirJemput2 ? '2' : '1',
      });
      setShowEditModal(true);
    }
  };

  const handleChangeEdit = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRupiahEdit = (field: string, val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    handleChangeEdit(field, raw ? Number(raw).toLocaleString('id-ID') : '');
  };

  const handleSimpanEdit = async () => {
    if (!editData) return;
    setIsUpdating(true);

    try {
      const uangVendor = cleanNumber(editData.uangVendorStr);
      const sudahBayar = cleanNumber(editData.sudahBayarStr);
      const sisaBayar = uangVendor - sudahBayar;
      const statusBayar = sisaBayar <= 0 ? 'LUNAS' : 'BELUM LUNAS';
      const totalOngkirKurir = (parseInt(editData.jumlahUnit) || 0) * 50000;

      const kA1 = (editData.kurirAntar1 || '').trim();
      const kA2 = editData.jmlAntar === '2' ? (editData.kurirAntar2 || '').trim() : '';
      const kJ1 = (editData.kurirJemput1 || '').trim();
      const kJ2 = editData.jmlJemput === '2' ? (editData.kurirJemput2 || '').trim() : '';

      let autoStatusUnit = 'Belum Diantar';
      if (kJ1 || kJ2) {
        autoStatusUnit = 'Selesai';
      } else if (kA1 || kA2) {
        autoStatusUnit = 'Sedang Dipakai';
      }

      const payload = {
        ...editData,
        uangVendor,
        sudahBayar,
        sisaBayar,
        statusBayar,
        totalOngkirKurir,
        statusUnit: autoStatusUnit,
        kurirAntar1: kA1,
        kurirAntar2: kA2,
        kurirJemput1: kJ1,
        kurirJemput2: kJ2,
      };

      delete payload.uangVendorStr;
      delete payload.sudahBayarStr;
      delete payload.jmlAntar;
      delete payload.jmlJemput;
      delete payload.firebaseKey;

      await update(ref(db, '/' + editData.id), payload);
      showToast('Data & status berhasil diperbarui!', 'success');
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      showToast('Gagal menyimpan pembaruan.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const listVendorUnik = Array.from(new Set(globalData.map((item) => item.vendor).filter(Boolean)));
  const listKurirUnik = Array.from(
    new Set(globalData.flatMap((item) => [item.kurirAntar1, item.kurirAntar2, item.kurirJemput1, item.kurirJemput2]).filter(Boolean))
  );

  const handleBukaDetailKurir = (nama: string) => {
    setSelectedKurir(nama);
    setShowDetailKurir(true);
  };

  const handleBukaPelunasanKurir = (nama: string) => {
    setSelectedKurir(nama);
    setWaInput(localStorage.getItem(`wa_kurir_${nama}`) || '');
    setShowPelunasanKurir(true);
  };

  const triggerHapusTransaksi = (id: string) => {
    setIdTransaksiHapus(id);
    setShowConfirmHapus(true);
  };

  const eksekusiHapusTransaksiFinal = async () => {
    if (!idTransaksiHapus) return;
    try {
      await remove(ref(db, '/' + idTransaksiHapus));
      showToast('Data transaksi berhasil dihapus!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal menghapus data transaksi.', 'error');
    } finally {
      setShowConfirmHapus(false);
      setIdTransaksiHapus(null);
    }
  };

  const activeMeta = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[2];
  const ActiveIcon = activeMeta.icon;
  const pageTitle =
    userRole === 'KARYAWAN'
      ? 'Portal Lapangan'
      : activeTab === 'dashboard'
        ? 'Keuangan'
        : activeTab === 'form'
          ? 'Tambah Job'
          : activeTab === 'pengeluaran'
            ? 'Pengeluaran'
            : activeTab === 'vendor'
              ? 'Vendor'
              : 'Riwayat';

  const pageDescription =
    userRole === 'KARYAWAN'
      ? 'Prioritas antar dan jemput unit dalam satu daftar kerja.'
      : activeTab === 'dashboard'
        ? 'Performa kas, piutang, dan gaji kurir pada periode terpilih.'
        : activeTab === 'form'
          ? 'Catat order sewa baru dan periksa ringkasannya sebelum disimpan.'
          : activeTab === 'pengeluaran'
            ? 'Kontrol biaya operasional tanpa kehilangan jejak pengeluaran.'
            : activeTab === 'vendor'
              ? 'Pantau nilai order dan status pembayaran setiap mitra.'
              : 'Telusuri transaksi, status unit, kurir, dan pembayaran.';

  return (
    <>
      {/* AUTH SCREEN */}
      {!userRole && (
        <div className="auth-screen">
          <div className="auth-visual">
            <div className="auth-meta">
              <span>Sanur Blower</span>
              <span className="live">Sistem online</span>
            </div>
            <div className="auth-visual-copy">
              <div className="rule" />
              <h1>
                Semua unit bergerak. <em>Satu layar.</em>
              </h1>
              <p>
                Catat job, atur kurir, dan pantau untung bersih operasional Blower Sanur —
                tanpa spreadsheet yang berantakan.
              </p>
            </div>
            <AuthBrandPanel />
          </div>

          <div className="auth-panel">
            <div className="brand-lockup">
              <div className="brand-mark">
                <BrandMark size={28} />
              </div>
              <div>
                <div className="brand-name">Blower Sanur</div>
                <div className="brand-sub">Operations suite</div>
              </div>
            </div>

            <h2 className="auth-title">Masuk ke Halaman</h2>
            <p className="auth-sub">Pilih peran akses. Owner memerlukan PIN Untuk Masuk.</p>

            <div className="role-list">
              <button className="role-card" onClick={() => handlePilihRole('OWNER')}>
                <span className="role-icon">
                  <ShieldCheck size={20} />
                </span>
                <span className="role-body">
                  <span className="role-title" style={{ display: 'block' }}>
                    Owner
                  </span>
                  <span className="role-desc" style={{ display: 'block' }}>
                    Akses penuh: kas, vendor, gaji kurir
                  </span>
                </span>
                <ArrowRight size={17} className="role-arrow" />
              </button>

              <button className="role-card" onClick={() => handlePilihRole('KARYAWAN')}>
                <span className="role-icon alt">
                  <HardHat size={20} />
                </span>
                <span className="role-body">
                  <span className="role-title" style={{ display: 'block' }}>
                    Karyawan
                  </span>
                  <span className="role-desc" style={{ display: 'block' }}>
                    Lihat tugas lapangan & isi data kurir
                  </span>
                </span>
                <ArrowRight size={17} className="role-arrow" />
              </button>
            </div>

            <div className="auth-foot">
              <span>v2.0 / 2026</span>
              <button onClick={toggleTheme} className="theme-toggle" aria-label="Ganti tema" title="Ganti tema terang/gelap">
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <span>Sanur · Collection</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN OWNER */}
      {showPassModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 380 }} role="dialog" aria-modal="true" aria-labelledby="pin-title">
            <div className="modal-title" id="pin-title">
              <KeyRound size={18} /> PIN Owner
            </div>
            <p className="modal-sub">Masukkan PIN untuk membuka akses penuh.</p>
            <input
              className="pin-input"
              type="password"
              value={pinOwner}
              onChange={(e) => setPinOwner(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifikasiPIN();
              }}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowPassModal(false);
                  setPinOwner('');
                }}
                className="btn btn-ghost"
              >
                <ArrowLeft size={15} /> Kembali
              </button>
              <button onClick={handleVerifikasiPIN} className="btn btn-primary">
                <Lock size={15} /> Buka
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP */}
      {userRole && (
        <div className="app-shell">
          <aside className="desktop-sidebar">
            <div className="sidebar-brand">
              <div className="brand-mark"><BrandMark size={27} /></div>
              <div>
                <div className="brand-name">Blower Sanur</div>
                <div className="brand-sub">{userRole === 'OWNER' ? 'Operations suite' : 'Field operations'}</div>
              </div>
            </div>

            <div className="sidebar-rule" />

            {userRole === 'OWNER' ? (
              <>
                <div className="sidebar-caption">Workspace <span>05</span></div>
                <nav className="sidebar-nav" aria-label="Navigasi desktop">
                  {NAV_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="sidebar-link"
                        data-active={activeTab === item.id}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                      >
                        <span className="sidebar-link-icon"><Icon size={18} strokeWidth={1.8} /></span>
                        <span>{item.label}</span>
                        <span className="sidebar-index">0{index + 1}</span>
                      </button>
                    );
                  })}
                </nav>
              </>
            ) : (
              <div className="sidebar-crew-note">
                <HardHat size={20} strokeWidth={1.7} />
                <p>Fokus pada unit yang perlu diantar dan dijemput hari ini.</p>
              </div>
            )}

            <div className="sidebar-spacer" />

            <section className="sidebar-status" aria-label="Status sistem">
              <div className="sidebar-caption">Live system <span className="status-pulse" /></div>
              <div className="sidebar-status-title">{userRole === 'OWNER' ? 'Database tersinkron' : 'Siap bertugas'}</div>
              <p>{userRole === 'OWNER' ? 'Perubahan operasional tampil secara realtime.' : 'Perubahan kurir langsung tersimpan ke sistem.'}</p>
              <div className="sidebar-metrics">
                <div>
                  <strong>{globalData.length}</strong>
                  <span>Total job</span>
                </div>
                <div>
                  <strong>{userRole === 'OWNER' ? globalPengeluaran.length : globalData.filter((item) => !item.kurirJemput1 && !item.kurirJemput2).length}</strong>
                  <span>{userRole === 'OWNER' ? 'Pengeluaran' : 'Job aktif'}</span>
                </div>
              </div>
            </section>

            <div className="sidebar-account">
              <span className="sidebar-avatar">{userRole === 'OWNER' ? 'OW' : 'KR'}</span>
              <span className="sidebar-account-copy">
                <strong>{userRole === 'OWNER' ? 'Owner' : 'Karyawan'}</strong>
                <small>{userRole === 'OWNER' ? 'Full access' : 'Field crew'}</small>
              </span>
              <button onClick={handleLogout} className="sidebar-logout" aria-label="Keluar dari akun" title="Keluar">
                <LogOut size={17} />
              </button>
            </div>
          </aside>

          <main className="app-wrapper">
            <header className="app-header">
              <div className="header-copy">
                <div className="mobile-brand"><BrandMark size={17} /><span>Blower Sanur</span></div>
                <div className="eyebrow">
                  {userRole === 'OWNER' ? (
                    <>
                      Owner <b>/</b> Console
                    </>
                  ) : (
                    <>
                      Field <b>/</b> Crew
                    </>
                  )}
                </div>
                <h1>
                  <ActiveIcon size={24} strokeWidth={1.8} />
                  {pageTitle}
                </h1>
                <p className="page-description">{pageDescription}</p>
              </div>
              <div className="header-actions">
                <span className="status-chip">
                  <span className="dot" />
                  {userRole}
                </span>
                <button onClick={toggleTheme} className="theme-toggle" aria-label="Ganti tema" title="Ganti tema terang/gelap">
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <button onClick={handleLogout} className="icon-btn mobile-logout" aria-label="Keluar dari akun" title="Keluar">
                  <LogOut size={17} />
                </button>
              </div>
            </header>

            {userRole === 'OWNER' ? (
              <>
                <nav className="tabbar" aria-label="Navigasi tablet">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="tab"
                        data-active={activeTab === item.id}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                      >
                        <Icon size={16} strokeWidth={1.9} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>

                <div key={activeTab} className="workspace-content animate-enter">
                  {activeTab === 'dashboard' && (
                    <TabDashboard
                      globalData={globalData}
                      globalPengeluaran={globalPengeluaran}
                      currentSelectedBulan={currentSelectedBulan}
                      currentSelectedTahun={currentSelectedTahun}
                      onBulanChange={setCurrentSelectedBulan}
                      onTahunChange={setCurrentSelectedTahun}
                      onBukaDetailKurir={handleBukaDetailKurir}
                      onBukaPelunasanKurir={handleBukaPelunasanKurir}
                    />
                  )}

                  {activeTab === 'form' && <TabFormJob listVendor={listVendorUnik} showToast={showToast} />}

                  {activeTab === 'pengeluaran' && (
                    <TabPengeluaran
                      globalPengeluaran={globalPengeluaran}
                      currentSelectedBulan={currentSelectedBulan}
                      currentSelectedTahun={currentSelectedTahun}
                      onBulanChange={setCurrentSelectedBulan}
                      onTahunChange={setCurrentSelectedTahun}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'vendor' && (
                    <TabVendor
                      globalData={globalData}
                      currentSelectedBulan={currentSelectedBulan}
                      currentSelectedTahun={currentSelectedTahun}
                      onBulanChange={setCurrentSelectedBulan}
                      onTahunChange={setCurrentSelectedTahun}
                      onBukaDetailVendor={handleBukaDetailVendor}
                    />
                  )}

                  {activeTab === 'riwayat' && (
                    <TabRiwayat
                      globalData={globalData}
                      currentSelectedBulan={currentSelectedBulan}
                      currentSelectedTahun={currentSelectedTahun}
                      onBulanChange={setCurrentSelectedBulan}
                      onTahunChange={setCurrentSelectedTahun}
                      onBukaEditModal={handleBukaEditModal}
                      onHapusData={triggerHapusTransaksi}
                      showToast={showToast}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="workspace-content animate-enter">
                <KaryawanView globalData={globalData} showToast={showToast} />
              </div>
            )}
          </main>
        </div>
      )}

      {/* BOTTOM NAV (mobile) */}
      {userRole === 'OWNER' && (
        <nav className="mobile-bottom-nav" aria-label="Navigasi bawah">
          <div className="mobile-nav-items">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                >
                  <Icon strokeWidth={1.9} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* MODAL RINCIAN JOB KURIR */}
      {showDetailKurir && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="kurir-detail-title">
            <div className="modal-title" id="kurir-detail-title">
              <Truck size={18} /> Rincian Job · {selectedKurir}
            </div>
            <p className="modal-sub">Job yang belum dilunasi pada periode terpilih.</p>

            <div style={{ maxHeight: '52dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
              {detailJobsKurir.length === 0 ? (
                <div className="empty-state">
                  <CircleCheck size={20} />
                  Tidak ada job yang belum dibayar.
                </div>
              ) : (
                detailJobsKurir.map((j, idx) => (
                  <div key={idx} className="list-row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="mono-label" style={{ color: 'var(--text-2)' }}>
                        {formatTanggal(j.tanggal)}
                      </div>
                      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12.5, marginTop: 3 }}>
                        <MapPin size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                        {j.alamat}
                      </div>
                      <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 3 }}>{j.peran}</div>
                    </div>
                    <div className="num" style={{ color: 'var(--accent-hi)', fontWeight: 600, fontSize: 13 }}>
                      Rp {j.nominal.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mono-label">Total gaji</span>
              <span className="num text-good" style={{ fontSize: 20, fontWeight: 600 }}>
                Rp {totalGajiKurirDetail.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowDetailKurir(false)} className="btn">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PELUNASAN KURIR */}
      {showPelunasanKurir && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400 }} role="dialog" aria-modal="true" aria-labelledby="kurir-pay-title">
            <div className="modal-title" id="kurir-pay-title">
              <Banknote size={18} /> Pelunasan · {selectedKurir}
            </div>
            <p className="modal-sub">Gaji yang akan ditandai lunas pada periode ini.</p>

            <div
              style={{
                border: '1px solid var(--line)',
                background: 'rgba(8,13,19,.6)',
                borderRadius: 'var(--radius)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <span className="mono-label">Total gaji</span>
                <span className="num text-accent" style={{ fontSize: 21, fontWeight: 600 }}>
                  Rp {totalGajiKurirDetail.toLocaleString('id-ID')}
                </span>
              </div>
              <label className="label" htmlFor="wa-kurir">
                Kirim via WA · opsional
              </label>
              <input
                id="wa-kurir"
                type="tel"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="08123456789"
                className="field"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button onClick={() => eksekusiPelunasan(true)} className="btn btn-primary btn-block">
                <Send size={15} /> Kirim WA & Lunaskan
              </button>
              <button onClick={() => eksekusiPelunasan(false)} className="btn btn-good btn-block">
                <Check size={15} /> Tandai Lunas Saja
              </button>
              <button onClick={() => setShowPelunasanKurir(false)} className="btn btn-ghost btn-block">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORI VENDOR */}
      {showVendorModal && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="vendor-title">
            <div className="modal-title" id="vendor-title">
              <Users size={18} /> Histori · {selectedVendor}
            </div>
            <p className="modal-sub">Riwayat order dan status pembayaran vendor.</p>

            <div style={{ maxHeight: '54dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
              {vendorJobs.length === 0 ? (
                <div className="empty-state">
                  <Info size={20} />
                  Tidak ada riwayat untuk vendor ini.
                </div>
              ) : (
                vendorJobs.map((o, idx) => {
                  const uVendor = Number(o.uangVendor) || 0;
                  const sBayar = Number(o.sudahBayar) || 0;
                  const sisa = Number(o.sisaBayar) || 0;
                  const isLunas = sisa <= 0;
                  return (
                    <div key={idx} className="list-row" style={{ alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="mono-label" style={{ color: 'var(--text-2)' }}>
                            {formatTanggal(o.tanggal)}
                          </span>
                          <span className={`badge ${isLunas ? 'badge-good' : 'badge-bad'}`}>{isLunas ? 'Lunas' : 'Belum'}</span>
                        </div>
                        <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12.5, marginTop: 4 }}>
                          {o.alamat} · {o.jumlahUnit} unit
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10.5, flexWrap: 'wrap' }}>
                          <span className="row-label">
                            Biaya <b style={{ color: 'var(--text)' }}>Rp {uVendor.toLocaleString('id-ID')}</b>
                          </span>
                          <span className="row-label">
                            Masuk <b className="text-good">Rp {sBayar.toLocaleString('id-ID')}</b>
                          </span>
                          <span className="row-label">
                            Sisa <b className="text-bad">Rp {sisa.toLocaleString('id-ID')}</b>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowVendorModal(false)} className="btn">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TRANSAKSI */}
      {showEditModal && editData && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            style={{ maxWidth: 540, maxHeight: '90dvh' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <div className="modal-title" id="edit-title">
              <Pencil size={18} /> Edit transaksi
            </div>
            <p className="modal-sub">Perbarui data job, pembayaran, dan tim kurir.</p>

            <div className="form-grid">
              <div className="span-2">
                <label className="label" htmlFor="edit-tanggal">
                  Tanggal peminjaman
                </label>
                <input
                  id="edit-tanggal"
                  type="date"
                  value={editData.tanggal}
                  onChange={(e) => handleChangeEdit('tanggal', e.target.value)}
                  className="field"
                />
              </div>

              <div className="span-2">
                <label className="label" htmlFor="edit-vendor">
                  Vendor
                </label>
                <input
                  id="edit-vendor"
                  type="text"
                  value={editData.vendor}
                  onChange={(e) => handleChangeEdit('vendor', e.target.value)}
                  list="listVendorOpsiEdit"
                  className="field"
                />
                <datalist id="listVendorOpsiEdit">
                  {listVendorUnik.map((v, i) => (
                    <option key={i} value={v} />
                  ))}
                </datalist>
              </div>

              <div className="span-2">
                <label className="label" htmlFor="edit-alamat">
                  Alamat
                </label>
                <input
                  id="edit-alamat"
                  type="text"
                  value={editData.alamat}
                  onChange={(e) => handleChangeEdit('alamat', e.target.value)}
                  className="field"
                />
              </div>

              <div className="span-2">
                <label className="label" htmlFor="edit-maps">
                  Link Maps
                </label>
                <input
                  id="edit-maps"
                  type="text"
                  value={editData.linkMaps}
                  onChange={(e) => handleChangeEdit('linkMaps', e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="edit-unit">
                  Jumlah unit
                </label>
                <input
                  id="edit-unit"
                  type="number"
                  value={editData.jumlahUnit}
                  onChange={(e) => handleChangeEdit('jumlahUnit', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="field numeric"
                />
              </div>

              <div>
                <label className="label" htmlFor="edit-status">
                  Status kurir
                </label>
                <select
                  id="edit-status"
                  value={editData.statusKurir}
                  onChange={(e) => handleChangeEdit('statusKurir', e.target.value)}
                  className="field"
                >
                  <option value="Belum Dibayar">Belum Dibayar</option>
                  <option value="LUNAS">LUNAS</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="edit-biaya">
                  Biaya sewa (Rp)
                </label>
                <input
                  id="edit-biaya"
                  type="text"
                  value={editData.uangVendorStr}
                  onChange={(e) => handleRupiahEdit('uangVendorStr', e.target.value)}
                  inputMode="numeric"
                  className="field numeric"
                />
              </div>

              <div>
                <label className="label" htmlFor="edit-dp">
                  Diterima / DP (Rp)
                </label>
                <input
                  id="edit-dp"
                  type="text"
                  value={editData.sudahBayarStr}
                  onChange={(e) => handleRupiahEdit('sudahBayarStr', e.target.value)}
                  inputMode="numeric"
                  className="field numeric"
                />
              </div>

              <div className="span-2">
                <div className="divider" style={{ margin: '4px 0 0' }} />
              </div>

              <datalist id="listKurirEdit">
                {listKurirUnik.map((k, i) => (
                  <option key={i} value={k} />
                ))}
              </datalist>

              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(8,13,19,.5)',
                  padding: 12,
                }}
              >
                <label className="label" style={{ color: 'var(--info)' }} htmlFor="edit-jml-antar">
                  Tim antar
                </label>
                <select
                  id="edit-jml-antar"
                  value={editData.jmlAntar}
                  onChange={(e) => handleChangeEdit('jmlAntar', e.target.value)}
                  className="field"
                  style={{ minHeight: 38, fontSize: 12, marginBottom: 8, padding: '8px 34px 8px 10px' }}
                >
                  <option value="1">1 orang</option>
                  <option value="2">2 orang</option>
                </select>
                <input
                  type="text"
                  placeholder="Kurir 1"
                  value={editData.kurirAntar1 || ''}
                  onChange={(e) => handleChangeEdit('kurirAntar1', e.target.value)}
                  list="listKurirEdit"
                  className="field"
                  style={{ minHeight: 38, fontSize: 12, marginBottom: 6, padding: '8px 10px' }}
                />
                {editData.jmlAntar === '2' && (
                  <input
                    type="text"
                    placeholder="Kurir 2"
                    value={editData.kurirAntar2 || ''}
                    onChange={(e) => handleChangeEdit('kurirAntar2', e.target.value)}
                    list="listKurirEdit"
                    className="field"
                    style={{ minHeight: 38, fontSize: 12, padding: '8px 10px' }}
                  />
                )}
              </div>

              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(8,13,19,.5)',
                  padding: 12,
                }}
              >
                <label className="label" style={{ color: 'var(--good)' }} htmlFor="edit-jml-jemput">
                  Tim jemput
                </label>
                <select
                  id="edit-jml-jemput"
                  value={editData.jmlJemput}
                  onChange={(e) => handleChangeEdit('jmlJemput', e.target.value)}
                  className="field"
                  style={{ minHeight: 38, fontSize: 12, marginBottom: 8, padding: '8px 34px 8px 10px' }}
                >
                  <option value="1">1 orang</option>
                  <option value="2">2 orang</option>
                </select>
                <input
                  type="text"
                  placeholder="Kurir 1"
                  value={editData.kurirJemput1 || ''}
                  onChange={(e) => handleChangeEdit('kurirJemput1', e.target.value)}
                  list="listKurirEdit"
                  className="field"
                  style={{ minHeight: 38, fontSize: 12, marginBottom: 6, padding: '8px 10px' }}
                />
                {editData.jmlJemput === '2' && (
                  <input
                    type="text"
                    placeholder="Kurir 2"
                    value={editData.kurirJemput2 || ''}
                    onChange={(e) => handleChangeEdit('kurirJemput2', e.target.value)}
                    list="listKurirEdit"
                    className="field"
                    style={{ minHeight: 38, fontSize: 12, padding: '8px 10px' }}
                  />
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn btn-ghost">
                Batal
              </button>
              <button onClick={handleSimpanEdit} disabled={isUpdating} className="btn btn-primary" style={{ flex: 2 }}>
                {isUpdating ? 'Menyimpan…' : 'Simpan perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showConfirmHapus && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 360, textAlign: 'center' }} role="alertdialog" aria-modal="true">
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                margin: '2px auto 14px',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--bad)',
                background: 'var(--bad-dim)',
                border: '1px solid var(--bad-line)',
              }}
            >
              <CircleExclamationPoint size={22} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Hapus transaksi?</h3>
            <p className="modal-sub" style={{ marginBottom: 0 }}>
              Data transaksi akan dihapus permanen dan tidak dapat dikembalikan.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmHapus(false)} className="btn btn-ghost">
                Batal
              </button>
              <button onClick={eksekusiHapusTransaksiFinal} className="btn btn-danger">
                <Trash size={14} /> Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" role="status">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              {t.type === 'success' ? <CircleCheck size={18} /> : t.type === 'error' ? <CircleX size={18} /> : <Info size={18} />}
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
