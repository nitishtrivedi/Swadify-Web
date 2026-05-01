import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpEarnings } from './dp-earnings';

describe('DpEarnings', () => {
  let component: DpEarnings;
  let fixture: ComponentFixture<DpEarnings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpEarnings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpEarnings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
