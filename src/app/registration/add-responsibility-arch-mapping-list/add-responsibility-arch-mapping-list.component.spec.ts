import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResponsibilityArchMappingListComponent } from './add-responsibility-arch-mapping-list.component';

describe('AddResponsibilityArchMappingListComponent', () => {
  let component: AddResponsibilityArchMappingListComponent;
  let fixture: ComponentFixture<AddResponsibilityArchMappingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResponsibilityArchMappingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResponsibilityArchMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
