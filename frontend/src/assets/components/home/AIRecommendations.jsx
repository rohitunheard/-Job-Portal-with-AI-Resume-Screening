import { useQuery } from "@tanstack/react-query";
import { getRecommendedJobs } from "../../../utils/api";
import RecommendationCard from "./RecommendationCard";

export default function AIRecommendations() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendedJobs,
  });

  return (
    <div className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-4xl font-bold text-center">AI Recommended Jobs</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {isLoading
            ? "Loading..."
            : jobs.map((job) => (
                <RecommendationCard key={job._id} job={job} />
              ))}
        </div>
      </div>
    </div>
  );
}