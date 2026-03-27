import TemplateSelector from "./template-selector";
import RecipientSearch from "./recipient-search";
import RecipientList from "./recipient-list";
import CcBccFields from "./cc-bcc-fields";
import AttachmentList from "./attachment-list";

export default function LeftSidebar() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Template selector */}
      <TemplateSelector />

      <div className="h-px bg-border" />

      {/* Recipient search */}
      <RecipientSearch />

      {/* Selected recipients — guaranteed min-height for ~5 items, scrolls internally */}
      <RecipientList />

      {/* CC / BCC */}
      <CcBccFields />

      <div className="h-px bg-border" />

      {/* Attachments */}
      <AttachmentList />
    </div>
  );
}
