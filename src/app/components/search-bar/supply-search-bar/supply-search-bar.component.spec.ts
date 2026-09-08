import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplySearchBarComponent } from './supply-search-bar.component';

describe('SupplySearchBarComponent', () => {
  let component: SupplySearchBarComponent;
  let fixture: ComponentFixture<SupplySearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplySearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplySearchBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
