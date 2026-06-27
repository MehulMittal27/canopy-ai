import type { ComponentType } from "react";
import type { WidgetId } from "@/lib/dashboard-store";
import { InboxWidget } from "./InboxWidget";
import { TranslatorWidget } from "./TranslatorWidget";
import { FundingWidget } from "./FundingWidget";
import { NewsWidget } from "./NewsWidget";
import { ReportsWidget } from "./ReportsWidget";

export interface WidgetBodyProps {
  onRemove?: () => void;
}

export const WIDGET_COMPONENTS: Record<WidgetId, ComponentType<WidgetBodyProps>> = {
  inbox: InboxWidget,
  translator: TranslatorWidget,
  funding: FundingWidget,
  news: NewsWidget,
  reports: ReportsWidget,
};
