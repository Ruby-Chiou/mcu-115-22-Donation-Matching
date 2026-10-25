import { AgencyVerificationFile } from '../../../core/services/agency-verification/agency-verification.service';

export class VerificationDocumentPreview {
  url = '';
  type = '';
  name = '';

  show(file: AgencyVerificationFile): void {
    this.clear();
    const binary = atob(file.bodyBase64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    this.type = file.contentType;
    this.name = file.fileName;
    this.url = URL.createObjectURL(new Blob([bytes], { type: file.contentType }));
  }

  clear(): void {
    if (this.url) {
      URL.revokeObjectURL(this.url);
    }

    this.url = '';
    this.type = '';
    this.name = '';
  }
}
