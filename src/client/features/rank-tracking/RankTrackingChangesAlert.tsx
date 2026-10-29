import { RANK_TRACKING_CHANGES_URL } from "@/shared/branding";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/client/components/ui/alert";

export function RankTrackingChangesAlert() {
  return (
    <Alert variant="info">
      <Info />
      <AlertDescription className="text-foreground">
        <p>
          <span className="font-medium">
            Rank tracking now retries some results.
          </span>{" "}
          Since September, Google has been serving incomplete results to all
          rank trackers.{" "}
          <a
            href={RANK_TRACKING_CHANGES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Read what changed
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}
