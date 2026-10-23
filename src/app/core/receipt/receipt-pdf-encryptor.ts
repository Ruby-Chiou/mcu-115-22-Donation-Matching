/** 只負責把已完成的 PDF 加上開啟密碼。 */
export interface ReceiptPdfEncryptor {
  protect(pdf: Uint8Array, userPassword: string): Promise<Uint8Array>;
}
