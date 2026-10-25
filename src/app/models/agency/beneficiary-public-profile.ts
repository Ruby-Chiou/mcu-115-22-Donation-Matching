/** 捐助者可看的受助機構公開資料。不含經辦人、證件與證明文件。 */
export interface BeneficiaryPublicProfile {
  organizationName: string;
  city: string;
  image: string;
  /** 受助機構自行上傳、用來介紹自己的圖片。 */
  introImages: string[];
  establishedYear: string;
  registrationLabel: string;
  serviceArea: string;
  serviceTargets: string[];
  publicPhone: string;
  mission: string;
  background: string;
  verified: boolean;
}
