import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformGuideComponent } from './platform-guide.component';

describe('PlatformGuideComponent', () => {
  let component: PlatformGuideComponent;
  let fixture: ComponentFixture<PlatformGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
