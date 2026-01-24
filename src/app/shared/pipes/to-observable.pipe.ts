import { Pipe, PipeTransform } from '@angular/core';
import { isObservable, Observable, of } from 'rxjs';

@Pipe({
  name: 'toObservable',
})
export class ToObservablePipe implements PipeTransform {
  transform(value: Observable<any> | unknown): Observable<any> {
    return isObservable(value) ? value : of(value);
  }
}
