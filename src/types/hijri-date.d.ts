declare module 'hijri-date' {
  class HijriDate {
    constructor(date?: Date);
    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
    toString(): string;
  }
  export default HijriDate;
} 