import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appCellTemplate]',
  standalone: true,
})
export class AppCellTemplateDirective {
  readonly appCellTemplate = input.required<string>();
  readonly tpl = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}
