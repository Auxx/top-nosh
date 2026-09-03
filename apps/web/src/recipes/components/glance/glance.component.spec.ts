import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlanceComponent } from './glance.component';

describe('GlanceComponent', () => {
  let component: GlanceComponent;
  let fixture: ComponentFixture<GlanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GlanceComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GlanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
