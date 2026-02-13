import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMenuRoleMappingComponent } from './edit-menu-role-mapping.component';

describe('EditMenuRoleMappingComponent', () => {
  let component: EditMenuRoleMappingComponent;
  let fixture: ComponentFixture<EditMenuRoleMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditMenuRoleMappingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMenuRoleMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
