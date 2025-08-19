import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancePlannerService } from '../../../finance-planner.service';
import { ChartComponent } from "../../shared/chart/chart.component";
import { ChartConfig } from '../../shared/chart/chart-config.model';

@Component({
  selector: 'app-swp-result',
  templateUrl: './swp-result.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ChartComponent]
})
export class SwpResultComponent {
  public viewMode: 'year' | 'month' = 'year';
  public yoyTable: Array<any> = [];
  public momTable: Array<any> = [];
  public yoyChartConfig?: ChartConfig;
  public momChartConfig?: ChartConfig;

  constructor(private financeService: FinancePlannerService) {
    this.financeService.swpPlan$.subscribe(plan => {
      if (plan) {
        this.momTable = plan.momTable || [];
        this.yoyTable = this.buildYoyTableFromMomTable(this.momTable) || [];

        this.renderCharts();
      }
    });
  }

  renderCharts() {
    this.yoyChartConfig = {
      title: 'SWP Plan - Yearly Overview',
      type: 'line',
      labels: this.yoyTable.map(row => row.period),
      datasets: [
        {
          label: 'Corpus Value',
          data: this.yoyTable.map(row => row.corpus),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        },
        {
          label: 'Growth',
          data: this.yoyTable.map(row => row.growth),
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Withdrawal',
          data: this.yoyTable.map(row => row.withdrawal),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        }
      ]
    };

    this.momChartConfig = {
      title: 'SWP Plan - Monthly Overview',
      type: 'line',
      labels: this.momTable.map(row => this.formatMonthYear(row.period)),
      datasets: [
        {
          label: 'Corpus Value',
          data: this.momTable.map(row => row.corpus),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        },
        {
          label: 'Growth',
          data: this.momTable.map(row => row.growth),
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Withdrawal',
          data: this.momTable.map(row => row.withdrawal),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        }
      ]
    };
  }

  private buildYoyTableFromMomTable(momTable: any[]): any[] {
      const yoyMap = new Map<string, any>();
  
      momTable.forEach(entry => {
        const year = new Date(entry.period).getFullYear().toString();
        if (!yoyMap.has(year)) {
          yoyMap.set(year, {
            period: year,
            corpus: entry.corpus,
            growth: 0,
            totalExpenses: 0,
            totalEMI: 0,
            withdrawal: 0
          });
        }
        const data = yoyMap.get(year);
        data.growth += entry.growth;
        data.totalExpenses += entry.totalExpenses;
        data.totalEMI += entry.totalEMI;
        data.withdrawal += entry.withdrawal;
        data.net = data.growth - data.withdrawal;
      });
  
      return yoyMap.size > 0 ? Array.from(yoyMap.values()) : [];
    }

  formatMonthYear(date: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  toggleView(mode: 'year' | 'month') {
    this.viewMode = mode;
  }
}
