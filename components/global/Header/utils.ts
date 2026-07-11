/* ================================================================
   Header — Breadcrumb Utilities
   ================================================================ */

import type { BreadcrumbItem } from "./_types/types";
import type {
  NavGroup,
  NavItem,
} from "@/components/global/Sidebar/_types/types";

/**
 * Tìm NavItem theo key trong navGroups (recursive).
 * Trả về { group, chain: [parent?, item] }.
 */
export function findNavChain(
  navGroups: NavGroup[],
  targetKey: string,
): { group: string; groupHeader?: "ship" | "shipVoy"; chain: NavItem[] } | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.key === targetKey) {
        return { group: group.title, groupHeader: group.header, chain: [item] };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.key === targetKey) {
            return { group: group.title, groupHeader: group.header, chain: [item, child] };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Auto build breadcrumbs từ pathname + navGroups.
 * Nếu tìm được item matching trong navGroups → build chain,
 * fallback: convert URL segments → labels.
 */
export function autoBuildBreadcrumbs(
  pathname: string,
  navGroups: NavGroup[],
  rootLabel: string,
  rootPath: string,
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Root path
  if (!lastSegment || pathname === rootPath || pathname === rootPath + "/") {
    return [{ label: rootLabel }];
  }

  // Match in navGroups
  const found = findNavChain(navGroups, lastSegment);

  if (found) {
    const crumbs: BreadcrumbItem[] = [{ label: rootLabel, href: rootPath }];

    found.chain.forEach((item, idx) => {
      crumbs.push({
        label: item.label,
        href: idx < found.chain.length - 1 ? item.href : undefined,
      });
    });

    return crumbs;
  }

  // Fallback: convert segments to labels
  const displaySegments = segments.filter(
    (s) => s !== rootPath.replace("/", ""),
  );
  return [
    { label: rootLabel, href: rootPath },
    ...displaySegments.map((seg, idx) => ({
      label: seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      href:
        idx < displaySegments.length - 1
          ? `${rootPath}/${displaySegments.slice(0, idx + 1).join("/")}`
          : undefined,
    })),
  ];
}
