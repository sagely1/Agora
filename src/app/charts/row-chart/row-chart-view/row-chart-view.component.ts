import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ChartService } from '../../services';
import { DataService, GeneService } from '../../../core/services';

import * as d3 from 'd3';
import * as dc from 'dc';

// Using a d3 v4 function to get all nodes
d3.selection.prototype['nodes'] = function() {
    const nodes = new Array(this.size());
    let i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
};

@Component({
    selector: 'row-chart',
    templateUrl: './row-chart-view.component.html',
    styleUrls: [ './row-chart-view.component.scss' ],
    encapsulation: ViewEncapsulation.None
})
export class RowChartViewComponent implements OnInit {
    @Input() title: string;
    @Input() chart: any;
    @Input() info: any;
    @Input() label: string = 'forest-plot';
    @Input() currentGene = this.geneService.getCurrentGene();
    @Input() dim: any;
    @Input() group: any;
    @Input() paddingLR: number = 15;
    @Input() paddingUD: number = 0;

    @ViewChild('chart') rowChart: ElementRef;
    @ViewChild('studies') stdCol: ElementRef;

    changedLabels: boolean = false;
    display: boolean = false;
    colors: string[] = ['#5171C0'];

    private resizeTimer;

    constructor(
        private dataService: DataService,
        private geneService: GeneService,
        private chartService: ChartService,
        private decimalPipe: DecimalPipe
    ) { }

    ngOnInit() {
        this.initChart();
    }

    initChart() {
        const self = this;
        this.info = this.chartService.getChartInfo(this.label);
        this.dim = this.dataService.getDimension(
            this.info,
            this.currentGene
        );
        this.group = this.dataService.getGroup(this.info);

        this.title = this.info.title;
        this.chart = dc.rowChart(this.rowChart.nativeElement);
        this.chart
            .gap(4)
            .title(function(d) {
                return 'Log Fold Change: ' + self.decimalPipe.transform(+d.value.logfc, '1.3');
            })
            .valueAccessor((d) => {
                return +self.decimalPipe.transform(+d.value.logfc, '1.3');
            })
            .label((d) => {
                return d.key;
            })
            .on('preRender', (chart) => {
                self.updateXDomain(chart);
            })
            .on('preRedraw', (chart) => {
                self.updateXDomain(chart);
            })
            .othersGrouper(null)
            .ordinalColors(this.colors)
            .dimension(this.dim)
            .group(this.group)
            .transitionDuration(0);

        // Increase bottom margin by 20 to place a label there, default is 30
        this.chart.margins().bottom = 50;

        // Removes the click event for the rowChart to prevent filtering
        this.chart.onClick = () => {
            //
        };

        // Register the row chart renderlet
        this.registerChartEvent(this.chart);

        this.chart.render();
    }

    addXLabel(chart: dc.RowChart, text: string) {
        const textSelection = chart.svg()
                .append('text')
                .attr('class', 'x-axis-label')
                .attr('text-anchor', 'middle')
                .attr('x', chart.width() / 2)
                .attr('y', chart.height() - 10)
                .text(text);

        this.adjustXLabel(chart, textSelection);
    }

    adjustXLabel(chart: dc.RowChart, sel: any) {
        const svgEl = (sel.node() as SVGGraphicsElement);
        const textDims = svgEl.getBBox();

        // Dynamically adjust positioning after reading text dimension from DOM
        // The main svg gets translated by (30, 10) and the flex row has a margin
        // of 15 pixels. We subtract them from the svg size, get the middle point
        // then add back the left translate to get the correct center
        sel
            .attr('x', ((chart.width() - 45) / 2) + 30)
            .attr('y', chart.height() - Math.ceil(textDims.height) / 2);
    }

    // A custom renderlet function for this chart, allows us to change
    // what happens to the chart after rendering
    registerChartEvent(chartEl: dc.RowChart, type: string = 'renderlet') {
        const self = this;
        // Using a different name for the chart variable here so it's not shadowed
        chartEl.on(type, (chart) => {
            const rectHeight = parseInt(chart.select('g.row rect').attr('height'), 10);
            const squareSize = 18;
            const lineWidth = 60;

            // Test if we should display the chart. Using this variable so we don't see
            // the rows rectangles change into small squares abruptly
            if (!self.display) {
                // Copy all vertical texts to another div, so they don't get hidden by
                // the row chart svg after being translated
                self.moveTextToElement(chart, self.stdCol.nativeElement, squareSize / 2);

                // Insert a line for each row of the chart
                self.insertLinesInRows(chart);

                // Add a label to the x axis
                self.addXLabel(this.chart, 'log fold change');
            } else {
                // This part will be called on redraw after filtering, so at this point
                // we just need to move the lines to the correct position again. First
                // translate the parent element
                const hlines = chart.selectAll('g.row g.hline');
                hlines.each(function(p, i) {
                    d3.select(this).attr('transform', function(d: any) {
                        return 'translate(' + d.value.logfc + ')';
                    });
                });

                // Adjust the x label
                this.adjustXLabel(chart, chart.select('text.x-axis-label'));
            }

            // Finally redraw the lines in each row
            self.drawLines(chart, rectHeight / 2, lineWidth);

            // Change the row rectangles into small squares, this happens on
            // every render or redraw
            self.rectToSquares(chart, squareSize, rectHeight);

            // Only show the 0, min and max values on the xAxis ticks
            self.updateXTicks(chart);

            // Finally show the chart
            self.display = true;
        });
    }

    updateXDomain(chart: dc.RowChart) {
        // Draw the horizontal lines
        const currentGenes = this.dataService.getGeneEntries().slice().filter((g) => {
            return g.model === this.geneService.getCurrentModel();
        });
        let max = -Infinity;
        currentGenes.forEach((g) => {
            if (Math.abs(+g.ci_l) > max) {
                max = Math.abs(+g.ci_l);
            }
            if (Math.abs(+g.ci_r) > max) {
                max = Math.abs(+g.ci_r);
            }
        });
        if (max !== +Infinity) {
            chart.x(d3.scaleLinear().range([0, (chart.width() - 50)]).domain([-max, max]));
            chart.xAxis().scale(chart.x());
        }
    }

    updateXTicks(chart: dc.RowChart) {
        const allTicks = chart.selectAll('g.axis g.tick');
        allTicks.each(function(t, i) {
            if (i > 0 && i < allTicks.size() - 1) {
                if (parseFloat(d3.select(this).select('text').text())) {
                    d3.select(this).select('text').style('opacity', 0);
                }
            }
        });
    }

    adjustTextToElement(el: HTMLElement) {
        d3.select(el).selectAll('g.textGroup text').each(function(d, i) {
            const pRigth = parseInt(d3.select(el).style('padding-right'), 10);
            const transfString = d3.select(this).attr('transform');
            const translateString = transfString.substring(
                transfString.indexOf('(') + 1,
                transfString.indexOf(')')
            );
            const translate = (translateString.split(',').length > 1) ?
                translateString.split(',') :
                translateString.split(' ');
            const transfX = parseFloat(d3.select(el).select('svg').style('width')) - pRigth;
            d3.select(this)
                .attr('transform', () => {
                    return 'translate(' + transfX + ',' + parseFloat(translate[1]) + ')';
                });
        });
    }

    // Moves all text in textGroups to a new HTML element
    moveTextToElement(chart: dc.RowChart, el: HTMLElement, vSpacing: number = 0) {
        const newSvg = d3.select(el).append('svg');
        const textGroup = newSvg.append('g').attr('class', 'textGroup');

        // Remove the old texts and append to the new group
        const allText = chart.selectAll('g.row text');
        const removed = allText.remove();
        removed['nodes']().forEach((n) => {
            textGroup.append(function() {
                return n;
            });
        });

        // Move the text to the correct position in the new svg
        const svgEl = (chart.select('g.axis g.tick line.grid-line').node() as SVGGraphicsElement);
        const step = svgEl.getBBox().height / (removed['nodes']().length);

        d3.select(el).selectAll('g.textGroup text').each(function(d, i) {
            const currentStep = step * i;
            const transfX = parseFloat(newSvg.style('width')) -
                parseFloat(d3.select(el).style('padding-right'));
            d3.select(this)
                .attr('text-anchor', 'end')
                .attr('transform', () => {
                    return 'translate(' + transfX + ',' + (currentStep + (vSpacing)) + ')';
                });
        });
    }

    insertLinesInRows(chart: dc.RowChart) {
        chart.selectAll('g.row')
            .insert('g', ':first-child')
            .attr('class', 'hline')
            .insert('line');
    }

    // Draw the lines through the chart rows and a vertical line at
    // x = 0
    drawLines(chart: dc.RowChart, yPos: number, lineWidth: number) {
        const self = this;
        // Hide all vertical lines except one at x = 0
        chart.selectAll('g.axis g.tick').each(function() {
            if (parseFloat(d3.select(this).select('text').text())) {
                d3.select(this).select('.grid-line').style('opacity', 0);
            } else {
                d3.select(this).select('.grid-line')
                    .style('stroke', '#BCC0CA')
                    .style('stroke-width', '2px')
                    .style('opacity', 1);
            }
        });

        // Draw the horizontal lines
        const currentGenes = this.dataService.getGeneEntries().slice().filter((g) => {
            return g.model === this.geneService.getCurrentModel();
        });
        chart.selectAll('g.row g.hline line')
            .attr('stroke-width', 1.5)
            .attr('stroke', (d, i) => {
                return self.colors[0];
            })
            // ES6 method shorthand for object literals
            .attr('x1', (d) => {
                const gene = currentGenes.slice().find((g) => {
                    return +self.decimalPipe.transform(+d.value.logfc, '1.3')
                        === g.logfc;
                });

                if (gene) {
                    return chart.x()(gene.ci_l);
                } else {
                    return chart.x()(d.value.logfc) - lineWidth / 2;
                }
            })
            .attr('y1', () => {
                return yPos;
            })
            .attr('x2', (d) => {
                const gene = currentGenes.slice().find((g) => {
                    return +self.decimalPipe.transform(+d.value.logfc, '1.3')
                        === g.logfc;
                });

                if (gene) {
                    return chart.x()(gene.ci_r);
                } else {
                    return chart.x()(d.value.logfc) + lineWidth / 2;
                }
            })
            .attr('y2', () => {
                return yPos;
            });
    }

    // Changes the chart row rects into squares of the square size
    rectToSquares(chart: dc.RowChart, squareSize: number, rectHeight: number) {
        chart
            .selectAll('g.row rect')
            .attr('transform', function(d) {
                return 'translate(' +
                    // X translate
                    (chart.x()(d.value.logfc) - (squareSize / 2)) +
                    ',' +
                    // Y translate
                    ((rectHeight / 2) - (squareSize / 2)) +
                ')';
            })
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('rx', squareSize / 2)
            .attr('ry', squareSize / 2);
    }

    displayChart() {
        return { opacity: (this.display) ? 1 : 0 };
    }

    onResize() {
        const self = this;

        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            self.chart
                .width(
                    self.rowChart.nativeElement.parentElement.offsetWidth - (self.paddingLR * 2)
                )
                .height(self.rowChart.nativeElement.offsetHeight  - (self.paddingUD * 2));

            if (self.chart.rescale) {
                self.chart.rescale();
            }

            // Adjust the text as the svg reduces its width
            self.adjustTextToElement(self.stdCol.nativeElement);

            // Run code here, resizing has "stopped"
            self.chart.redraw();
        }, 100);
    }
}
