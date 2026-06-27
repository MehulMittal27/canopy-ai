import { useState } from "react";
import { TranslatorTool } from "@/components/canopy/TranslatorTool";
import { useTranslatorSession } from "@/components/canopy/useTranslatorSession";
import { ExpandOverlay } from "./ExpandOverlay";
import { Widget } from "./Widget";

export function TranslatorWidget({ onRemove }: { onRemove?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const translator = useTranslatorSession();

  return (
    <>
      <Widget title="Translator" onRemove={onRemove} onExpand={() => setExpanded(true)}>
        <TranslatorTool session={translator} />
      </Widget>
      {expanded && (
        <ExpandOverlay title="Translator" onClose={() => setExpanded(false)}>
          <TranslatorTool session={translator} variant="expanded" />
        </ExpandOverlay>
      )}
    </>
  );
}
