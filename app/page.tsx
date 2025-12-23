import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Welcome to Pickly
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Create and participate in fun polls with your friends
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/create" 
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create a Poll
          </Link>
          <Link 
            href="#featured" 
            className="px-6 py-3 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse Polls
          </Link>
        </div>
      </div>

      <div id="featured" className="mt-20">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Polls</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900">What's your favorite weekend activity?</h3>
              <p className="mt-2 text-sm text-gray-500">24 votes • 2 days left</p>
              <button className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                Vote Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
