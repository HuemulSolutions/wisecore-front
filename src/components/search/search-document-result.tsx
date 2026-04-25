import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronDown, ChevronRight, ExternalLink, GitBranch } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionResult } from "./search-section-result";
import { useState } from "react";

import { HuemulButton } from "@/huemul/components/huemul-button";
import { useTranslation } from "react-i18next";
import { useOrgPath } from "@/hooks/useOrgRouter";
import type { SearchResultDocument, SearchResultExecution } from "@/services/search";
interface ExecutionResultProps {
  execution: SearchResultExecution;
  documentId: string;
}

function ExecutionResult({ execution, documentId }: ExecutionResultProps) {
  const { t } = useTranslation('search');
  const { t: tAssets } = useTranslation('assets');
  const [isExpanded, setIsExpanded] = useState(false);
  const buildPath = useOrgPath();

  const handleOpen = () => {
    window.open(buildPath(`/asset/${documentId}?execution=${encodeURIComponent(execution.execution_id)}`), '_blank');
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <button className="flex-shrink-0 hover:cursor-pointer text-muted-foreground hover:text-foreground">
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </CollapsibleTrigger>
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">{execution.execution_name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
              {tAssets(`lifecycle.stateLabels.${execution.lifecycle_state}`, { defaultValue: execution.lifecycle_state })}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {execution.match_count} {execution.match_count !== 1 ? t('document.segmentsFound') : t('document.segmentFound')}
            </span>
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={ExternalLink}
              iconClassName="h-3 w-3"
              label={t('document.openAsset')}
              onClick={handleOpen}
              className="h-6 text-[10px] px-1.5"
            />
          </div>
        </div>

        <CollapsibleContent>
          {execution.sections.length > 0 && (
            <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
              {execution.sections.map((section, idx) => (
                <SectionResult
                  key={section.section_execution_id}
                  section={section}
                  index={idx}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface DocumentResultProps {
  document: SearchResultDocument;
}

export function DocumentResult({ document }: DocumentResultProps) {
  const { t } = useTranslation('search');
  const [isExpanded, setIsExpanded] = useState(false);
  const buildPath = useOrgPath();

  const handleOpenDocument = () => {
    window.open(buildPath(`/asset/${document.document_id}`), '_blank');
  };

  const totalSections = document.executions.reduce((sum, e) => sum + e.sections.length, 0);

  return (
    <Card className="border border-border bg-card">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground mb-1 truncate">{document.document_name}</h3>
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <Badge className="bg-blue-100/80 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">{t('document.badge')}</Badge>
                  {document.document_internal_code && (
                    <>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <span className="text-muted-foreground text-[10px] font-mono">{document.document_internal_code}</span>
                    </>
                  )}
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-muted-foreground text-[10px]">
                    {document.executions.length} {t('document.versionsFound')}
                  </span>
                  {totalSections > 0 && (
                    <>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <span className="text-muted-foreground text-[10px]">
                        {totalSections} {totalSections !== 1 ? t('document.segmentsFound') : t('document.segmentFound')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <HuemulButton
                variant="outline"
                size="sm"
                icon={ExternalLink}
                iconClassName="h-3 w-3 mr-1"
                label={t('document.openAsset')}
                onClick={handleOpenDocument}
                className="h-7 text-xs px-2"
              />
              <CollapsibleTrigger asChild>
                <HuemulButton
                  variant="ghost"
                  size="sm"
                  icon={isExpanded ? ChevronDown : ChevronRight}
                  iconClassName="h-4 w-4"
                  className="h-7 w-7 p-0"
                />
              </CollapsibleTrigger>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
            {document.executions.map((execution) => (
              <ExecutionResult
                key={execution.execution_id}
                execution={execution}
                documentId={document.document_id}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
