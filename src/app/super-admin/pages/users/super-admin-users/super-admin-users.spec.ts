import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminUsers } from './super-admin-users';

describe('SuperAdminUsers', () => {
  let component: SuperAdminUsers;
  let fixture: ComponentFixture<SuperAdminUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminUsers],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperAdminUsers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
