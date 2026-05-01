import { TestBed } from '@angular/core/testing';

import { Dp } from './dp';

describe('Dp', () => {
  let service: Dp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
