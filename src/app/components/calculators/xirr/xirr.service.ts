import { Injectable } from '@angular/core';
import xirr from 'xirr';

@Injectable({
  providedIn: 'root'
})
export class XirrCalculatorService {

  constructor() { }

  // Method to calculate XIRR
  calculateXIRR(cashFlows: { amount: number, when: Date }[]): number {
    try {
      // Call xirr function to calculate XIRR

      // var rate = xirr([
      //   { amount: -1000, when: new Date(2016, 0, 15) },
      //   { amount: -2500, when: new Date(2016, 1, 8) },
      //   { amount: -1000, when: new Date(2016, 3, 17) },
      //   { amount: 5050, when: new Date(2016, 7, 24) },
      // ]);

      var rate = xirr(cashFlows);
      return rate * 100; // Convert to percentage
    } catch (error) {
      console.error('Error calculating XIRR', error);
      return NaN;
    }
  }
}
