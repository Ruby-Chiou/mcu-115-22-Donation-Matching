import { Injectable, signal } from '@angular/core';

import { CertificateCard } from './agency-certificate.registry';

interface StoredCertificate extends CertificateCard {
  email: string;
  password: string;
}

const STORAGE_KEY = 'dm-company-certificates';

export interface IssueCompanyCertificateInput {
  holderName: string;
  companyName: string;
  taxId: string;
  email: string;
  password: string;
}

/** 企業經辦人的行動自然人憑證。只存在完成註冊的這台瀏覽器。 */
@Injectable({ providedIn: 'root' })
export class CompanyCertificateRegistry {
  private readonly issued = signal<StoredCertificate[]>(this.read());

  list(): CertificateCard[] {
    return this.issued().map(({ id, holderName, agencyName, maskedId, serial }) => ({
      id,
      holderName,
      agencyName,
      maskedId,
      serial,
    }));
  }

  findLogin(id: string): { email: string; password: string } | null {
    const match = this.issued().find((item) => item.id === id);
    return match ? { email: match.email, password: match.password } : null;
  }

  issue(input: IssueCompanyCertificateInput): CertificateCard {
    const email = input.email.trim().toLowerCase();
    const next: StoredCertificate = {
      id: email,
      holderName: maskPersonName(input.holderName),
      agencyName: input.companyName.trim(),
      maskedId: maskTaxId(input.taxId),
      serial: serialFrom(input.taxId),
      email,
      password: input.password,
    };
    const stored = [...this.issued().filter((item) => item.email !== email), next];
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

  private read(): StoredCertificate[] {
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

function maskTaxId(taxId: string): string {
  const digits = taxId.replace(/\D/g, '').padStart(8, '0');
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
}

function serialFrom(taxId: string): string {
  const digits = taxId.replace(/\D/g, '').padStart(8, '0').slice(-8);
  return `115-CO-${digits}`;
}
