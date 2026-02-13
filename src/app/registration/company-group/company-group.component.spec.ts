import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyGroupComponent } from './company-group.component';

describe('CompanyGroupComponent', () => {
  let component: CompanyGroupComponent;
  let fixture: ComponentFixture<CompanyGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyGroupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
