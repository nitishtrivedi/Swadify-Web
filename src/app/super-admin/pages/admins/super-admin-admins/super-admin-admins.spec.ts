import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminAdmins } from './super-admin-admins';

describe('SuperAdminAdmins', () => {
  let component: SuperAdminAdmins;
  let fixture: ComponentFixture<SuperAdminAdmins>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminAdmins]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminAdmins);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
