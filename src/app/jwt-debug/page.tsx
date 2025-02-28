"use client";
import { useState, useEffect } from "react";

export default function JwtDebugPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [jwtData, setJwtData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Test environment variables endpoint
        const envResponse = await fetch("/api/auth/debug");
        const envResult = await envResponse.json();

        // Test JWT functionality
        const jwtResponse = await fetch("/api/auth/test-jwt");
        const jwtResult = await jwtResponse.json();

        setEnvData(envResult);
        setJwtData(jwtResult);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">JWT Debugging Page</h1>

      {loading && <p>Loading diagnostic data...</p>}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {envData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(envData, null, 2)}
          </pre>
        </div>
      )}

      {jwtData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">JWT Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(jwtData, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Try the simplified login endpoint at{" "}
            <code>/api/auth/login-alt</code>
          </li>
          <li>Check browser console for detailed error messages</li>
          <li>Verify JWT secrets are properly set in environment variables</li>
          <li>Confirm Node.js and jsonwebtoken versions are compatible</li>
        </ol>
      </div>
    </div>
  );
}
