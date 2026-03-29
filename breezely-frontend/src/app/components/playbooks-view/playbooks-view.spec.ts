import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybooksView } from './playbooks-view';

describe('PlaybooksView', () => {
  let component: PlaybooksView;
  let fixture: ComponentFixture<PlaybooksView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybooksView],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybooksView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
