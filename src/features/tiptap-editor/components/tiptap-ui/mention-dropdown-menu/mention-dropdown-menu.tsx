"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor, Range } from "@tiptap/react";

// --- Lib ---
import { getElementOverflowPosition } from "@/features/tiptap-editor/lib/tiptap-collab-utils";

// --- Tiptap UI ---
import type {
  SuggestionItem,
  SuggestionMenuProps,
  SuggestionMenuRenderProps,
} from "@/features/tiptap-editor/components/tiptap-ui-utils/suggestion-menu";
import { SuggestionMenu } from "@/features/tiptap-editor/components/tiptap-ui-utils/suggestion-menu";

// --- UI Primitives ---
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/avatar";
import {
  Button,
  ButtonGroup,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import {
  Card,
  CardBody,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/card";
import type { MentionItem } from "./mention.types";

interface User {
  id: string;
  name: string;
  position: string;
  avatarUrl: string;
}

type MentionDropdownMenuProps = Omit<
  SuggestionMenuProps,
  "items" | "children"
> & {
  mentionsList: MentionItem[];
  onMentionQuery: (query: string) => void;
};

interface MentionItemProps {
  item: SuggestionItem<User>;
  isSelected: boolean;
  onSelect: () => void;
}

// Convert mentionsList to User format
// No filtering here since the API already filters by query
const convertMentionsToUsers = (mentionsList: MentionItem[]): User[] => {
  return (
    mentionsList?.map((mention) => ({
      id: mention.id,
      name: mention.label,
      position: mention.label,
      avatarUrl: mention.image || "",
    })) || []
  );
};

export const MentionDropdownMenu = ({
  mentionsList,
  onMentionQuery,
  ...props
}: MentionDropdownMenuProps) => {
  // Use ref to always have the latest mentionsList
  const mentionsListRef = useRef(mentionsList);
  const [, forceUpdate] = useState(0);

  // Update ref when mentionsList changes
  useEffect(() => {
    mentionsListRef.current = mentionsList;
    // Force re-render to update suggestion items
    forceUpdate((n) => n + 1);
  }, [mentionsList]);

  const handleItemSelect = useCallback(
    (selectProps: { editor: Editor; range: Range; context?: User }) => {
      if (!selectProps.editor || !selectProps.range || !selectProps.context)
        return;

      selectProps.editor
        .chain()
        .focus()
        .insertContentAt(selectProps.range, [
          {
            type: "mention",
            attrs: {
              id: selectProps.context.id.toString(),
              label: selectProps.context.name,
            },
          },
          {
            type: "text",
            text: " ",
          },
        ])
        .run();
    },
    []
  );

  const getSuggestionItems = useCallback(
    async (itemProps: { query: string }) => {
      // Trigger the query to fetch new data from API
      onMentionQuery?.(itemProps.query);

      // Wait for API to return data (poll for up to 800ms)
      const maxWait = 800;
      const pollInterval = 100;
      let waited = 0;

      while (waited < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        waited += pollInterval;

        // Check if we have data
        const currentList = mentionsListRef.current;
        if (currentList && currentList.length > 0) {
          break;
        }
      }

      // Convert mentionsList to users format (API already filtered by query)
      const users = convertMentionsToUsers(mentionsListRef.current);

      return users.map((user) => ({
        title: user.name,
        subtext: user.name,
        context: user,
        onSelect: handleItemSelect,
      }));
    },
    [onMentionQuery, handleItemSelect]
  );

  return (
    <SuggestionMenu
      char="@"
      pluginKey="mentionDropdownMenu"
      decorationClass="tiptap-mention-decoration"
      selector="tiptap-mention-dropdown-menu"
      items={getSuggestionItems}
      {...props}
    >
      {(renderProps) => <MentionList {...renderProps} />}
    </SuggestionMenu>
  );
};

const MentionItem = ({ item, isSelected, onSelect }: MentionItemProps) => {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const menuElement = document.querySelector(
      '[data-selector="tiptap-mention-dropdown-menu"]'
    ) as HTMLElement;
    if (!itemRef.current || !isSelected || !menuElement) return;

    const overflow = getElementOverflowPosition(itemRef.current, menuElement);
    if (overflow === "top") {
      itemRef.current.scrollIntoView(true);
    } else if (overflow === "bottom") {
      itemRef.current.scrollIntoView(false);
    }
  }, [isSelected]);

  return (
    <Button
      ref={itemRef}
      data-style="ghost"
      data-active-state={isSelected ? "on" : "off"}
      onClick={onSelect}
      data-user-id={item.context?.id}
    >
      <Avatar>
        <AvatarImage src={item.context?.avatarUrl} alt={item.title} />
        <AvatarFallback>{item.title[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <span className="tiptap-button-text">{item.title}</span>
    </Button>
  );
};

const MentionList = ({
  items,
  selectedIndex,
  onSelect,
}: SuggestionMenuRenderProps<User>) => {
  const renderedItems = useMemo(() => {
    const rendered: React.ReactElement[] = [];

    items.forEach((item, index) => {
      rendered.push(
        <MentionItem
          key={item.context?.id || item.title}
          item={item}
          isSelected={index === selectedIndex}
          onSelect={() => onSelect(item)}
        />
      );
    });

    return rendered;
  }, [items, selectedIndex, onSelect]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <Card
      style={{
        maxHeight: "var(--suggestion-menu-max-height)",
      }}
    >
      <CardBody>
        <ButtonGroup>{renderedItems}</ButtonGroup>
      </CardBody>
    </Card>
  );
};
