export default function RecommendationCard({ job }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold">{job.title}</h3>
      <p className="text-gray-600">{job.company}</p>
      <p className="mt-4 text-gray-800">{job.description}</p>
      <div className="flex justify-between items-center mt-6">
        <p className="text-purple-600 font-bold">{job.salary}</p>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">
          Apply Now
        </button>
      </div>
    </div>
  );
}