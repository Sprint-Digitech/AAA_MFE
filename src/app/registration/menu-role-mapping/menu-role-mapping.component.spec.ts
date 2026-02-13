import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuRoleMappingComponent } from './menu-role-mapping.component';

describe('MenuRoleMappingComponent', () => {
  let component: MenuRoleMappingComponent;
  let fixture: ComponentFixture<MenuRoleMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuRoleMappingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuRoleMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
