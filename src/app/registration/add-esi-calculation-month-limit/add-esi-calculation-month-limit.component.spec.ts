import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEsiCalculationMonthLimitComponent } from './add-esi-calculation-month-limit.component';

describe('AddEsiCalculationMonthLimitComponent', () => {
  let component: AddEsiCalculationMonthLimitComponent;
  let fixture: ComponentFixture<AddEsiCalculationMonthLimitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEsiCalculationMonthLimitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEsiCalculationMonthLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
