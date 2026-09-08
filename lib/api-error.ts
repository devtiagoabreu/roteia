export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number = 400,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}