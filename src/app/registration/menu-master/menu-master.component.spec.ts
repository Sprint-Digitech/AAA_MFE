import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuMasterComponent } from './menu-master.component';

describe('MenuMasterComponent', () => {
  let component: MenuMasterComponent;
  let fixture: ComponentFixture<MenuMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuMasterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
