import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpOrders } from './dp-orders';

describe('DpOrders', () => {
  let component: DpOrders;
  let fixture: ComponentFixture<DpOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpOrders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
