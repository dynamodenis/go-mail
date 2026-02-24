import { mergeAttributes, Node } from "@tiptap/react";

export interface MergeTagOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    mergeTag: {
      insertMergeTag: (attrs: {
        label: string;
        value: string;
      }) => ReturnType;
    };
  }
}

export const MergeTag = Node.create<MergeTagOptions>({
  name: "mergeTag",

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => ({ "data-label": attributes.label }),
      },
      value: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-value"),
        renderHTML: (attributes) => ({ "data-value": attributes.value }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="mergeTag"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": "mergeTag", class: "merge-tag" },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      node.attrs.label,
    ];
  },

  addCommands() {
    return {
      insertMergeTag:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
