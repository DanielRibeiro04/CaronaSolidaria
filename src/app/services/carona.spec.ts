import { TestBed } from '@angular/core/testing';

import { Carona } from './carona';

describe('Carona', () => {
  let service: Carona;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Carona);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
