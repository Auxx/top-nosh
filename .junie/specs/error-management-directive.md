# Angular Directive to manage mat-error visibility

Create a structural directive called `WhenError` inside `control` feature of `ui` library project.

## WhenError Requirements

- It should have two inputs: `control` of type `AbstractControl` and `error` of type `string`.
- It should show the error message tag it is applied to when the `control` is invalid and touched or dirty, and has the specified `error`.
- It should hide the error message tag it is applied to when the `control` is valid or does not have the specified `error`.
