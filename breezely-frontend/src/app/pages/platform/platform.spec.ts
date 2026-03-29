import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Platform } from './platform';

describe('Platform', () => {
  let component: Platform;
  let fixture: ComponentFixture<Platform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Platform],
    }).compileComponents();

    fixture = TestBed.createComponent(Platform);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
