import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '../../transloco-testing.module';
import { NeedsAttentionPage } from './needs-attention.page';

jest.mock('../../../environments/environment', () => ({
  environment: () => ({ dataRequiredUid: '1000', dataRequiredGid: '1000' })
}));

describe('NeedsAttentionPage', () => {
  let component: NeedsAttentionPage;
  let fixture: ComponentFixture<NeedsAttentionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NeedsAttentionPage, getTranslocoModule() ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NeedsAttentionPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows chown command with uid and gid', () => {
    const code: HTMLElement = fixture.nativeElement.querySelector('code');

    expect(code.textContent?.trim()).toBe('sudo chown -R 1000:1000 /path/to/data');
  });

  it('links to the README upgrade section', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.href.endsWith('#upgrading-to-020')).toBe(true);
  });
});
