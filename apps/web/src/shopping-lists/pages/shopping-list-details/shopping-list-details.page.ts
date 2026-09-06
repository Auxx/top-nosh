import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent, WhenError } from '@top-nosh/ui';
import { catchError, debounceTime, map, Observable, of, tap } from 'rxjs';
import {
  CreateShoppingListDto,
  ShoppingListCreatedResponse,
  ShoppingListDetails,
  UpdateShoppingListDto,
  UpdateShoppingListItemDto
} from '../../models/shopping-list.types';
import {
  ShoppingListManagementService
} from '../../services/shopping-list-management/shopping-list-management.service';

export function createShoppingListItemFormGroup(
  fb: FormBuilder,
  item?: {
    id?: string | null;
    name?: string;
    quantity?: number | null;
    isBought?: boolean;
    order?: number;
  }
) {
  return fb.group({
    id: [ item?.id ?? null ],
    name: [ item?.name ?? '' ],
    quantity: [ item?.quantity ?? 1, [ Validators.min(1) ] ],
    isBought: [ item?.isBought ?? false ],
    order: [ item?.order ?? 0 ]
  });
}

export function createShoppingListForm(
  fb: FormBuilder,
  details?: ShoppingListDetails | null
) {
  const initialItems = details?.items?.length
    ? details.items.map((item, idx) => createShoppingListItemFormGroup(fb, { ...item, order: item.order ?? idx }))
    : [ createShoppingListItemFormGroup(fb, { quantity: 1, isBought: false, order: 0 }) ];

  return fb.group({
    id: [ details?.id ?? null ],
    name: [ details?.name ?? '', [ Validators.required ] ],
    description: [ details?.description ?? '' ],
    items: fb.array<FormGroup>(initialItems)
  });
}

@Component({
  selector: 'app-shopping-list-details',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    WhenError,
    PageHeaderComponent,
    TranslocoDirective
  ],
  templateUrl: './shopping-list-details.page.html',
  styleUrl: './shopping-list-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingListDetailsPage implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly location = inject(Location);

  private readonly shoppingListService = inject(ShoppingListManagementService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly elementRef = inject(ElementRef);

  private readonly titleService = inject(Title);

  private readonly destroyRef = inject(DestroyRef);

  readonly currentId = signal<string | null>(null);

  readonly isLoading = signal<boolean>(false);

  readonly hasError = signal<boolean>(false);

  readonly isSaving = signal<boolean>(false);

  readonly isEditMode = computed(() => !!this.currentId());

  readonly form = createShoppingListForm(this.fb);

  get itemsFormArray(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  get activeItems(): FormGroup[] {
    return this.itemsFormArray.controls.filter(ctrl => !ctrl.get('isBought')?.value);
  }

  get completedItems(): FormGroup[] {
    return this.itemsFormArray.controls.filter(ctrl => !!ctrl.get('isBought')?.value);
  }

  get hasBoughtItems(): boolean {
    return this.completedItems.length > 0;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');

        if (id && id !== 'new') {
          this.currentId.set(id);
          this.form.get('id')?.setValue(id, { emitEvent: false });
          this.loadShoppingList(id);
        } else {
          this.currentId.set(null);
          this.form.reset({
            id: null,
            name: '',
            description: ''
          }, { emitEvent: false });
          this.itemsFormArray.clear({ emitEvent: false });
          this.itemsFormArray.push(
            createShoppingListItemFormGroup(this.fb, { quantity: 1, isBought: false, order: 0 }),
            { emitEvent: false }
          );
          this.updateTitle('');
          this.cdr.markForCheck();
        }
      });

    this.form.get('name')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        this.updateTitle(name);
      });

    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (!this.isLoading() && this.isListNameValid()) {
          this.save().subscribe();
        }
      });
  }

  private updateTitle(name?: string | null): void {
    const trimmed = name?.trim();
    if (trimmed) {
      this.titleService.setTitle(`Top Nosh - ${trimmed}`);
    } else {
      this.titleService.setTitle('Top Nosh - Create new shopping list');
    }
  }

  readonly loadShoppingList = (id: string): void => {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.cdr.markForCheck();

    this.shoppingListService
      .getShoppingListById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: details => {
          this.form.patchValue({
            id: details.id,
            name: details.name,
            description: details.description ?? ''
          }, { emitEvent: false });

          this.itemsFormArray.clear({ emitEvent: false });

          if (details.items?.length) {
            details.items.forEach((item, index) => {
              this.itemsFormArray.push(
                createShoppingListItemFormGroup(this.fb, {
                  ...item,
                  order: item.order ?? index
                }),
                { emitEvent: false }
              );
            });
          } else {
            this.itemsFormArray.push(
              createShoppingListItemFormGroup(this.fb, {
                quantity: 1,
                isBought: false,
                order: 0
              }),
              { emitEvent: false }
            );
          }

          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.cdr.markForCheck();
        }
      });
  };

  readonly isListNameValid = (): boolean => {
    const name = this.form.get('name')?.value;
    return typeof name === 'string' && name.trim().length > 0;
  };

  readonly onFormFocusOut = (): void => {
    if (!this.currentId() && this.isListNameValid() && !this.isSaving()) {
      this.save().subscribe();
    }
  };

  readonly onBoughtChange = (): void => {
    this.cdr.markForCheck();
  };

  readonly onDropActive = (event: CdkDragDrop<FormGroup[]>): void => {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const active = [ ...this.activeItems ];
    moveItemInArray(active, event.previousIndex, event.currentIndex);

    const completed = [ ...this.completedItems ];
    this.rebuildItemsArray([ ...active, ...completed ]);
  };

  readonly onDropCompleted = (event: CdkDragDrop<FormGroup[]>): void => {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const completed = [ ...this.completedItems ];
    moveItemInArray(completed, event.previousIndex, event.currentIndex);

    const active = [ ...this.activeItems ];
    this.rebuildItemsArray([ ...active, ...completed ]);
  };

  private readonly rebuildItemsArray = (orderedControls: FormGroup[]): void => {
    this.itemsFormArray.clear({ emitEvent: false });
    orderedControls.forEach((ctrl, idx) => {
      ctrl.get('order')?.setValue(idx, { emitEvent: false });
      this.itemsFormArray.push(ctrl, { emitEvent: false });
    });
    this.form.markAsDirty();
    this.cdr.markForCheck();
    if (this.isListNameValid()) {
      this.save().subscribe();
    }
  };

  readonly onEnterItem = (item: FormGroup): void => {
    const currentIndex = this.itemsFormArray.controls.indexOf(item);
    const targetIndex = currentIndex >= 0 ? currentIndex + 1 : this.itemsFormArray.length;

    const newGroup = createShoppingListItemFormGroup(this.fb, {
      quantity: 1,
      isBought: item.get('isBought')?.value ?? false,
      order: targetIndex
    });

    this.itemsFormArray.insert(targetIndex, newGroup);
    this.cdr.markForCheck();

    setTimeout(() => {
      const inputs = this.elementRef.nativeElement.querySelectorAll('.item-name-input');
      const targetInput = inputs[targetIndex] as HTMLInputElement | undefined;

      if (targetInput) {
        targetInput.focus();
      }
    });
  };

  readonly onItemNameInput = (item: FormGroup, event: Event): void => {
    const input = event.target as HTMLInputElement;

    if (input.value === '') {
      this.handleItemDeletion(item);
    }
  };

  readonly onItemNameBackspace = (item: FormGroup, event: Event): void => {
    const input = event.target as HTMLInputElement;

    if (input.value === '') {
      this.handleItemDeletion(item);
    }
  };

  private readonly handleItemDeletion = (item: FormGroup): void => {
    if (this.itemsFormArray.length <= 1) {
      return;
    }

    const currentIndex = this.itemsFormArray.controls.indexOf(item);

    if (currentIndex < 0) {
      return;
    }

    this.itemsFormArray.removeAt(currentIndex);
    this.cdr.markForCheck();

    const targetIndex = Math.max(0, currentIndex - 1);

    setTimeout(() => {
      const inputs = this.elementRef.nativeElement.querySelectorAll('.item-name-input');
      const prevInput = inputs[targetIndex] as HTMLInputElement | undefined;

      if (prevInput) {
        prevInput.focus();
        const len = prevInput.value.length;
        prevInput.setSelectionRange(len, len);
      }
    });
  };

  readonly onRemoveItem = (item: FormGroup): void => {
    const index = this.itemsFormArray.controls.indexOf(item);

    if (index >= 0) {
      this.itemsFormArray.removeAt(index);

      if (this.itemsFormArray.length === 0) {
        this.itemsFormArray.push(
          createShoppingListItemFormGroup(this.fb, {
            quantity: 1,
            isBought: false,
            order: 0
          })
        );
      }

      this.form.markAsDirty();
      this.cdr.markForCheck();

      if (this.isListNameValid()) {
        this.save().subscribe();
      }
    }
  };

  readonly onRemoveAllBoughtItems = (): void => {
    for (let i = this.itemsFormArray.length - 1; i >= 0; i--) {
      if (this.itemsFormArray.at(i).get('isBought')?.value) {
        this.itemsFormArray.removeAt(i);
      }
    }

    if (this.itemsFormArray.length === 0) {
      this.itemsFormArray.push(
        createShoppingListItemFormGroup(this.fb, {
          quantity: 1,
          isBought: false,
          order: 0
        })
      );
    }

    this.form.markAsDirty();
    this.cdr.markForCheck();

    if (this.isListNameValid()) {
      this.save().subscribe();
    }
  };

  readonly save = (): Observable<ShoppingListCreatedResponse | ShoppingListDetails | null> => {
    if (!this.isListNameValid()) {
      return of(null);
    }

    const rawName = this.form.get('name')?.value as string;
    const rawDescription = this.form.get('description')?.value as string | null | undefined;
    const name = rawName.trim();
    const description = rawDescription?.trim() || '';

    const rawItems = this.itemsFormArray.getRawValue() as Array<{
      id?: string | null;
      name?: string | null;
      quantity?: number | string | null;
      isBought?: boolean | null;
      order?: number | null;
    }>;

    const sanitizedItems: UpdateShoppingListItemDto[] = rawItems
      .filter(item => typeof item.name === 'string' && item.name.trim().length > 0)
      .map((item, idx) => {
        const parsedQuantity = typeof item.quantity === 'number'
          ? item.quantity
          : parseInt(item.quantity as string, 10);
        const quantity = (!isNaN(parsedQuantity) && parsedQuantity > 0) ? parsedQuantity : 1;

        return {
          id: item.id || undefined,
          name: (item.name as string).trim(),
          quantity,
          isBought: Boolean(item.isBought),
          order: idx
        };
      });

    this.isSaving.set(true);
    this.cdr.markForCheck();

    const currentId = this.currentId();

    if (!currentId) {
      const createDto: CreateShoppingListDto = {
        name,
        description,
        items: sanitizedItems
      };

      return this.shoppingListService.create(createDto).pipe(
        tap(res => {
          this.currentId.set(res.id);
          this.form.get('id')?.setValue(res.id, { emitEvent: false });
          this.location.replaceState(`/shopping-lists/${res.id}`);
          this.isSaving.set(false);
          this.cdr.markForCheck();
        }),
        catchError(err => {
          this.isSaving.set(false);
          this.cdr.markForCheck();
          throw err;
        })
      );
    } else {
      const updateDto: UpdateShoppingListDto = {
        name,
        description,
        items: sanitizedItems
      };

      return this.shoppingListService.update(currentId, updateDto).pipe(
        tap(() => {
          this.isSaving.set(false);
          this.cdr.markForCheck();
        }),
        catchError(err => {
          this.isSaving.set(false);
          this.cdr.markForCheck();
          throw err;
        })
      );
    }
  };

  readonly canDeactivate = (): boolean | Observable<boolean> => {
    if (this.isListNameValid()) {
      return this.save()
        .pipe(
          map(() => true),
          catchError(() => of(true))
        );
    }

    return true;
  };

  readonly onNavigateBack = () => this.router.navigate([ '/shopping-lists' ]);
}
