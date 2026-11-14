/* The CMS page format. A page is a list of blocks; each block has a type
   (see registry.ts) and loose data that the block's renderer reads with
   defaults, so a missing or malformed field never breaks a page. */

export type BlockData = Record<string, unknown>;

export interface CmsBlock {
  id: string;
  type: string;
  /** Switched off: kept on the page but not shown to visitors. */
  hidden?: boolean;
  data: BlockData;
}

export interface CmsImage {
  src: string;
  alt: string;
  /** The part kept in view when the photo is cropped, as CSS object-position: "center top", "left center"… */
  focus?: string;
  /** Flipped left to right, e.g. so a student faces the text. */
  mirror?: boolean;
}

/** A button or link. `href` is a path (/upgrade), an anchor (#faq), a full
    URL, or an app action: action:cbt (start a mock) or action:tutor. */
export interface CmsLink {
  label: string;
  href: string;
}
