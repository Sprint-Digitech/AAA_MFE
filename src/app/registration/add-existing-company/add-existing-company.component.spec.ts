import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExistingCompanyComponent } from './add-existing-company.component';

describe('AddExistingCompanyComponent', () => {
  let component: AddExistingCompanyComponent;
  let fixture: ComponentFixture<AddExistingCompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddExistingCompanyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExistingCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
