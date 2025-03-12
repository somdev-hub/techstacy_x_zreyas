// ...existing code...
const handleVerification = async (token: string) => {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const decoded = await verifyAccessToken(token);
  // ...rest of the implementation
};
// ...existing code...