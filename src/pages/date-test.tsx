import { formatDate, formatTime, formatDateTime, getUserLocale, getLocalizedToday } from "@/lib/utils";
import { formatDate as formatDateString } from "@/services/utils";

export default function DateTestPage() {
  const now = new Date();
  const testDate = new Date('2025-11-15T14:30:00');
  const locale = getUserLocale();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Date Localization Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Locale Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">Browser Locale</h2>
          <p className="text-blue-700">Detected locale: <strong>{locale}</strong></p>
          <p className="text-blue-700">All languages: <strong>{navigator.languages?.join(', ')}</strong></p>
        </div>

        {/* Today Test */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-green-800">Today Localization</h2>
          <p className="text-green-700">Today in your language: <strong>{getLocalizedToday()}</strong></p>
        </div>

        {/* Date Formatting Tests */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Date Formatting (Date object)</h2>
          <div className="space-y-2 text-sm">
            <p><strong>formatDate:</strong> {formatDate(now)}</p>
            <p><strong>formatTime:</strong> {formatTime(now)}</p>
            <p><strong>formatDateTime (now):</strong> {formatDateTime(now)}</p>
            <p><strong>formatDateTime (test date):</strong> {formatDateTime(testDate)}</p>
          </div>
        </div>

        {/* String Date Formatting */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Date Formatting (String)</h2>
          <div className="space-y-2 text-sm">
            <p><strong>formatDateString (now):</strong> {formatDateString(now.toISOString())}</p>
            <p><strong>formatDateString (test):</strong> {formatDateString(testDate.toISOString())}</p>
          </div>
        </div>

        {/* Native Browser Formats */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-yellow-800">Native Browser Formats</h2>
          <div className="space-y-2 text-sm text-yellow-700">
            <p><strong>toLocaleDateString:</strong> {now.toLocaleDateString()}</p>
            <p><strong>toLocaleTimeString:</strong> {now.toLocaleTimeString()}</p>
            <p><strong>toLocaleString:</strong> {now.toLocaleString()}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-purple-800">Test Instructions</h2>
          <div className="text-sm text-purple-700 space-y-1">
            <p>1. Change Chrome language to Spanish (es-ES)</p>
            <p>2. Refresh this page</p>
            <p>3. Verify dates show Spanish format</p>
            <p>4. "Today" should show as "Hoy"</p>
            <p>5. Try other languages: French (fr-FR), German (de-DE)</p>
          </div>
        </div>
      </div>

      {/* Interactive Test */}
      <div className="mt-8 bg-indigo-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-indigo-800">Interactive Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              // Simulate Spanish locale
              Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true });
              window.location.reload();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Test Spanish (es-ES)
          </button>
          <button 
            onClick={() => {
              // Simulate French locale
              Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
              window.location.reload();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Test French (fr-FR)
          </button>
          <button 
            onClick={() => {
              // Reset to original
              delete (navigator as any).language;
              window.location.reload();
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Reset to Original
          </button>
        </div>
        <p className="text-sm text-indigo-600 mt-2">
          Click these buttons to simulate different locales and see the changes instantly.
        </p>
      </div>
    </div>
  );
}