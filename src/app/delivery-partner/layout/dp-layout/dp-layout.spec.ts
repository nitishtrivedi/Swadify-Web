import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpLayout } from './dp-layout';

describe('DpLayout', () => {
  let component: DpLayout;
  let fixture: ComponentFixture<DpLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
