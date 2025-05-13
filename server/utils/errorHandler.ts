// Helper function to handle errors consistently
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
};
