export interface FillUpFormData {
  fuelTypeId: string;
  liters: number;
  pricePerLiter: number;
}

export interface FillUpValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateFillUpForm(data: FillUpFormData): FillUpValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fuelTypeId) {
    errors.fuelTypeId = "Fuel type is required";
  }

  if (typeof data.liters !== "number" || isNaN(data.liters)) {
    errors.liters = "Liters must be a number";
  } else if (data.liters <= 0) {
    errors.liters = "Liters must be greater than zero";
  }

  if (typeof data.pricePerLiter !== "number" || isNaN(data.pricePerLiter)) {
    errors.pricePerLiter = "Price per liter must be a number";
  } else if (data.pricePerLiter <= 0) {
    errors.pricePerLiter = "Price per liter must be greater than zero";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}