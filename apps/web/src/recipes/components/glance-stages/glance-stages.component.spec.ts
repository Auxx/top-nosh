import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlanceStagesComponent } from './glance-stages.component';

describe('GlanceStagesComponent', () => {
  let component: GlanceStagesComponent;
  let fixture: ComponentFixture<GlanceStagesComponent>;

  const recipe = {
    stages: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GlanceStagesComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GlanceStagesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', recipe);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
