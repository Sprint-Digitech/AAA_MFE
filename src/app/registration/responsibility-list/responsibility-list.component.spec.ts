import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityListComponent } from './responsibility-list.component';

describe('ResponsibilityListComponent', () => {
  let component: ResponsibilityListComponent;
  let fixture: ComponentFixture<ResponsibilityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponsibilityListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsibilityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
