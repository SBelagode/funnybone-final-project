import PopularCaptionsPage from "@/components/popular-captions-page";
import { TOP_100_FILTER_HREFS } from "@/lib/top-100";

export default function Top100AllTimePage() {
  return <PopularCaptionsPage initialFilter="all" {...TOP_100_FILTER_HREFS} />;
}
