import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminCustomers } from './super-admin-customers';

describe('SuperAdminCustomers', () => {
  let component: SuperAdminCustomers;
  let fixture: ComponentFixture<SuperAdminCustomers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminCustomers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminCustomers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
