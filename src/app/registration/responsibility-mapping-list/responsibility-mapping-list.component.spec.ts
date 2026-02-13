import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityMappingListComponent } from './responsibility-mapping-list.component';

describe('ResponsibilityMappingListComponent', () => {
  let component: ResponsibilityMappingListComponent;
  let fixture: ComponentFixture<ResponsibilityMappingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponsibilityMappingListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsibilityMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
