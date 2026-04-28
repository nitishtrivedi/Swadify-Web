import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartMini } from './cart-mini';

describe('CartMini', () => {
  let component: CartMini;
  let fixture: ComponentFixture<CartMini>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartMini]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartMini);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
