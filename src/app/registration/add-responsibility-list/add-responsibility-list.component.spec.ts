import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResponsibilityListComponent } from './add-responsibility-list.component';

describe('AddResponsibilityListComponent', () => {
  let component: AddResponsibilityListComponent;
  let fixture: ComponentFixture<AddResponsibilityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResponsibilityListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResponsibilityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
