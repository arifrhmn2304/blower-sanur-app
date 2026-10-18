"use client";

import React, { useState, useEffect } from 'react';
import { db, ref, onValue, update, remove } from '@/lib/firebase';
import TabFormJob from '../components/TabFormJob';
import TabDashboard from '../components/TabDashboard';
import TabPengeluaran from '../components/TabPengeluaran';
import TabVendor from '../components/TabVendor';
import TabRiwayat from '../components/TabRiwayat';
import KaryawanView from '../components/KaryawanView';

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pinOwner, setPinOwner] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); 

  const [currentSelectedBulan, setCurrentSelectedBulan] = useState('01');
  const [currentSelectedTahun, setCurrentSelectedTahun] = useState('2026');

  const [globalData, setGlobalData] = useState<any[]>([]);
  const [globalPengeluaran, setGlobalPengeluaran] = useState<any[]>([]);

  // State untuk Toast Notification Modern
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 500);
  };

  // State untuk Modal Kurir
  const [selectedKurir, setSelectedKurir] = useState('');
  const [showDetailKurir, setShowDetailKurir] = useState(false);
  const [showPelunasanKurir, setShowPelunasanKurir] = useState(false);
  const [waInput, setWaInput] = useState('');

  // State untuk Modal Vendor
  const [selectedVendor, setSelectedVendor] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);

  // State untuk Modal Edit Riwayat
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // State untuk Modal Konfirmasi Hapus Transaksi Global
  const [showConfirmHapus, setShowConfirmHapus] = useState(false);
  const [idTransaksiHapus, setIdTransaksiHapus] = useState<string | null>(null);

  useEffect(() => {
    const tglSekarang = new Date();
    setCurrentSelectedBulan(String(tglSekarang.getMonth() + 1).padStart(2, '0'));
    setCurrentSelectedTahun(String(tglSekarang.getFullYear()));

    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
      setShowLoginModal(false);
    }

    const rootRef = ref(db, '/');
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      let listJob: any[] = [];
      let listExp: any[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          if (key === 'pengeluaran' && typeof data[key] === 'object') {
            Object.keys(data[key]).forEach(pKey => listExp.push({ ...data[key][pKey], firebaseKey: pKey }));
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
      setShowLoginModal(false);
      showToast('Masuk sebagai Karyawan', 'success');
    } else if (role === 'OWNER') {
      setShowLoginModal(false);
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

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
    setShowLoginModal(true);
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

      if ((currentSelectedBulan === "ALL" || itemBulan === currentSelectedBulan) && (itemTahun === currentSelectedTahun)) {
        if (!item[`lunas_${keyK}`] && item.statusKurir !== "LUNAS") {
          const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean);
          const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean);
          const unit = item.jumlahUnit || 1;
          
          // Tarif dasar dibagi jumlah orang
          const tarifAntar = (unit * 30000) / (kAntar.length || 1);
          const tarifJemput = (unit * 20000) / (kJemput.length || 1);

          const isAntar = kAntar.includes(selectedKurir);
          const isJemput = kJemput.includes(selectedKurir);

          if (isAntar || isJemput) {
            let peranArr = [];
            let totalNominal = 0;

            // Tambahkan keterangan pembagian (Sendiri / Ber-2)
            if (isAntar) {
              peranArr.push(`Antar (${kAntar.length === 1 ? 'Sendiri' : 'Ber-2'})`);
              totalNominal += tarifAntar;
            }
            if (isJemput) {
              peranArr.push(`Jemput (${kJemput.length === 1 ? 'Sendiri' : 'Ber-2'})`);
              totalNominal += tarifJemput;
            }

            // GABUNGKAN JADI 1 BARIS LOKASI
            detailJobsKurir.push({ 
              id: item.id, 
              tanggal: item.tanggal, 
              alamat: item.alamat, 
              unit, 
              peran: peranArr.join(' & '), 
              nominal: totalNominal 
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
    const keyK = selectedKurir.replace(/[^a-zA-Z0-9]/g, '_');
    const updates: any = {};
    
    // FORMAT WA LEBIH SINGKAT & JELAS
    let textWA = `*GAJI BLOWER SANUR*\n👤 *${selectedKurir}*\n\n`;
    detailJobsKurir.forEach((j, idx) => {
      textWA += `${idx + 1}. ${formatTanggal(j.tanggal)} | ${j.peran}\n   📍 ${j.alamat} = Rp ${j.nominal.toLocaleString('id-ID')}\n`;
    });
    textWA += `\n*TOTAL CAIR: Rp ${totalGajiKurirDetail.toLocaleString('id-ID')}* ✅\nMakasih kerjanya!`;

    if (kirimWA && waInput.trim() !== '') {
      localStorage.setItem(`wa_kurir_${selectedKurir}`, waInput);
      let phone = waInput.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textWA)}`, '_blank');
    }

    detailJobsKurir.forEach((job) => updates[`/${job.id}/lunas_${keyK}`] = true);
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
  const vendorJobs = globalData.filter((x) => String(x.vendor || "").trim().toLowerCase() === selectedVendor.trim().toLowerCase());
  vendorJobs.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  const handleBukaDetailVendor = (nama: string) => {
    setSelectedVendor(nama);
    setShowVendorModal(true);
  };

  const handleBukaEditModal = (id: string) => {
    const item = globalData.find(x => x.id === id);
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
      const statusBayar = sisaBayar <= 0 ? "LUNAS" : "BELUM LUNAS";
      const totalOngkirKurir = (parseInt(editData.jumlahUnit) || 0) * 50000;

      const kA1 = (editData.kurirAntar1 || "").trim();
      const kA2 = editData.jmlAntar === '2' ? (editData.kurirAntar2 || "").trim() : "";
      const kJ1 = (editData.kurirJemput1 || "").trim();
      const kJ2 = editData.jmlJemput === '2' ? (editData.kurirJemput2 || "").trim() : "";

      // LOGIKA STATUS OTOMATIS OLEH OWNER DARI RIWAYAT
      let autoStatusUnit = "Belum Diantar";
      if (kJ1 || kJ2) {
        autoStatusUnit = "Selesai";
      } else if (kA1 || kA2) {
        autoStatusUnit = "Sedang Dipakai";
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

  const listVendorUnik = Array.from(new Set(globalData.map(item => item.vendor).filter(Boolean)));
  const listKurirUnik = Array.from(new Set(globalData.flatMap(item => [item.kurirAntar1, item.kurirAntar2, item.kurirJemput1, item.kurirJemput2]).filter(Boolean)));
  
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

  const NAV_ITEMS = [
    { id: 'pengeluaran', label: 'Pengeluaran', icon: '💸' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'form', label: 'Home', icon: '📝' },
    { id: 'vendor', label: 'Vendor', icon: '👥' },
    { id: 'riwayat', label: 'Riwayat', icon: '📋' },
  ];

  return (
    <>
      <main className="app-wrapper">
        {/* MODAL LOGIN */}
        {showLoginModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle} className="glass-panel animate-enter">
              <div 
                className="animate-spin-slow" 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  margin: '0 auto 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '50px' 
                }}
              >
                𖣘
              </div>
              <h2 className="shimmer-text" style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>Blower Sanur</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '32px', fontWeight: '600' }}>Sistem Keuangan Sanur Blower</p>
              
              <button onClick={() => handlePilihRole('OWNER')} className="btn-interactive" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.25))', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '18px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>👑</span> Masuk Sebagai OWNER
              </button>
              <button onClick={() => handlePilihRole('KARYAWAN')} className="btn-interactive" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.25))', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '18px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>👷</span> Masuk Sebagai KARYAWAN
              </button>
            </div>
          </div>
        )}

        {/* MODAL PIN OWNER */}
        {showPassModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle} className="glass-panel animate-enter">
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '20px', fontWeight: '900' }}>Enter PIN Owner</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>Masukkan 6 digit PIN rahasia akses penuh.</p>
              <input type="password" value={pinOwner} onChange={(e) => setPinOwner(e.target.value)} placeholder="••••••" inputMode="numeric" pattern="[0-9]*" style={inputStyle} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => { setShowPassModal(false); setShowLoginModal(true); }} className="btn-interactive" style={{ padding: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', fontWeight: '700', flex: 1, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleVerifikasiPIN} className="btn-interactive" style={{ padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', flex: 1, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.4)' }}>Unlock</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: RINCIAN JOB KURIR */}
        {showDetailKurir && (
          <div style={modalOverlayStyle}>
            <div style={{...modalContentStyle, width: '90%', maxWidth: '420px'}} className="glass-panel animate-enter">
              <h3 style={{ margin: '0 0 16px', color: '#60a5fa', fontSize: '18px' }}>📦 Rincian Job: {selectedKurir}</h3>
              
              <div style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: '16px', textAlign: 'left', paddingRight: '4px' }}>
                {detailJobsKurir.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>Tidak ada rincian job belum dibayar.</p>
                ) : (
                  detailJobsKurir.map((j, idx) => (
                    // TAMPILAN KARTU RINCIAN LEBIH SINGKAT
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', marginBottom: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#60a5fa', fontWeight: '800' }}>📅 {formatTanggal(j.tanggal)} | {j.peran}</span>
                        <span style={{ color: '#fde047', fontWeight: '900', fontSize: '13px' }}>Rp {j.nominal.toLocaleString('id-ID')}</span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 'bold', marginTop: '4px' }}>📍 {j.alamat}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '20px', fontWeight: '900' }}>
                <span style={{ color: '#fff' }}>TOTAL GAJI:</span>
                <span style={{ color: '#34d399', fontSize: '18px' }}>Rp {totalGajiKurirDetail.toLocaleString('id-ID')}</span>
              </div>
              <button onClick={() => setShowDetailKurir(false)} className="btn-interactive" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        )}

        {/* MODAL 2: PELUNASAN WA KURIR */}
        {showPelunasanKurir && (
          <div style={modalOverlayStyle}>
            <div style={{...modalContentStyle, width: '90%', maxWidth: '380px'}} className="glass-panel animate-enter">
              <h3 style={{ margin: '0 0 16px', color: '#34d399', fontSize: '18px' }}>💰 Pelunasan: {selectedKurir}</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '16px', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: '900', fontSize: '15px' }}>
                  <span style={{ color: '#fff' }}>Total Gaji:</span>
                  <span style={{ color: '#fde047' }}>Rp {totalGajiKurirDetail.toLocaleString('id-ID')}</span>
                </div>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Kirim via WA (Opsional, isi No HP):</label>
                <input type="tel" value={waInput} onChange={(e) => setWaInput(e.target.value)} placeholder="Contoh: 08123456789" style={{ ...inputStyle, textAlign: 'left', letterSpacing: '1px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => eksekusiPelunasan(true)} className="btn-interactive" style={{ width: '100%', padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>📲 Kirim WA & Lunaskan</button>
                <button onClick={() => eksekusiPelunasan(false)} className="btn-interactive" style={{ width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Tandai Lunas Saja</button>
                <button onClick={() => setShowPelunasanKurir(false)} className="btn-interactive" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: RINCIAN HISTORI VENDOR */}
        {showVendorModal && (
          <div style={modalOverlayStyle}>
            <div style={{...modalContentStyle, width: '90%', maxWidth: '420px', padding: '24px'}} className="glass-panel animate-enter">
              <h3 style={{ margin: '0 0 16px', color: '#fcd34d', fontSize: '18px' }}>👥 Histori: {selectedVendor}</h3>
              
              <div style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: '16px', textAlign: 'left', paddingRight: '4px' }}>
                {vendorJobs.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>Tidak ada riwayat untuk vendor ini.</p>
                ) : (
                  vendorJobs.map((o, idx) => {
                    const uVendor = Number(o.uangVendor) || 0;
                    const sBayar = Number(o.sudahBayar) || 0;
                    const sisa = Number(o.sisaBayar) || 0;
                    const isLunas = sisa <= 0;
                    return (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', borderRadius: '16px', marginBottom: '10px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#60a5fa', fontWeight: '800' }}>📅 {formatTanggal(o.tanggal)}</span>
                          <span style={{ backgroundColor: isLunas ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isLunas ? '#34d399' : '#fca5a5', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                            {isLunas ? "LUNAS" : "BELUM"}
                          </span>
                        </div>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>📍 {o.alamat} ({o.jumlahUnit} Unit)</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                          <span style={{ color: '#94a3b8' }}>Biaya: <b style={{color: '#fff'}}>Rp {uVendor.toLocaleString('id-ID')}</b></span>
                          <span style={{ color: '#34d399' }}>Masuk: <b>Rp {sBayar.toLocaleString('id-ID')}</b></span>
                          <span style={{ color: '#fca5a5' }}>Sisa: <b>Rp {sisa.toLocaleString('id-ID')}</b></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button onClick={() => setShowVendorModal(false)} className="btn-interactive" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        )}

        {/* MODAL 4: EDIT DATA TRANSAKSI */}
        {showEditModal && editData && (
          <div style={modalOverlayStyle}>
            <div style={{
              ...modalContentStyle, 
              width: '95%', 
              maxWidth: '500px', 
              padding: '24px', 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              paddingBottom: '100px'
            }} className="glass-panel animate-enter">
              <h3 style={{ margin: '0 0 20px', color: '#60a5fa', fontSize: '18px' }}>✏️ Edit Transaksi & Kurir</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={labelStyle}>Tanggal Peminjaman:</label>
                  <input type="date" value={editData.tanggal} onChange={(e) => handleChangeEdit('tanggal', e.target.value)} style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                </div>
                <div>
                  <label style={labelStyle}>Vendor:</label>
                  <input type="text" value={editData.vendor} onChange={(e) => handleChangeEdit('vendor', e.target.value)} list="listVendorOpsiEdit" style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                  <datalist id="listVendorOpsiEdit">{listVendorUnik.map((v, i) => <option key={i} value={v} />)}</datalist>
                </div>
                <div>
                  <label style={labelStyle}>Alamat:</label>
                  <input type="text" value={editData.alamat} onChange={(e) => handleChangeEdit('alamat', e.target.value)} style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                </div>
                <div>
                  <label style={labelStyle}>Link Maps (Teks):</label>
                  <input type="text" value={editData.linkMaps} onChange={(e) => handleChangeEdit('linkMaps', e.target.value)} style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Jumlah Unit:</label>
                    <input type="number" value={editData.jumlahUnit} onChange={(e) => handleChangeEdit('jumlahUnit', e.target.value)} inputMode="numeric" pattern="[0-9]*" style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status Kurir Utama:</label>
                    <select value={editData.statusKurir} onChange={(e) => handleChangeEdit('statusKurir', e.target.value)} style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}}>
                      <option value="Belum Dibayar" style={{background: '#0f172a'}}>Belum Dibayar</option>
                      <option value="LUNAS" style={{background: '#0f172a'}}>LUNAS</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Biaya Sewa (Rp):</label>
                    <input type="text" value={editData.uangVendorStr} onChange={(e) => handleRupiahEdit('uangVendorStr', e.target.value)} inputMode="numeric" style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                  </div>
                  <div>
                    <label style={labelStyle}>Diterima / DP (Rp):</label>
                    <input type="text" value={editData.sudahBayarStr} onChange={(e) => handleRupiahEdit('sudahBayarStr', e.target.value)} inputMode="numeric" style={{...inputStyle, padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: 'normal'}} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }}></div>
                
                {/* Tim Kurir Edit */}
                <datalist id="listKurirEdit">{listKurirUnik.map((k,i)=><option key={i} value={k}/>)}</datalist>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <label style={{...labelStyle, color: '#60a5fa'}}>🚚 Antar (Jml Orang):</label>
                    <select value={editData.jmlAntar} onChange={(e) => handleChangeEdit('jmlAntar', e.target.value)} style={{...inputStyle, padding: '10px', fontSize: '12px', marginBottom: '8px', textAlign: 'left', letterSpacing: 'normal'}}>
                      <option value="1" style={{background: '#0f172a'}}>1 Orang</option><option value="2" style={{background: '#0f172a'}}>2 Orang</option>
                    </select>
                    <input type="text" placeholder="Kurir 1" value={editData.kurirAntar1 || ''} onChange={(e) => handleChangeEdit('kurirAntar1', e.target.value)} list="listKurirEdit" style={{...inputStyle, padding: '10px', fontSize: '12px', marginBottom: '6px', textAlign: 'left', letterSpacing: 'normal'}} />
                    {editData.jmlAntar === '2' && <input type="text" placeholder="Kurir 2" value={editData.kurirAntar2 || ''} onChange={(e) => handleChangeEdit('kurirAntar2', e.target.value)} list="listKurirEdit" style={{...inputStyle, padding: '10px', fontSize: '12px', textAlign: 'left', letterSpacing: 'normal'}} />}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <label style={{...labelStyle, color: '#34d399'}}>📦 Jemput (Jml Orang):</label>
                    <select value={editData.jmlJemput} onChange={(e) => handleChangeEdit('jmlJemput', e.target.value)} style={{...inputStyle, padding: '10px', fontSize: '12px', marginBottom: '8px', textAlign: 'left', letterSpacing: 'normal'}}>
                      <option value="1" style={{background: '#0f172a'}}>1 Orang</option><option value="2" style={{background: '#0f172a'}}>2 Orang</option>
                    </select>
                    <input type="text" placeholder="Kurir 1" value={editData.kurirJemput1 || ''} onChange={(e) => handleChangeEdit('kurirJemput1', e.target.value)} list="listKurirEdit" style={{...inputStyle, padding: '10px', fontSize: '12px', marginBottom: '6px', textAlign: 'left', letterSpacing: 'normal'}} />
                    {editData.jmlJemput === '2' && <input type="text" placeholder="Kurir 2" value={editData.kurirJemput2 || ''} onChange={(e) => handleChangeEdit('kurirJemput2', e.target.value)} list="listKurirEdit" style={{...inputStyle, padding: '10px', fontSize: '12px', marginBottom: '6px', textAlign: 'left', letterSpacing: 'normal'}} />}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => setShowEditModal(false)} className="btn-interactive" style={{ padding: '14px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', flex: 1, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSimpanEdit} disabled={isUpdating} className="btn-interactive" style={{ padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', flex: 2, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KONTEN BERDASARKAN ROLE */}
        {userRole && (
          <div className="animate-enter">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>
                  {userRole === 'KARYAWAN' ? '👷 Portal Lapangan' : (
                    activeTab === 'dashboard' ? '📊 Keuangan' : 
                    activeTab === 'form' ? '📝 Tambah Job' :
                    activeTab === 'pengeluaran' ? '💸 Pengeluaran' :
                    activeTab === 'vendor' ? '👥 Vendor' : '📋 Riwayat'
                  )}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                  Status: <span style={{ color: '#34d399' }}>{userRole}</span>
                </p>
              </div>
              <button onClick={handleLogout} className="btn-interactive glass-panel" style={{ width: '42px', height: '42px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }} title="Logout">
                <span aria-hidden="true">🚪</span>
              </button>
            </header>

            {userRole === 'OWNER' ? (
              <>
                <div className="desktop-nav">
                  {NAV_ITEMS.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)} 
                      className={`desktop-nav-btn btn-interactive ${activeTab === item.id ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>

                <div key={activeTab} className="animate-enter" style={{ position: 'relative', zIndex: 1 }}>
                  {activeTab === 'dashboard' && <TabDashboard globalData={globalData} globalPengeluaran={globalPengeluaran} currentSelectedBulan={currentSelectedBulan} currentSelectedTahun={currentSelectedTahun} onBulanChange={setCurrentSelectedBulan} onTahunChange={setCurrentSelectedTahun} onBukaDetailKurir={handleBukaDetailKurir} onBukaPelunasanKurir={handleBukaPelunasanKurir} />}
                  
                  {activeTab === 'form' && <TabFormJob listVendor={listVendorUnik} showToast={showToast} />}
                  
                  {activeTab === 'pengeluaran' && <TabPengeluaran globalPengeluaran={globalPengeluaran} currentSelectedBulan={currentSelectedBulan} currentSelectedTahun={currentSelectedTahun} onBulanChange={setCurrentSelectedBulan} onTahunChange={setCurrentSelectedTahun} showToast={showToast} />}
                  
                  {activeTab === 'vendor' && <TabVendor globalData={globalData} currentSelectedBulan={currentSelectedBulan} currentSelectedTahun={currentSelectedTahun} onBulanChange={setCurrentSelectedBulan} onTahunChange={setCurrentSelectedTahun} onBukaDetailVendor={handleBukaDetailVendor} />}
                  
                  {activeTab === 'riwayat' && <TabRiwayat globalData={globalData} currentSelectedBulan={currentSelectedBulan} currentSelectedTahun={currentSelectedTahun} onBulanChange={setCurrentSelectedBulan} onTahunChange={setCurrentSelectedTahun} onBukaEditModal={handleBukaEditModal} onHapusData={triggerHapusTransaksi} showToast={showToast} />}
                </div>
              </>
            ) : (
              <div className="animate-enter">
                <KaryawanView globalData={globalData} showToast={showToast} />
              </div>
            )}
          </div>
        )}
        
        {/* RENDER TOAST NOTIFICATIONS (POPUP TENGAH) */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map((t) => (
              <div key={t.id} className={`toast-item ${t.type}`}>
                <span style={{ fontSize: '24px' }}>
                  {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span style={{ flex: 1, lineHeight: '1.4', textAlign: 'center' }}>{t.message}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR (Mobile) */}
      {userRole === 'OWNER' && (
        <nav className="mobile-bottom-nav">
          <div className="mobile-nav-items">
            {NAV_ITEMS.map((item) => (
              <div 
                key={item.id} 
                className={`nav-item btn-interactive ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className="icon">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>
      )}

      {/* MODAL KUSTOM KONFIRMASI HAPUS TRANSAKSI */}
      {showConfirmHapus && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, width: '90%', maxWidth: '340px'}} className="glass-panel animate-enter">
            <div style={{ width: '54px', height: '54px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '18px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '18px', fontWeight: '900' }}>Hapus Transaksi?</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px', lineHeight: '1.4' }}>Data transaksi yang dihapus tidak dapat dikembalikan secara permanen.</p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirmHapus(false)} className="btn-interactive" style={{ padding: '14px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', flex: 1, cursor: 'pointer' }}>Batal</button>
              <button onClick={eksekusiHapusTransaksiFinal} className="btn-interactive" style={{ padding: '14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', flex: 1, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Styling Inline Modern
const modalOverlayStyle: React.CSSProperties = { 
  position: 'fixed', 
  inset: 0, 
  backgroundColor: 'rgba(3, 7, 18, 0.8)', 
  backdropFilter: 'blur(25px)', 
  WebkitBackdropFilter: 'blur(25px)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 999999,
  padding: '16px',
  margin: 0
};

const modalContentStyle: React.CSSProperties = { 
  padding: '36px 28px', 
  borderRadius: '32px', 
  width: '100%', 
  maxWidth: '360px', 
  textAlign: 'center',
  margin: 'auto',
  boxSizing: 'border-box',
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
};

const inputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '16px', 
  borderRadius: '18px', 
  backgroundColor: 'rgba(0, 0, 0, 0.35)', 
  border: '1px solid rgba(255, 255, 255, 0.08)', 
  color: 'white', 
  boxSizing: 'border-box', 
  fontSize: '20px', 
  textAlign: 'center', 
  letterSpacing: '4px', 
  outline: 'none' 
};

const labelStyle: React.CSSProperties = { 
  display: 'block', 
  fontSize: '11px', 
  color: '#94a3b8', 
  fontWeight: '800', 
  marginBottom: '6px', 
  textTransform: 'uppercase',
  letterSpacing: '0.5px' 
};