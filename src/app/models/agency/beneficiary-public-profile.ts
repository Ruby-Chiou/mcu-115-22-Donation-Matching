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
  /** 登記地址。捐助地圖與機構卡片共用這一行。 */
  address: string;
  /** 機構自己填的官方網站。空字串代表尚未提供。 */
  websiteUrl: string;
  latitude: number | null;
  longitude: number | null;
}
