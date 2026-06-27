import { motion } from "framer-motion";
import {
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  BoltIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "AI-Powered Matching",
    description:
      "Our advanced AI algorithm matches your profile with the perfect job opportunities, saving you time and effort.",
    icon: BoltIcon,
  },
  {
    name: "Instant Alerts",
    description:
      "Get notified instantly about new job postings that match your criteria. Never miss an opportunity.",
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: "Career Growth",
    description:
      "We provide resources and insights to help you grow in your career. From resume tips to interview preparation.",
    icon: ScaleIcon,
  },
  {
    name: "Global Opportunities",
    description:
      "Explore job opportunities from around the world. Your dream job might be just a click away.",
    icon: GlobeAltIcon,
  },
];

export default function WhyChooseUs() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
            Features
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            A better way to find your future
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            We are not just a job board. We are your career partner.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {feature.description}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
