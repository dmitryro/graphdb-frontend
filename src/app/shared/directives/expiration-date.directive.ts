import { AbstractControl, ValidatorFn } from '@angular/forms';

export function expirationDateValidator(component: any, config: object): ValidatorFn {
  console.log(`Config provided ${config}`);
  return (control: AbstractControl): Record<string, any> | null => {
    let valid = false;
    const expirationDate = control.value;
    if (typeof expirationDate === 'undefined' || expirationDate === null) {
      return null;
    }

    if (expirationDate.length < 1 || expirationDate === '') {
      return null;
    }
    valid = component.validExpirationDate(expirationDate);
    return valid ? null : { expirationDateInvalid: true };
  };
}
