import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPartners } from './admin-partners';

describe('AdminPartners', () => {
  let component: AdminPartners;
  let fixture: ComponentFixture<AdminPartners>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPartners]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPartners);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
