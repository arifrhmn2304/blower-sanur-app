"use client";

import React, { useState } from 'react';
import { db, ref, update } from '@/lib/firebase';

interface KaryawanViewProps {
  globalData: any[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function KaryawanView({ globalData, showToast }: KaryawanViewProps) {
  // State modal atau form edit inline per card
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Form state per card yang sedang diedit
  const [statusUnitBaru, setStatusUnitBaru] = useState('Belum Diantar');
  const [kurirAntar1, setKurirAntar1] = useState('');
  const [kurirAntar2, setKurirAntar2] = useState('');
  const [jmlAntar, setJmlAntar] = useState('1');
  const [kurirJemput1, setKurirJemput1] = useState('');
  const [kurirJemput2, setKurirJemput2] = useState('');
  const [jmlJemput, setJmlJemput] = useState('1');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const parseStandardDate = (rawDate: string) => {
    if (!rawDate) return null;
    let str = String(rawDate);
    if (str.includes('T')) str = str.split('T')[0];
    const p = str.split('-');
    if (p.length === 3 && p[0].length === 4) {
      return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTanggal = (rawDate: string) => {
    const d = parseStandardDate(rawDate);
    if (!d) return '-';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  };

  const listKurirUnik = Array.from(new Set(globalData.flatMap(item => [item.kurirAntar1, item.kurirAntar2, item.kurirJemput1, item.kurirJemput2]).filter(Boolean)));

  const handleBukaEditCard = (item: any) => {
    if (activeCardId === item.id) {
      setActiveCardId(null); // Tutup jika diklik lagi
    } else {
      setActiveCardId(item.id);
      setStatusUnitBaru(item.statusUnit || 'Belum Diantar');
      setKurirAntar1(item.kurirAntar1 || '');
      setKurirAntar2(item.kurirAntar2 || '');
      setJmlAntar(item.kurirAntar2 ? '2' : '1');
      setKurirJemput1(item.kurirJemput1 || '');
      setKurirJemput2(item.kurirJemput2 || '');
      setJmlJemput(item.kurirJemput2 ? '2' : '1');
    }
  };

  const handleSimpanCard = async (item: any) => {
    setLoadingId(item.id);
    try {
      const unitNum = item.jumlahUnit || 1;
      const totalOngkirKurir = unitNum * 50000;

      const payload: any = {
        statusUnit: statusUnitBaru,
        totalOngkirKurir,
        kurirAntar1: kurirAntar1.trim(),
        kurirAntar2: jmlAntar === '2' ? kurirAntar2.trim() : "",
        kurirJemput1: kurirJemput1.trim(),
        kurirJemput2: jmlJemput === '2' ? kurirJemput2.trim() : "",
      };

      await update(ref(db, '/' + item.id), payload);
      showToast('Tugas lapangan berhasil diperbarui!', 'success');
      setActiveCardId(null);
    } catch (error) {
      console.error(error);
      showToast('Gagal memperbarui data.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const activeJobs = globalData.filter(item => item.statusUnit !== 'Selesai');
  activeJobs.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <datalist id="listKurirKaryawanCard">
        {listKurirUnik.map((k, idx) => <option key={idx} value={k} />)}
      </datalist>

      {activeJobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '24px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>✨ Mantap! Tidak ada tugas / job aktif saat ini.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {activeJobs.map((item) => {
            const isEditing = activeCardId === item.id;
            const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean).join(' & ') || '-';
            const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean).join(' & ') || '-';

            return (
              <div 
                key={item.id} 
                className="bento-card" 
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isEditing ? '1px solid rgba(59, 130, 246, 0.5)' : undefined }}
              >
                <div>
                  {/* Header Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div>
                      <b style={{ color: '#fff', fontSize: '15px', fontWeight: '900' }}>{item.vendor || 'Tanpa Nama'}</b><br />
                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800' }}>📅 {formatTanggal(item.tanggal)}</span>
                    </div>
                    <span style={item.statusUnit === 'Sedang Diantar' ? badgeProses : badgeBelum}>
                      {item.statusUnit || 'Belum Diantar'}
                    </span>
                  </div>

                  {/* Informasi Detail */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
                    <div style={rowStyle}><span style={{ color: '#94a3b8' }}>📍 Alamat:</span><span style={{ fontWeight: '700', color: '#e2e8f0', textAlign: 'right' }}>{item.alamat} ({item.jumlahUnit} Unit)</span></div>
                    <div style={rowStyle}><span style={{ color: '#94a3b8' }}>🚚 Kurir Antar:</span><span style={{ color: '#fff', fontWeight: '700' }}>{kAntar}</span></div>
                    <div style={rowStyle}><span style={{ color: '#94a3b8' }}>📦 Kurir Jemput:</span><span style={{ color: '#fff', fontWeight: '700' }}>{kJemput}</span></div>
                    
                    {item.linkMaps && (
                      <div style={{ marginTop: '4px' }}>
                        <a href={item.linkMaps} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', textDecoration: 'none', fontWeight: '800', fontSize: '11px', background: 'rgba(56, 189, 248, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          <span>🗺️</span> Buka Navigasi Google Maps
                        </a>
                      </div>
                    )}
                  </div>

                  {/* FORM EDIT INLINE KETIKA DIKLIK */}
                  {isEditing && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-enter">
                      <div>
                        <label style={labelStyle}>Status Unit:</label>
                        <select value={statusUnitBaru} onChange={(e) => setStatusUnitBaru(e.target.value)} style={inputStyle}>
                          <option value="Belum Diantar" style={{ background: '#0f172a' }}>⏳ Belum Diantar</option>
                          <option value="Sedang Diantar" style={{ background: '#0f172a' }}>🚚 Sedang Diantar / Disewa</option>
                          <option value="Selesai" style={{ background: '#0f172a' }}>✅ Selesai (Kembali)</option>
                        </select>
                      </div>

                      {/* Kurir Antar */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                        <label style={{ ...labelStyle, color: '#60a5fa', marginBottom: '6px' }}>Kurir Antar:</label>
                        <select value={jmlAntar} onChange={(e) => setJmlAntar(e.target.value)} style={{ ...inputStyle, marginBottom: '6px', fontSize: '11px', padding: '8px' }}>
                          <option value="1" style={{ background: '#0f172a' }}>1 Orang</option>
                          <option value="2" style={{ background: '#0f172a' }}>2 Orang</option>
                        </select>
                        <input type="text" value={kurirAntar1} onChange={(e) => setKurirAntar1(e.target.value)} list="listKurirKaryawanCard" placeholder="Kurir Antar 1" style={{ ...inputStyle, marginBottom: '6px', fontSize: '12px', padding: '10px' }} />
                        {jmlAntar === '2' && (
                          <input type="text" value={kurirAntar2} onChange={(e) => setKurirAntar2(e.target.value)} list="listKurirKaryawanCard" placeholder="Kurir Antar 2" style={{ ...inputStyle, fontSize: '12px', padding: '10px' }} />
                        )}
                      </div>

                      {/* Kurir Jemput */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px' }}>
                        <label style={{ ...labelStyle, color: '#34d399', marginBottom: '6px' }}>Kurir Jemput:</label>
                        <select value={jmlJemput} onChange={(e) => setJmlJemput(e.target.value)} style={{ ...inputStyle, marginBottom: '6px', fontSize: '11px', padding: '8px' }}>
                          <option value="1" style={{ background: '#0f172a' }}>1 Orang</option>
                          <option value="2" style={{ background: '#0f172a' }}>2 Orang</option>
                        </select>
                        <input type="text" value={kurirJemput1} onChange={(e) => setKurirJemput1(e.target.value)} list="listKurirKaryawanCard" placeholder="Kurir Jemput 1" style={{ ...inputStyle, marginBottom: '6px', fontSize: '12px', padding: '10px' }} />
                        {jmlJemput === '2' && (
                          <input type="text" value={kurirJemput2} onChange={(e) => setKurirJemput2(e.target.value)} list="listKurirKaryawanCard" placeholder="Kurir Jemput 2" style={{ ...inputStyle, fontSize: '12px', padding: '10px' }} />
                        )}
                      </div>

                      <button 
                        onClick={() => handleSimpanCard(item)}
                        disabled={loadingId === item.id}
                        className="btn-interactive"
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                      >
                        {loadingId === item.id ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Buka/Tutup Form */}
                <button 
                  onClick={() => handleBukaEditCard(item)}
                  className="btn-interactive"
                  style={{ 
                    backgroundColor: isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                    color: isEditing ? '#fca5a5' : '#60a5fa', 
                    border: isEditing ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)', 
                    padding: '12px', 
                    borderRadius: '14px', 
                    fontWeight: '900', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: 'auto'
                  }}
                >
                  {isEditing ? '❌ Tutup Form' : '✏️ Update Status / Kurir'}
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '12px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxSizing: 'border-box', fontSize: '13px', outline: 'none', fontWeight: '600' };
const badgeProses: React.CSSProperties = { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };
const badgeBelum: React.CSSProperties = { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };