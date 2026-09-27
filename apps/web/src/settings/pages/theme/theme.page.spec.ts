import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemePage } from './theme.page';

describe('ThemePage', () => {
  let component: ThemePage;
  let fixture: ComponentFixture<ThemePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ThemePage ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ThemePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
