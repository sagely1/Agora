import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

import {
    RouterOutletStubComponent
} from '../../testing';

import { GenesViewComponent } from './';

describe('Component: GenesView', () => {
    let component: GenesViewComponent;
    let fixture: ComponentFixture<GenesViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GenesViewComponent,
                RouterOutletStubComponent
            ],
            // The NO_ERRORS_SCHEMA tells the Angular compiler to ignore unrecognized
            // elements and attributes
            schemas: [ NO_ERRORS_SCHEMA ]
        })
        .compileComponents();

        fixture = TestBed.createComponent(GenesViewComponent);

        component = fixture.componentInstance; // Component test instance
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have two router-outlets', () => {
        const el = fixture.debugElement.query(By.css('router-outlet'));
        expect(el).toBeDefined();

        const aEl = fixture.debugElement.queryAll(By.css('router-outlet'));
        expect(aEl.length).toEqual(2);
    });
});
