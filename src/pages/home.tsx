export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-full bg-gray-50 p-4 md:p-2">
      <h1 className="text-4xl font-bold mb-4">Welcome to Wisecore</h1>
      <p className="text-lg text-gray-700 max-w-2xl text-center mb-8">
        Wisecore is an advanced platform powered by Large Language Models (LLMs) designed to help organizations generate, manage, and share internal knowledge efficiently. Centralize your company’s information, automate documentation, and empower your teams with instant access to reliable, AI-driven insights.
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-4">
        <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
          <span className="text-blue-600 text-2xl mb-2">📄</span>
          <h2 className="font-semibold text-lg mb-1">Automated Documentation</h2>
          <p className="text-gray-600">Generate and organize internal documentation automatically.</p>
        </li>
        <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
          <span className="text-pink-600 text-2xl mb-2">🔍</span>
            <h2 className="font-semibold text-lg mb-1">Intelligent Search</h2>
            <p className="text-gray-600">Quickly search within your organization's knowledge and documents.</p>
        </li>
        <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
          <span className="text-purple-600 text-2xl mb-2">🤝</span>
          <h2 className="font-semibold text-lg mb-1">Team Collaboration</h2>
          <p className="text-gray-600">Collaborate and share information across teams.</p>
        </li>
        <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
          <span className="text-yellow-600 text-2xl mb-2">💡</span>
          <h2 className="font-semibold text-lg mb-1">AI Insights</h2>
          <p className="text-gray-600">Leverage AI to answer questions and surface key insights.</p>
        </li>
      </ul>
    </main>
  );
}