import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchProbationSettingsListComponent } from './branch-probation-settings-list.component';

describe('BranchProbationSettingsListComponent', () => {
  let component: BranchProbationSettingsListComponent;
  let fixture: ComponentFixture<BranchProbationSettingsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchProbationSettingsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchProbationSettingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
