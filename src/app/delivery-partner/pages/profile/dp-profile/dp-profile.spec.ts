import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpProfile } from './dp-profile';

describe('DpProfile', () => {
  let component: DpProfile;
  let fixture: ComponentFixture<DpProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
