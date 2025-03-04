import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: any, args: any) {
    const { object } = args;
    return endDate > object.startDate;
  }

  defaultMessage() {
    return 'End date must be after start date.';
  }
}

export function IsEndDateAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEndDateAfterStartDateConstraint,
    });
  };
}
