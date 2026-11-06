import PopularCaptionsPage from "@/components/popular-captions-page";
import { TOP_100_FILTER_HREFS } from "@/lib/top-100";

export default function Home() {
  return <PopularCaptionsPage {...TOP_100_FILTER_HREFS} />;
}
