"use client";

import { ClipboardList, Truck, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Catat job tanpa ribet',
    desc: 'Order, vendor, dan unit tercatat rapi dalam satu alur.',
  },
  {
    icon: Truck,
    title: 'Atur kurir antar–jemput',
    desc: 'Penugasan dan ongkir kurir terhitung otomatis.',
  },
  {
    icon: ShieldCheck,
    title: 'Keuangan tetap privat',
    desc: 'Data penagihan dan kas hanya terbuka untuk Owner.',
  },
];

export default function AuthBrandPanel() {
  return (
    <section className="auth-brand" aria-label="Tentang Blower Sanur">
      <div className="auth-brand-badge">
        <span className="auth-brand-dot" />
        Layanan sewa blower · Sanur, Bali
      </div>

      <ul className="auth-brand-features">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <li className="auth-brand-feature" key={title}>
            <span className="auth-brand-feature-icon">
              <Icon size={17} strokeWidth={1.8} />
            </span>
            <span className="auth-brand-feature-body">
              <b>{title}</b>
              <span>{desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
