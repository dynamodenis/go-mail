import TemplateSelector from "./template-selector";
import RecipientSearch from "./recipient-search";
import RecipientList from "./recipient-list";
import CcBccFields from "./cc-bcc-fields";
import AttachmentList from "./attachment-list";

export default function LeftSidebar() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Template selector */}
      <div className="shrink-0">
        <TemplateSelector />
      </div>

      <div className="shrink-0 h-px bg-border" />

      {/* Recipient search */}
      <div className="shrink-0">
        <RecipientSearch />
      </div>

      {/* Selected recipients — scrollable area */}
      <div className="min-h-0 shrink overflow-y-auto">
        <RecipientList />
      </div>

      {/* CC / BCC */}
      <div className="shrink-0">
        <CcBccFields />
      </div>

      <div className="shrink-0 h-px bg-border" />

      {/* Attachments */}
      <div className="shrink-0">
        <AttachmentList />
      </div>
    </div>
  );
}
