import type { ComponentType } from "react";
import type { WidgetId } from "@/lib/dashboard-store";
import { InboxWidget } from "./InboxWidget";
import { TranslatorWidget } from "./TranslatorWidget";
import { FundingWidget } from "./FundingWidget";
import { NewsWidget } from "./NewsWidget";
import { ReportsWidget } from "./ReportsWidget";

export const WIDGET_COMPONENTS: Record<WidgetId, ComponentType> = {
  inbox: InboxWidget,
  translator: TranslatorWidget,
  funding: FundingWidget,
  news: NewsWidget,
  reports: ReportsWidget,
};
