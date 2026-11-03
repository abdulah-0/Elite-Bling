/**
 * Supported Pakistani Banks & E-Wallets Directory for Swich PayOut (IBFT)
 * BankCode and BankName match Swich / 1Link designated routing codes.
 */
export const SUPPORTED_BANKS = [
  { code: '0033', name: 'Meezan Bank Limited', shortName: 'Meezan' },
  { code: '0002', name: 'Habib Bank Limited', shortName: 'HBL' },
  { code: '0005', name: 'United Bank Limited', shortName: 'UBL' },
  { code: '0014', name: 'Bank Alfalah Limited', shortName: 'Alfalah' },
  { code: '0003', name: 'MCB Bank Limited', shortName: 'MCB' },
  { code: '0016', name: 'Faysal Bank Limited', shortName: 'Faysal' },
  { code: '0001', name: 'National Bank of Pakistan', shortName: 'NBP' },
  { code: '0004', name: 'Allied Bank Limited', shortName: 'ABL' },
  { code: '0015', name: 'Bank of Punjab', shortName: 'BOP' },
  { code: '0019', name: 'Standard Chartered Bank', shortName: 'Standard Chartered' },
  { code: '0020', name: 'Askari Bank Limited', shortName: 'Askari' },
  { code: '0023', name: 'Soneri Bank Limited', shortName: 'Soneri' },
  { code: '0025', name: 'Habib Metropolitan Bank', shortName: 'Habib Metro' },
  { code: '0026', name: 'BankIslami Pakistan Limited', shortName: 'BankIslami' },
  { code: '0029', name: 'Al Baraka Bank Limited', shortName: 'Al Baraka' },
  { code: '0032', name: 'Dubai Islamic Bank Pakistan', shortName: 'DIB' },
  { code: '0036', name: 'JS Bank Limited', shortName: 'JS Bank' },
  { code: '0040', name: 'Sindh Bank Limited', shortName: 'Sindh Bank' },
  // Microfinance & E-wallets
  { code: '0085', name: 'Telenor Microfinance Bank (Easypaisa)', shortName: 'Easypaisa' },
  { code: '0084', name: 'Mobilink Microfinance Bank (JazzCash)', shortName: 'JazzCash' },
  { code: '0086', name: 'NayaPay Private Limited', shortName: 'NayaPay' },
  { code: '0087', name: 'SadaPay Private Limited', shortName: 'SadaPay' },
  { code: '0088', name: 'Finja Digital Services', shortName: 'Finja' },
  { code: '0081', name: 'U Microfinance Bank (UPaisa)', shortName: 'UPaisa' },
]

/**
 * Validates and retrieves bank info by BankCode
 */
export function getBankByCode(code) {
  if (!code) return null
  return SUPPORTED_BANKS.find((b) => b.code === String(code).trim()) || null
}

/**
 * Validates if a bank code exists
 */
export function isValidBankCode(code) {
  return Boolean(getBankByCode(code))
}
