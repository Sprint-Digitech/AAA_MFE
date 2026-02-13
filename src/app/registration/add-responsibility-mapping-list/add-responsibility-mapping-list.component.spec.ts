import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResponsibilityMappingListComponent } from './add-responsibility-mapping-list.component';

describe('AddResponsibilityMappingListComponent', () => {
  let component: AddResponsibilityMappingListComponent;
  let fixture: ComponentFixture<AddResponsibilityMappingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResponsibilityMappingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResponsibilityMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
