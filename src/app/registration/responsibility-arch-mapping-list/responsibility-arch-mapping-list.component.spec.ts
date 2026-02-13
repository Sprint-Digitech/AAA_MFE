import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityArchMappingListComponent } from './responsibility-arch-mapping-list.component';

describe('ResponsibilityArchMappingListComponent', () => {
  let component: ResponsibilityArchMappingListComponent;
  let fixture: ComponentFixture<ResponsibilityArchMappingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponsibilityArchMappingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsibilityArchMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
