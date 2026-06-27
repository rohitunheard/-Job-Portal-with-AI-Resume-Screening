import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../../../utils/api";
import JobCard from "./JobCard";

export default function FeaturedJobs({ searchResults }) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
    enabled: !searchResults, // only fetch if there are no search results
  });

  const jobsToDisplay = searchResults || jobs;

  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <h2 className="text-4xl font-bold text-center">
        {searchResults ? "Search Results" : "Featured Jobs"}
      </h2>
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {isLoading
          ? "Loading..."
          : jobsToDisplay?.map((job) => <JobCard key={job._id} job={job} />)}
      </div>
    </div>
  );
}