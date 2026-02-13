import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBranchProbationSettingsComponent } from './add-branch-probation-settings.component';

describe('AddBranchProbationSettingsComponent', () => {
  let component: AddBranchProbationSettingsComponent;
  let fixture: ComponentFixture<AddBranchProbationSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBranchProbationSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBranchProbationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
