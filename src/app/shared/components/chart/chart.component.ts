import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ChartConfig } from './chart-config.model';

declare const Chart: any; // because it's from CDN

@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.css'],
})
export class ChartComponent {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
    @Input() chartConfig!: ChartConfig;
    chart: any;

    ngOnChanges() {
        this.destroyChart();
        setTimeout(() => {
            this.renderChart();
        }, 0);
    }

    renderChart() {
        if (!this.chartConfig || !this.chartCanvas) return;

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const datasets = this.chartConfig.datasets.map((ds, index) => ({
            label: ds.label,
            data: ds.data,
            fill: true,
            tension: 0.4,
            borderColor: ds.borderColor || this.getColor(index),
            backgroundColor: ds.backgroundColor || this.getColor(index, 0.2),
        }));

        this.chart = new Chart(ctx, {
            type: this.chartConfig.type || 'line',
            data: {
                labels: this.chartConfig.labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: !!this.chartConfig.title,
                        text: this.chartConfig.title
                    }
                }
            }
        });
    }

    getColor(index: number, alpha = 1): string {
        const colors = [
            [255, 99, 132],
            [54, 162, 235],
            [255, 206, 86],
            [75, 192, 192],
            [153, 102, 255],
            [255, 159, 64]
        ];
        const [r, g, b] = colors[index % colors.length];
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}
