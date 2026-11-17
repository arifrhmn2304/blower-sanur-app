"use client";

import React, { useState } from 'react';
import {
  CalendarDays,
  ChartPie,
  Package,
  Plus,
  Receipt,
  Tag,
  Trash,
  Wallet,
} from 'lucide-react';
import { db, ref, set, remove } from '@/lib/firebase';

interface TabPengeluaranProps {
  globalPengeluaran: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const KATEGORI = [
  { value: 'BBM / Bensin', label: 'BBM / bensin' },
  { value: 'Servis & Perawatan', label: 'Servis & perawatan blower' },
  { value: 'Pembelian Peralatan', label: 'Pembelian alat / kabel roll' },
  { value: 'Pengeluaran Lainnya', label: 'Pengeluaran lainnya' },
];

const kategoriLabel = (value: string) => KATEGORI.find((k) => k.value === value)?.label ?? value;

export default function TabPengeluaran({
  globalPengeluaran,
  currentSelectedBulan,
  currentSelectedTahun,
  onBulanChange,
  onTahunChange,
  showToast
}: TabPengeluaranProps) {
  const [tglPengeluaran, setTglPengeluaran] = useState('');
  const [kategoriPengeluaran, setKategoriPengeluaran] = useState('BBM / Bensin');
  const [nominalPengeluaran, setNominalPengeluaran] = useState('');
  const [ketPengeluaran, setKetPengeluaran] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRupiahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setNominalPengeluaran('');
      return;
    }
    setNominalPengeluaran(Number(rawVal).toLocaleString('id-ID'));
  };

  const cleanNumber = (valStr: string) => {
    if (!valStr) return 0;
    return parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
  };

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

  const handleSimpanPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = cleanNumber(nominalPengeluaran);
    if (!tglPengeluaran || nom <= 0) {
      showToast('Mohon isi tanggal dan nominal pengeluaran secara benar!', 'error');
      return;
    }

    setLoading(true);
    try {
      const idBaru = String(new Date().getTime());
      const payload = {
        id: idBaru,
        tanggal: tglPengeluaran,
        kategori: kategoriPengeluaran,
        nominal: nom,
        keterangan: ketPengeluaran.trim()
      };

      await set(ref(db, '/pengeluaran/' + idBaru), payload);
      showToast('Pengeluaran operasional berhasil dicatat!', 'success');

      setTglPengeluaran('');
      setNominalPengeluaran('');
      setKetPengeluaran('');
    } catch (error) {
      console.error("Gagal menyimpan pengeluaran:", error);
      showToast('Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHapusPengeluaran = async (firebaseKey: string) => {
    try {
      await remove(ref(db, '/pengeluaran/' + firebaseKey));
      showToast('Pengeluaran berhasil dihapus!', 'success');
    } catch (error) {
      console.error("Gagal menghapus:", error);
      showToast('Gagal menghapus pengeluaran.', 'error');
    }
  };

  const pengeluaranFiltered = globalPengeluaran.filter((p) => {
    const d = parseStandardDate(p.tanggal);
    if (!d) return false;
    const pBulan = String(d.getMonth() + 1).padStart(2, '0');
    const pTahun = String(d.getFullYear());
    return (currentSelectedBulan === "ALL" || pBulan === currentSelectedBulan) && (pTahun === currentSelectedTahun);
  });

  pengeluaranFiltered.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  const totalBiayaPeriode = pengeluaranFiltered.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const rataRata = pengeluaranFiltered.length > 0 ? Math.round(totalBiayaPeriode / pengeluaranFiltered.length) : 0;

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div className="filter-bar">
        <span className="mono-label" style={{ paddingLeft: 4 }}>Periode</span>
        <select value={currentSelectedBulan} onChange={(e) => onBulanChange(e.target.value)} className="field" aria-label="Pilih bulan">
          <option value="ALL">Semua bulan</option>
          {BULAN.map((nama, i) => (
            <option key={nama} value={String(i + 1).padStart(2, '0')}>{nama}</option>
          ))}
        </select>
        <select value={currentSelectedTahun} onChange={(e) => onTahunChange(e.target.value)} className="field" aria-label="Pilih tahun">
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <span className="mono-label" style={{ marginLeft: 'auto', paddingRight: 4 }}>
          {pengeluaranFiltered.length} catatan
        </span>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Total pengeluaran</span>
            <span className="stat-icon"><Wallet size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--bad)' }}>Rp {totalBiayaPeriode.toLocaleString('id-ID')}</span>
          <span className="stat-foot">Periode terpilih</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Rata-rata</span>
            <span className="stat-icon"><ChartPie size={14} /></span>
          </div>
          <span className="stat-value">Rp {rataRata.toLocaleString('id-ID')}</span>
          <span className="stat-foot">Per catatan</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Catatan</span>
            <span className="stat-icon"><Receipt size={14} /></span>
          </div>
          <span className="stat-value">{pengeluaranFiltered.length}</span>
          <span className="stat-foot">Transaksi keluar</span>
        </div>
      </div>

      <section className="surface panel">
        <div className="panel-head">
          <div>
            <div className="panel-title"><Tag size={15} strokeWidth={1.9} /> Catat pengeluaran</div>
            <div className="panel-sub">BBM, servis, dan alat</div>
          </div>
        </div>

        <form onSubmit={handleSimpanPengeluaran} className="form-grid">
          <div>
            <label className="label" htmlFor="exp-date"><CalendarDays size={11} /> Tanggal</label>
            <input id="exp-date" type="date" value={tglPengeluaran} onChange={(e) => setTglPengeluaran(e.target.value)} className="field" required />
          </div>

          <div>
            <label className="label" htmlFor="exp-cat"><Tag size={11} /> Kategori</label>
            <select id="exp-cat" value={kategoriPengeluaran} onChange={(e) => setKategoriPengeluaran(e.target.value)} className="field">
              {KATEGORI.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="exp-amount"><Wallet size={11} /> Nominal</label>
            <input
              id="exp-amount"
              type="text"
              value={nominalPengeluaran}
              onChange={handleRupiahChange}
              placeholder="50.000"
              inputMode="numeric"
              className="field numeric"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="exp-note"><Package size={11} /> Keterangan</label>
            <input
              id="exp-note"
              type="text"
              value={ketPengeluaran}
              onChange={(e) => setKetPengeluaran(e.target.value)}
              placeholder="Isi bensin mobil antar unit"
              className="field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ gridColumn: '1 / -1' }}>
            <Plus size={15} />
            {loading ? 'Menyimpan…' : 'Simpan pengeluaran'}
          </button>
        </form>
      </section>

      <section className="surface panel">
        <div className="panel-head">
          <div>
            <div className="panel-title"><Receipt size={15} strokeWidth={1.9} /> Riwayat pengeluaran</div>
            <div className="panel-sub">Terbaru di atas</div>
          </div>
          <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad)' }}>
            Rp {totalBiayaPeriode.toLocaleString('id-ID')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pengeluaranFiltered.length === 0 ? (
            <div className="empty-state">
              <Receipt size={22} strokeWidth={1.7} />
              <span>Belum ada pengeluaran pada periode ini.</span>
            </div>
          ) : (
            pengeluaranFiltered.map((p) => (
              <div key={p.firebaseKey} className="list-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{kategoriLabel(p.kategori)}</div>
                  <div className="person-meta" style={{ marginTop: 2 }}>
                    {formatTanggal(p.tanggal)}
                    {p.keterangan ? ` · ${p.keterangan}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                  <span className="num" style={{ color: 'var(--bad)', fontWeight: 600, fontSize: 13 }}>
                    Rp {Number(p.nominal).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => handleHapusPengeluaran(p.firebaseKey)}
                    className="icon-btn"
                    style={{ width: 34, height: 34, color: 'var(--bad)' }}
                    title="Hapus pengeluaran"
                    aria-label={`Hapus pengeluaran ${kategoriLabel(p.kategori)} tanggal ${formatTanggal(p.tanggal)}`}
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
