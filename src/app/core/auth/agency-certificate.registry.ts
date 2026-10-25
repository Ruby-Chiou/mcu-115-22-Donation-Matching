import { Injectable, signal } from '@angular/core';

/** 憑證對話框看得到的欄位。登入密鑰留在登錄檔，不進畫面。 */
export interface CertificateCard {
  id: string;
  holderName: string;
  agencyName: string;
  maskedId: string;
  serial: string;
}

interface StoredCertificate extends CertificateCard {
  email: string;
  password: string;
}

const STORAGE_KEY = 'dm-agency-certificates';

/** 內建的測試受助者。其他測試者註冊後會另核發一張憑證。 */
const SEED_CERTIFICATE: StoredCertificate = {
  id: 'seed-agency',
  holderName: '測○助者',
  agencyName: '測試受助機構',
  maskedId: 'A12****789',
  serial: '115-MOI-004819',
  email: 'dev.agency@example.com',
  password: 'Km7#agency-Gate',
};

export interface IssueCertificateInput {
  holderName: string;
  agencyName: string;
  registrationNumber: string;
  email: string;
  password: string;
}

/**
 * 政府憑證尚未接通前，用「這台裝置上的憑證」分辨受助者。
 * 每張憑證綁一個已註冊帳號；登入時選憑證，不再另開帳密表單。
 * 新註冊的登入密鑰只留在此瀏覽器，用來代替尚未接上的憑證私鑰。
 */
@Injectable({ providedIn: 'root' })
export class AgencyCertificateRegistry {
  private readonly issued = signal<StoredCertificate[]>(this.readIssued());

  list(): CertificateCard[] {
    return this.accounts().map(({ id, holderName, agencyName, maskedId, serial }) => ({
      id,
      holderName,
      agencyName,
      maskedId,
      serial,
    }));
  }

  findLogin(id: string): { email: string; password: string } | null {
    const match = this.accounts().find((item) => item.id === id);
    return match ? { email: match.email, password: match.password } : null;
  }

  issue(input: IssueCertificateInput): CertificateCard {
    const email = input.email.trim().toLowerCase();
    const next: StoredCertificate = {
      id: email === SEED_CERTIFICATE.email ? SEED_CERTIFICATE.id : email,
      holderName: maskPersonName(input.holderName),
      agencyName: input.agencyName.trim(),
      maskedId: maskRegistration(input.registrationNumber),
      serial: serialFrom(input.registrationNumber),
      email,
      password: input.password,
    };
    const others = this.issued().filter((item) => item.email !== email);
    const stored = [...others, next];
    this.issued.set(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return {
      id: next.id,
      holderName: next.holderName,
      agencyName: next.agencyName,
      maskedId: next.maskedId,
      serial: next.serial,
    };
  }

  private accounts(): StoredCertificate[] {
    const extras = this.issued().filter((item) => item.email !== SEED_CERTIFICATE.email);
    const seedOverride = this.issued().find((item) => item.email === SEED_CERTIFICATE.email);
    return [seedOverride ?? SEED_CERTIFICATE, ...extras];
  }

  private readIssued(): StoredCertificate[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as StoredCertificate[];
      return Array.isArray(parsed) ? parsed.filter((item) => item?.email && item.password) : [];
    } catch {
      return [];
    }
  }
}

function maskPersonName(name: string): string {
  const chars = [...name.trim()];
  if (chars.length <= 1) {
    return chars[0] ?? '經辦人';
  }

  if (chars.length === 2) {
    return `${chars[0]}○`;
  }

  return `${chars[0]}○${chars[chars.length - 1]}`;
}

function maskRegistration(registrationNumber: string): string {
  const digits = registrationNumber.replace(/\D/g, '').padStart(8, '0');
  return `A${digits.slice(0, 2)}****${digits.slice(-3)}`;
}

function serialFrom(registrationNumber: string): string {
  const digits = registrationNumber.replace(/\D/g, '').padStart(6, '0').slice(-6);
  return `115-MOI-${digits}`;
}
