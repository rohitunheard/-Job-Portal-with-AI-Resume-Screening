import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [location, setLocation] = useState("Location");

  const handleSearch = () => {
    onSearch({ query, category, location });
  };

  return (
    <div className="max-w-6xl mx-auto -mt-12 relative z-20">
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex gap-4">
        <input
          className="flex-1 border rounded-lg px-4 py-3"
          placeholder="Job title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border rounded-lg px-4"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All Categories</option>
          <option>Technology</option>
          <option>Finance</option>
          <option>Healthcare</option>
        </select>
        <select
          className="border rounded-lg px-4"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>Location</option>
          <option>New York</option>
          <option>San Francisco</option>
          <option>London</option>
        </select>
        <button
          className="bg-purple-600 text-white px-8 rounded-lg"
          onClick={handleSearch}
        >
          Search Jobs
        </button>
      </div>
    </div>
  );
}