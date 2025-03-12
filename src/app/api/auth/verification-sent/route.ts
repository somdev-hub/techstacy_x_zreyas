// ...existing code...
try {
  // Existing code...
} catch (error) {
  console.error('Failed to send verification:', error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : 'Failed to send verification' 
  }, { status: 500 });
}
// ...existing code...