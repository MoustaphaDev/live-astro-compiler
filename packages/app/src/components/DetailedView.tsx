import { Match, Switch } from "solid-js";
import { TRANSFORM_TABS, TSX_TABS } from "~/lib/consts";
import {
  mode,
  selectedTSXTab,
  selectedTransformTab,
  setSelectedTSXTab,
  setSelectedTransformTab,
} from "~/lib/stores";
import { TabsList, createJSXMemo } from "./ui-kit";

const tSXOutputTabsMemo = createJSXMemo(
  <TabsList items={TSX_TABS} signal={[selectedTSXTab, setSelectedTSXTab]} />,
);

const transformOutputTabsMemo = createJSXMemo(
  <TabsList
    items={TRANSFORM_TABS}
    signal={[selectedTransformTab, setSelectedTransformTab]}
  />,
);

function TSXOutputTabs() {
  return tSXOutputTabsMemo();
}

function TransformOutputTabs() {
  return transformOutputTabsMemo();
}

export function DetailedResultsView() {
  return (
    <Switch>
      <Match when={mode() === "TSX"}>
        <TSXOutputTabs />
      </Match>
      <Match when={mode() === "transform"}>
        <TransformOutputTabs />
      </Match>
    </Switch>
  );
}
