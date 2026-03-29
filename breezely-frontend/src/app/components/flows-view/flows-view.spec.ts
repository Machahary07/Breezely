import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsView } from './flows-view';

describe('FlowsView', () => {
  let component: FlowsView;
  let fixture: ComponentFixture<FlowsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowsView],
    }).compileComponents();

    fixture = TestBed.createComponent(FlowsView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
