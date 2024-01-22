// -------------------------------------------------------------------------- //
// External
// -------------------------------------------------------------------------- //
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// -------------------------------------------------------------------------- //
// Internal
// -------------------------------------------------------------------------- //
import { GeneEvidenceProteomicsComponent } from './';
import { GeneService } from '../../services';
import { ApiService, HelperService } from '../../../../core/services';

// -------------------------------------------------------------------------- //
// Tests
// -------------------------------------------------------------------------- //
describe('Component: Gene Proteomics', () => {
  let fixture: ComponentFixture<GeneEvidenceProteomicsComponent>;
  let component: GeneEvidenceProteomicsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GeneEvidenceProteomicsComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [GeneService, ApiService, HelperService],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(GeneEvidenceProteomicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create the right tooltip text', () => {
    const item = 
      {
        '_id': '65a5f61467fa5462e23fe5eb',
        'uniqid': 'PLEC|Q15149',
        'hgnc_symbol': 'PLEC',
        'uniprotid': 'Q15149',
        'ensembl_gene_id': 'ENSG00000178209',
        'tissue': 'DLPFC',
        'log2_fc': 0.111785229513828,
        'ci_upr': 0.147173483154117,
        'ci_lwr': 0.0763969758735386,
        'pval': 4.54382282575789e-9,
        'cor_pval': 0.00000174186460237858
      };
    const tooltipText = component.getTooltipText(item);
    const expected = 'PLEC is significantly differentially expressed in DLPFC with a log fold change value of 0.112 and an adjusted p-value of 0.00000174.';
    expect(tooltipText).toBe(expected);
  });
});
