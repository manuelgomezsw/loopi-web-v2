import { Directive, TemplateRef, input } from '@angular/core';

@Directive({
  selector: '[appCellTemplate]',
  standalone: true,
})
export class AppCellTemplateDirective {
  readonly appCellTemplate = input.required<string>();

  constructor(readonly tpl: TemplateRef<{ $implicit: unknown }>) {}
}
