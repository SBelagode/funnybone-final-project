import PopularCaptionsPage from "@/components/popular-captions-page";
import { TOP_100_FILTER_HREFS } from "@/lib/top-100";

export default function Top100PastWeekPage() {
  return <PopularCaptionsPage initialFilter="week" {...TOP_100_FILTER_HREFS} />;
}
