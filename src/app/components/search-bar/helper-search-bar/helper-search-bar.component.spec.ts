import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperSearchBarComponent } from './helper-search-bar.component';

describe('HelperSearchBarComponent', () => {
  let component: HelperSearchBarComponent;
  let fixture: ComponentFixture<HelperSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperSearchBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
