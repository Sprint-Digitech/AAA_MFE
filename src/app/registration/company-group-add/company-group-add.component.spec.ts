import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyGroupAddComponent } from './company-group-add.component';

describe('CompanyGroupAddComponent', () => {
  let component: CompanyGroupAddComponent;
  let fixture: ComponentFixture<CompanyGroupAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyGroupAddComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyGroupAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
