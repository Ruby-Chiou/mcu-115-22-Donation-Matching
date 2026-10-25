import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerCommentPageComponent } from './volunteer-comment-page.component';

describe('VolunteerCommentPageComponent', () => {
  let component: VolunteerCommentPageComponent;
  let fixture: ComponentFixture<VolunteerCommentPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerCommentPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerCommentPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
