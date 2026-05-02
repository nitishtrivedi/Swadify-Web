import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminAnalytics } from './super-admin-analytics';

describe('SuperAdminAnalytics', () => {
  let component: SuperAdminAnalytics;
  let fixture: ComponentFixture<SuperAdminAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
