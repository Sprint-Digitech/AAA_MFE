import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMenuMasterComponent } from './add-menu-master.component';

describe('AddMenuMasterComponent', () => {
  let component: AddMenuMasterComponent;
  let fixture: ComponentFixture<AddMenuMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMenuMasterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMenuMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
