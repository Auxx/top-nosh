import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionHeaderComponent } from './section-header.component';

describe('SectionHeaderComponent', () => {
  let component: SectionHeaderComponent;
  let fixture: ComponentFixture<SectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SectionHeaderComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'title');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an h2 by default', () => {
    expect(fixture.nativeElement.querySelector('h2')).not.toBeNull();
  });

  it('renders the requested level', async () => {
    fixture.componentRef.setInput('level', 3);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h3')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
  });

  it('omits the description element when there is none', () => {
    expect(fixture.nativeElement.querySelector('.description')).toBeNull();
  });

  it('renders the description when given', async () => {
    fixture.componentRef.setInput('description', 'Desc');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.description').textContent.trim()).toBe('Desc');
  });
});
