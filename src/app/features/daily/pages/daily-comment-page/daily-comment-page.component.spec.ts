import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyCommentPageComponent } from './daily-comment-page.component';

describe('DailyCommentPageComponent', () => {
  let component: DailyCommentPageComponent;
  let fixture: ComponentFixture<DailyCommentPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyCommentPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyCommentPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
