---
name: typescript
description: |
  TypeScript development covering fundamentals, patterns, and best practices.
  Use when building TypeScript applications and writing TypeScript code.
category: programming-languages
triggers:
  - typescript
  - ts
  - type-safe
  - nestjs typescript
  - angular typescript
  - tsconfig
tags:
  - typescript
  - type-safety
  - angular
  - nestjs
---

# TypeScript

## Type definitions

- DO NOT use type `any` type.

## TypeScript Class Methods

- All class methods inside Angular projects should be declared as `readonly`
  arrow functions.
- All class methods inside NestJs projects should be declared as regular class
  methods.
- Methods which are only used inside the class should be marked as `private`.
- Private methods should NEVER be tested directly in unit tests.

## TypeScript Class Properties

- Avoid using mutable properties.
- All class properties should be defined as `readonly` unless they are mutable.

## TypeScript Constants

- Constant names should follow the camel case.
- Default values of complex objects should be returned using factory functions
  to avoid the mutable state.
