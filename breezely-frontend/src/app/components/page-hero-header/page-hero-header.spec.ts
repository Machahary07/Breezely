import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeroHeader } from './page-hero-header';

describe('PageHeroHeader', () => {
  let component: PageHeroHeader;
  let fixture: ComponentFixture<PageHeroHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeroHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeroHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
