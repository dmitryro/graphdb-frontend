import { AbstractControl, ValidatorFn } from '@angular/forms';

export function cardNumberValidator(component: any, config: object): ValidatorFn {
  console.log(`Config ${config} will be used later`);
  return (control: AbstractControl): Record<string, any> | null => {
    let valid = false;
    const cardNumber = control.value;
    if (typeof cardNumber === 'undefined' || cardNumber === null) {
      return null;
    }
    if (cardNumber.length < 1 || cardNumber === '') {
      return null;
    }
    valid = component.validCardNumber(cardNumber);
    return valid ? null : { cardNumberInvalid: true };
  };
}
