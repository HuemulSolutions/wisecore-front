import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AssetDetailPanelProps, AssetDetailPanelTab } from "@/types/assets";
import { AssetsDetailPanel } from "./assets-detail-panel";

// Los tabs reales piden su endpoint al montarse; acá solo importa CUÁNDO se montan.
vi.mock("./assets-panel-index-tab", () => ({ AssetsPanelIndexTab: () => <div data-testid="tab-index" /> }));
vi.mock("./assets-panel-fields-tab", () => ({ AssetsPanelFieldsTab: () => <div data-testid="tab-fields" /> }));
vi.mock("./assets-panel-files-tab", () => ({ AssetsPanelFilesTab: () => <div data-testid="tab-files" /> }));
vi.mock("./assets-panel-links-tab", () => ({ AssetsPanelLinksTab: () => <div data-testid="tab-links" /> }));
vi.mock("./assets-panel-diagrams-tab", () => ({ AssetsPanelDiagramsTab: () => <div data-testid="tab-diagrams" /> }));
vi.mock("@/huemul/components/huemul-media-upload-sheet", () => ({ HuemulMediaUploadSheet: () => null }));

function Harness({ documentId = "doc-1", canAccessDiagrams = false }: { documentId?: string; canAccessDiagrams?: boolean }) {
  const [activeTab, setActiveTab] = useState<AssetDetailPanelTab>("index");
  const props = {
    organizationId: "org-1",
    documentId,
    canListCustomFields: true,
    canListExecutionRelationships: true,
    canCreateFields: false,
    canUpdateFields: false,
    canDeleteFields: false,
    canCreateMedia: false,
    canUpdateMedia: false,
    canDeleteMedia: false,
    canOpenDiagrams: false,
    canListAssetTypes: false,
    canDeleteRelationship: false,
    canAddSection: false,
    canAccessDiagrams,
    activeTab,
    onActiveTabChange: setActiveTab,
    tocItems: [],
    customFields: [],
    executions: [],
    onOpenMediaSheet: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
  } as unknown as AssetDetailPanelProps;
  return <AssetsDetailPanel {...props} />;
}

describe("AssetsDetailPanel — carga on-demand de tabs", () => {
  it("al abrir solo monta el Índice", () => {
    render(<Harness />);
    expect(screen.getByTestId("tab-index")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-fields")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-files")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-links")).not.toBeInTheDocument();
  });

  it("monta un tab al seleccionarlo y lo conserva montado al volver al Índice", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const buttons = screen.getAllByRole("button");
    // Rail: [colapsar?, índice, campos, recursos, vínculos] — se ubican por orden de tab.
    const filesButton = buttons.find((b) => /resources|files/i.test(b.textContent ?? ""));
    expect(filesButton).toBeDefined();

    await user.click(filesButton!);
    expect(screen.getByTestId("tab-files")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-links")).not.toBeInTheDocument();

    const indexButton = buttons.find((b) => /index/i.test(b.textContent ?? ""));
    await user.click(indexButton!);
    expect(screen.getByTestId("tab-files")).toBeInTheDocument();
  });
});

describe("AssetsDetailPanel — tab Diagramas", () => {
  it("sin permiso no muestra la opción ni monta el tab", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: /diagrams/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-diagrams")).not.toBeInTheDocument();
  });

  it("con permiso muestra la opción y monta el tab recién al seleccionarla", async () => {
    const user = userEvent.setup();
    render(<Harness canAccessDiagrams />);
    expect(screen.queryByTestId("tab-diagrams")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /diagrams/i }));
    expect(screen.getByTestId("tab-diagrams")).toBeInTheDocument();
  });
});
