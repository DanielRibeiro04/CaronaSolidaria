import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OferecerCaronaPage } from './oferecer-carona.page';

describe('OferecerCaronaPage', () => {
  let component: OferecerCaronaPage;
  let fixture: ComponentFixture<OferecerCaronaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OferecerCaronaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
