import {
    async,
    ComponentFixture,
    TestBed
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
    ActivatedRouteStub,
    GeneServiceStub,
    mockInfo1
} from '../../../testing';

import { GeneDruggabilityComponent } from './gene-druggability.component';

import { MoreInfoComponent } from 'app/dialogs/more-info';

import { GeneService } from '../../../core/services';

import { Table } from 'primeng/table';

import { MockComponent } from 'ng-mocks';

describe('Component: GeneDruggability', () => {
    let component: GeneDruggabilityComponent;
    let fixture: ComponentFixture<GeneDruggabilityComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GeneDruggabilityComponent,
                MockComponent(MoreInfoComponent),
                MockComponent(Table),
                MockComponent(GeneDruggabilityComponent)
            ],
            // The NO_ERRORS_SCHEMA tells the Angular compiler to ignore unrecognized
            // elements and attributes
            schemas: [ NO_ERRORS_SCHEMA ],
            providers: [
                { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
                { provide: GeneService, useValue: new GeneServiceStub() }
            ]
        })
        .compileComponents();

        fixture = TestBed.createComponent(GeneDruggabilityComponent);

        component = fixture.componentInstance; // Component test instance

        component.geneInfo = mockInfo1;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a table', () => {
        const el = fixture.debugElement.query(By.css('p-table'));
        expect(el).toBeDefined();

        const aEl = fixture.debugElement.queryAll(By.css('p-table'));
        expect(aEl.length).toEqual(1);
    });

    it('should have extra info component', () => {
        const el = fixture.debugElement.query(By.css('more-info'));
        expect(el).toBeDefined();

        // When using ng-mocks, we need to pick the component instance,
        // pass in the input value so we can assert it after
        const ci = el.componentInstance as MoreInfoComponent;
        ci.name = 'dg';
        fixture.detectChanges();
        expect(ci.name).toEqual('dg');

        const aEl = fixture.debugElement.queryAll(By.css('more-info'));
        expect(aEl.length).toEqual(1);
    });
});
