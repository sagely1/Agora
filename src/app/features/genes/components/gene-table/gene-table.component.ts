// -------------------------------------------------------------------------- //
// External
// -------------------------------------------------------------------------- //
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import screenfull from 'screenfull';

// -------------------------------------------------------------------------- //
// Internal
// -------------------------------------------------------------------------- //
import { Gene, GeneTableColumn } from '../../../../models';
import { HelperService } from '../../../../core/services';

// -------------------------------------------------------------------------- //
// Component
// -------------------------------------------------------------------------- //
@Component({
  selector: 'gene-table',
  templateUrl: './gene-table.component.html',
  styleUrls: ['./gene-table.component.scss'],
})
export class GeneTableComponent implements OnInit {
  _genes: Gene[] = [];
  get genes(): Gene[] {
    return this._genes;
  }
  @Input() set genes(genes: Gene[]) {
    this._genes = genes.map((gene) => {
      gene.hgnc_symbol = gene.hgnc_symbol || gene.ensembl_gene_id;
      return gene;
    });
  }

  // Search ----------------------------------------------------------------- //

  _searchTerm = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  @Input() set searchTerm(term: string) {
    this._searchTerm = term;
    this.table.filterGlobal(this._searchTerm, 'contains');
  }

  // Columns ---------------------------------------------------------------- //

  @Input() requiredColumns: string[] = ['hgnc_symbol'];
  optionalColumns: GeneTableColumn[] = [];

  _columns: GeneTableColumn[] = [
    { field: 'hgnc_symbol', header: 'Gene Symbol', selected: true },
    { field: 'ensembl_gene_id', header: 'Ensembl Gene ID', selected: true },
  ];
  @Input() get columns(): GeneTableColumn[] {
    return this._columns;
  }
  set columns(columns: GeneTableColumn[]) {
    this._columns = columns.map((c: GeneTableColumn) => {
      if (!c.width) {
        c.width = Math.max(94 + c.header.length * 12, 250);
      }
      return c;
    });
    this.selectedColumns = this.columns.filter(
      (c: GeneTableColumn) =>
        c.selected || this.requiredColumns.includes(c.field)
    );
    this.optionalColumns = this.columns.filter(
      (c: GeneTableColumn) => !this.requiredColumns.includes(c.field)
    );
  }

  _selectedColumns: GeneTableColumn[] = [];
  @Input() get selectedColumns(): GeneTableColumn[] {
    return this._selectedColumns;
  }
  set selectedColumns(column: GeneTableColumn[]) {
    this._selectedColumns = this.columns.filter((c) => column.includes(c));
  }

  @Input() className = '';
  @Input() heading = 'Nominated Target List';
  @Input() exportFilename = 'gene-list.csv';
  @Input() gctLink: boolean | { [key: string]: string } = false;
  @Input() gctLinkTooltip =
    'Use Agora Gene Comparison Tool to compare all genes in this list.';

  @Input() sortField = '';
  @Input() sortOrder = -1;

  @ViewChild('table', { static: true }) table: Table = {} as Table;

  constructor(private helperService: HelperService, private router: Router) {}

  ngOnInit() {}

  customSort(event: any) {
    event.data.sort((gene1: any, gene2: any) => {
      let result = null;
      let a = null;
      let b = null;

      if ('hgnc_symbol' === event.field) {
        a = gene1.hgnc_symbol || gene1.ensembl_gene_id;
        b = gene2.hgnc_symbol || gene2.ensembl_gene_id;
      } else {
        a = gene1[event.field];
        b = gene2[event.field];
      }

      if (a == null && b != null) {
        result = -1;
      } else if (a != null && b == null) {
        result = 1;
      } else if (a == null && b == null) {
        result = 0;
      } else if (typeof a === 'string' && typeof b === 'string') {
        // Natural sorting for this score type, which can be >= 10
        if (event.field === 'sm_druggability_display_value') {
          let nA = parseInt(a.split(':')[0], 10);
          let nB = parseInt(b.split(':')[0], 10);

          nA = !isNaN(nA) ? nA : 999 * event.order;
          nB = !isNaN(nB) ? nB : 999 * event.order;

          result = nA < nB ? -1 : nA > nB ? 1 : 0;
        } else {
          result = a.localeCompare(b);
        }
      } else {
        result = a < b ? -1 : a > b ? 1 : 0;
      }

      return event.order * (result || 0);
    });
  }

  navigateToGene(gene: any) {
    this.router.navigate(['/genes/' + gene.ensembl_gene_id]);
  }

  isFullscreen() {
    return screenfull && screenfull.isFullscreen;
  }

  getWindowClass(): string {
    return screenfull && !screenfull.isFullscreen
      ? ' pi pi-window-maximize table-icon absolute-icon-left'
      : ' pi pi-window-minimize table-icon absolute-icon-left';
  }

  getFullscreenClass(): string {
    return screenfull && screenfull.isFullscreen ? 'fullscreen-table' : '';
  }

  toggleFullscreen() {
    if (!screenfull.isEnabled) {
      return;
    }

    const el = document.getElementsByClassName('gene-table');

    if (el[0]) {
      if (!screenfull.isFullscreen) {
        screenfull.request(el[0]);
      } else {
        screenfull.exit();
      }
    }
  }

  navigateToGeneComparisonTool() {
    if (typeof this.gctLink === 'object') {
      this.router.navigate(['/genes/comparison'], {
        queryParams: this.gctLink,
      });
    } else {
      const ids: string[] = this._genes.map((g: Gene) => g.ensembl_gene_id);
      this.helperService.setGCTSection(ids);
      this.router.navigate(['/genes/comparison']);
    }
  }
}
