"use client";

import React, { useState } from 'react';
import {
  Banknote,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Info,
  Link2,
  MapPin,
  Save,
} from 'lucide-react';
import { db, ref, set } from '@/lib/firebase';

interface TabFormJobProps {
  listVendor: string[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TabFormJob({ listVendor, showToast }: TabFormJobProps) {
  const [tanggal, setTanggal] = useState('');
  const [vendor, setVendor] = useState('');
  const [alamat, setAlamat] = useState('');
  const [linkMaps, setLinkMaps] = useState('');
  const [jumlahUnit, setJumlahUnit] = useState('');
  const [uangVendor, setUangVendor] = useState('');
  const [sudahBayar, setSudahBayar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRupiahChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setter('');
      return;
    }
    const formatted = Number(rawVal).toLocaleString('id-ID');
    setter(formatted);
  };

  const cleanNumber = (valStr: string) => {
    if (!valStr) return 0;
    return parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
  };

  const handleSimpanOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal || !vendor || !alamat || !jumlahUnit || !uangVendor) {
      showToast('Mohon isi Tanggal, Vendor, Alamat, Jumlah Unit, dan Total Biaya Sewa secara lengkap!', 'error');
      return;
    }

    setLoading(true);
    try {
      const unitNum = parseInt(jumlahUnit, 10) || 0;
      const totalSewa = cleanNumber(uangVendor);
      const diterima = cleanNumber(sudahBayar);
      const sisaBayar = totalSewa - diterima;
      const statusBayar = sisaBayar <= 0 ? "LUNAS" : "BELUM LUNAS";
      const totalOngkirKurir = unitNum * 50000;
      const idBaru = String(new Date().getTime());

      const payload = {
        id: idBaru,
        tanggal,
        vendor: vendor.trim(),
        alamat: alamat.trim(),
        linkMaps: linkMaps.trim(),
        jumlahUnit: unitNum,
        uangVendor: totalSewa,
        sudahBayar: diterima,
        sisaBayar,
        statusBayar,
        totalOngkirKurir,
        kurirAntar1: "",
        kurirAntar2: "",
        kurirJemput1: "",
        kurirJemput2: "",
        statusKurir: "Belum Dibayar",
        statusUnit: "Belum Diantar"
      };

      await set(ref(db, '/' + idBaru), payload);
      showToast('Orderan / Job baru berhasil disimpan ke database!', 'success');

      setTanggal('');
      setVendor('');
      setAlamat('');
      setLinkMaps('');
      setJumlahUnit('');
      setUangVendor('');
      setSudahBayar('');
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      showToast('Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalSewa = cleanNumber(uangVendor);
  const diterima = cleanNumber(sudahBayar);
  const sisa = totalSewa - diterima;
  const gaji = (parseInt(jumlahUnit, 10) || 0) * 50000;

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="panel-title"><ClipboardList size={15} strokeWidth={1.9} /> Order baru</div>
          <div className="panel-sub">Catat sewa unit blower untuk event</div>
        </div>
        <span className="badge badge-info">Database Connected</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="form-layout">

        <section className="surface panel">
          <form onSubmit={handleSimpanOrder} className="form-grid">

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="job-tanggal"><CalendarDays size={11} /> Tanggal peminjaman</label>
              <input id="job-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="field" required />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="job-vendor"><Banknote size={11} /> Nama penyewa / vendor</label>
              <input
                id="job-vendor"
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                list="listVendorOptions"
                placeholder="Ketik atau pilih nama vendor"
                className="field"
                autoComplete="off"
                required
              />
              <datalist id="listVendorOptions">
                {listVendor.map((v, idx) => (
                  <option key={idx} value={v} />
                ))}
              </datalist>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="job-alamat"><MapPin size={11} /> Alamat / lokasi event</label>
              <input
                id="job-alamat"
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: D'Sanur Grand Hall"
                className="field"
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="job-maps"><Link2 size={11} /> Link Google Maps / share loc <span className="dim">(opsional)</span></label>
              <input
                id="job-maps"
                type="text"
                value={linkMaps}
                onChange={(e) => setLinkMaps(e.target.value)}
                placeholder="Tempel tautan Google Maps di sini"
                className="field"
                inputMode="url"
              />
            </div>

            <div>
              <label className="label" htmlFor="job-unit"><Boxes size={11} /> Jumlah unit</label>
              <input
                id="job-unit"
                type="number"
                value={jumlahUnit}
                onChange={(e) => setJumlahUnit(e.target.value)}
                placeholder="2"
                className="field numeric"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="job-total"><Banknote size={11} /> Total biaya sewa</label>
              <input
                id="job-total"
                type="text"
                value={uangVendor}
                onChange={(e) => handleRupiahChange(e, setUangVendor)}
                placeholder="350.000"
                className="field numeric"
                inputMode="numeric"
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="job-dp"><CreditCard size={11} /> DP diterima <span className="dim">(opsional)</span></label>
              <input
                id="job-dp"
                type="text"
                value={sudahBayar}
                onChange={(e) => handleRupiahChange(e, setSudahBayar)}
                placeholder="0"
                className="field numeric"
                inputMode="numeric"
              />
              <p className="helper">Sisa piutang dihitung otomatis saat order disimpan.</p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
              <Save size={15} />
              {loading ? 'Menyimpan…' : 'Simpan order'}
            </button>

          </form>
        </section>

        <aside className="surface panel corner" aria-label="Ringkasan order">
          <div className="panel-head">
            <div className="panel-title">Ringkasan</div>
            <span className="mono-label">Preview</span>
          </div>

          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="list-row" style={{ padding: '11px 12px' }}>
              <dt className="row-label">Total sewa</dt>
              <dd className="row-value num" style={{ margin: 0 }}>Rp {totalSewa.toLocaleString('id-ID')}</dd>
            </div>
            <div className="list-row" style={{ padding: '11px 12px' }}>
              <dt className="row-label">DP diterima</dt>
              <dd className="row-value num" style={{ margin: 0, color: 'var(--good)' }}>Rp {diterima.toLocaleString('id-ID')}</dd>
            </div>
            <div className="list-row" style={{ padding: '11px 12px' }}>
              <dt className="row-label">Sisa piutang</dt>
              <dd className="row-value num" style={{ margin: 0, color: sisa > 0 ? 'var(--bad)' : 'var(--good)' }}>
                Rp {Math.max(0, sisa).toLocaleString('id-ID')}
              </dd>
            </div>
            <div className="list-row" style={{ padding: '11px 12px' }}>
              <dt className="row-label">Estimasi gaji kurir</dt>
              <dd className="row-value num" style={{ margin: 0, color: 'var(--accent)' }}>Rp {gaji.toLocaleString('id-ID')}</dd>
            </div>
          </dl>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <Info size={13} style={{ color: 'var(--text-3)', flex: 'none', marginTop: 2 }} />
            <p className="helper" style={{ margin: 0 }}>
              gaji kurir memakai tarif antar Rp 30.000 + jemput Rp 20.000 per unit. Bagi tugas kurir di tab Karyawan setelah order masuk.
            </p>
          </div>

          {sisa <= 0 && totalSewa > 0 && (
            <span className="badge badge-good" style={{ marginTop: 14 }}>Lunas di muka</span>
          )}
        </aside>

      </div>

    </div>
  );
}
