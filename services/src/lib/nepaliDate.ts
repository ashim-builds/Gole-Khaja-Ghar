/**
 * Bikram Sambat (BS) Calendar Converter & Nepali Date Utility
 * Provides accurate conversion between Gregorian (AD) and Bikram Sambat (BS).
 */

export const NEPALI_MONTHS = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export const NEPALI_MONTHS_NEP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
] as const;

// Days count per month for Bikram Sambat years 2070 BS to 2090 BS (2013 AD to 2034+ AD)
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2070: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

// Reference point: 2070-01-01 BS = 2013-04-14 AD (Sunday)
const REF_BS_YEAR = 2070;
const REF_AD_DATE = new Date(Date.UTC(2013, 3, 14)); // 2013-04-14 UTC

export interface NepaliDateInfo {
  yearBS: number;
  monthBS: number; // 1-12
  dayBS: number; // 1-32
  monthName: string;
  monthNameNep: string;
  dayOfWeek: number; // 0 = Sun, 2 = Tue
  dayName: string;
  formattedBS: string;
  isFirstTuesdayBS: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Converts a JS Date (in Nepal time) to Bikram Sambat (BS) date representation.
 */
export function getNepaliDate(adDateInput: Date = new Date()): NepaliDateInfo {
  // Ensure Nepal Time (UTC+5:45)
  const utcMs = adDateInput.getTime() + adDateInput.getTimezoneOffset() * 60000;
  const nepalMs = utcMs + (5 * 60 + 45) * 60000;
  const nepalDate = new Date(nepalMs);

  // Calculate day difference from reference date
  const adMidnight = Date.UTC(nepalDate.getFullYear(), nepalDate.getMonth(), nepalDate.getDate());
  const refMidnight = Date.UTC(REF_AD_DATE.getUTCFullYear(), REF_AD_DATE.getUTCMonth(), REF_AD_DATE.getUTCDate());

  let diffDays = Math.round((adMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  let yearBS = REF_BS_YEAR;
  let monthBS = 1;
  let dayBS = 1;

  if (diffDays >= 0) {
    while (diffDays > 0) {
      const monthDays = BS_CALENDAR_DATA[yearBS] || [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30];
      const daysInCurrentMonth = monthDays[monthBS - 1];

      if (diffDays >= daysInCurrentMonth) {
        diffDays -= daysInCurrentMonth;
        monthBS++;
        if (monthBS > 12) {
          monthBS = 1;
          yearBS++;
        }
      } else {
        dayBS += diffDays;
        diffDays = 0;
      }
    }
  }

  const dayOfWeek = nepalDate.getDay(); // 0 = Sun, 2 = Tue
  // First Tuesday of the Nepali month is when dayOfWeek === 2 (Tuesday) and dayBS <= 7
  const isFirstTuesdayBS = dayOfWeek === 2 && dayBS <= 7;

  const monthName = NEPALI_MONTHS[monthBS - 1] || 'Baisakh';
  const monthNameNep = NEPALI_MONTHS_NEP[monthBS - 1] || 'बैशाख';
  const dayName = DAY_NAMES[dayOfWeek];

  const formattedBS = `${monthName} ${dayBS}, ${yearBS} BS`;

  return {
    yearBS,
    monthBS,
    dayBS,
    monthName,
    monthNameNep,
    dayOfWeek,
    dayName,
    formattedBS,
    isFirstTuesdayBS,
  };
}
