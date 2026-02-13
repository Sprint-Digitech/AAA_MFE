import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EsiCalculationMonthListComponent } from './esi-calculation-month-list.component';

describe('EsiCalculationMonthListComponent', () => {
  let component: EsiCalculationMonthListComponent;
  let fixture: ComponentFixture<EsiCalculationMonthListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsiCalculationMonthListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EsiCalculationMonthListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
