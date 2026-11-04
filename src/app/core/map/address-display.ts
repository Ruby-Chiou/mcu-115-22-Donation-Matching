/** 地址顯示只保留到區／鄉鎮市（避免各頁重複 regex）。 */
export function regionFromAddress(address: string | undefined | null): string {
  if (!address) {
    return '';
  }

  const match = address.match(/^(.*?[縣市].*?[區鄉鎮市])/);
  return match ? match[1] : address;
}
