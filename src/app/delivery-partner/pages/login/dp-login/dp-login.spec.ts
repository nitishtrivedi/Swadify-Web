import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpLogin } from './dp-login';

describe('DpLogin', () => {
  let component: DpLogin;
  let fixture: ComponentFixture<DpLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
