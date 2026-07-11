/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { Select, Spin } from "antd";
import { ICellEditorParams } from "@ag-grid-community/core";
import type { SelectProps } from "antd";
import useDebounce from "@/hooks/useDebounce";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { getCookie } from "@/utils/client/getCookie";

interface AntdSelectCellEditorProps extends ICellEditorParams {
  values?: { label: string; value: string }[] | string[];
  onValueChange?: (newValue: string, oldValue: string) => any;
  onScroll?: (itemIndex: number) => void;
  allowAddOption?: boolean;
  openOutside?: boolean; // Controls if dropdown opens automatically (default: false)
  isLoading?: boolean; // Added isLoading prop to control loading state
}
interface BoardCastChannelNew {
  quickSearch: string; // Define the type of your bookingAssignItems here
}

const AntdSelectCellEditor = forwardRef(
  (props: AntdSelectCellEditorProps, ref) => {
    // Make sure to handle the case where props.value might be undefined
    const [value, setValue] = useState<any>(
      props.value != null ? props.value : undefined,
    );
    const [options, setOptions] = useState<SelectProps["options"]>([]);
    const [originalOptions, setOriginalOptions] = useState<
      SelectProps["options"]
    >([]);
    // Use external loading state if provided
    const [loading, setLoading] = useState<boolean>(props.isLoading || false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>("");
    const debouncedSearchInput = useDebounce(searchInput, 1000);
    const selectRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const boardCastChannelAssign =
      useBroadcastChannel<BoardCastChannelNew>("quickSearch");
    const localeCode = getCookie("language") || "vi";
    const notFoundText = localeCode === "en" ? "No Data" : "Không có dữ liệu";

    // Memoize normalizeOptions to prevent recreation on each render
    const normalizeOptions = useCallback(
      (
        values: { label: string; value: string }[] | string[] | undefined,
      ): { label: string; value: string; key: string }[] => {
        if (!values || !Array.isArray(values)) return [];

        // Map to add a unique key
        return values.map((item, index) => {
          if (typeof item === "string") {
            return {
              label: item,
              value: item,
              // Add a unique key based on value and index
              key: `${item}_${index}`,
            };
          }
          // Make sure we always return an object with label, value and key properties
          if (item && typeof item === "object" && "value" in item) {
            return {
              label:
                item.label || (item.value != null ? String(item.value) : ""),
              value: item.value, // Keep original value type
              // Add a unique key based on value and index
              key: `${item.value}_${index}`,
            };
          }
          // Fallback for unexpected item types
          return {
            label: item != null ? String(item) : "",
            value: item != null ? String(item) : "",
            // Add a unique key for fallback case
            key: `option_${index}`,
          };
        });
      },
      [],
    );

    const handleSendMessageBoardCastNew = useCallback(
      (quickSearch: BoardCastChannelNew) => {
        boardCastChannelAssign.sendMessage(quickSearch);
      },
      [boardCastChannelAssign],
    );

    // Initialize options
    useEffect(() => {
      const normalizedOptions = normalizeOptions(props.values);
      setOptions(normalizedOptions);
      setOriginalOptions(normalizedOptions);
    }, [props.values, normalizeOptions]);

    // Update loading state when props.isLoading changes
    useEffect(() => {
      if (props.isLoading !== undefined) {
        setLoading(props.isLoading);
      }
    }, [props.isLoading]);

    // Handle change event
    const handleChange = (newValue: any) => {
      setValue(newValue);

      if (props.onValueChange) {
        const validatedValue = props.onValueChange(newValue, props.value);
        if (validatedValue !== undefined) {
          setValue(validatedValue);
        }
      }
    };

    // Handle search filtering
    const handleSearch = (input: string) => {
      setSearchInput(input);
      setLoading(true);

      // Normalize input: thay multiple spaces thành single space và trim
      const normalizedInput = input.replace(/\s+/g, " ").trim();

      // If onScroll is not provided, we can filter locally
      if (!props.onScroll && originalOptions) {
        const filteredOptions = originalOptions.filter(
          (option) =>
            option?.label
              ?.toString()
              .toLowerCase()
              .includes(normalizedInput.toLowerCase()) ||
            option?.value
              ?.toString()
              .toLowerCase()
              .includes(normalizedInput.toLowerCase()),
        );

        // Check if we need to add the input as a new option
        if (props.allowAddOption && normalizedInput !== "") {
          // Check if the exact input already exists in original options
          const inputExists = originalOptions.some(
            (option) =>
              option?.value?.toString().toLowerCase() ===
                normalizedInput.toLowerCase() ||
              option?.label?.toString().toLowerCase() ===
                normalizedInput.toLowerCase(),
          );

          // If input doesn't exist, add it as a new option
          if (!inputExists) {
            // Add a unique key for the new option using normalized input
            filteredOptions.unshift({
              label: normalizedInput,
              value: normalizedInput,
              key: `new_${normalizedInput}`,
            });
          }
        }

        setOptions(filteredOptions);
        setLoading(false);
      }

      // Still broadcast the search term (use original input để giữ nguyên behavior)
      handleSendMessageBoardCastNew({ quickSearch: input });
    };

    // Process the search when debouncedSearchInput changes
    useEffect(() => {
      // Only process when debouncedSearchInput changes
      // Skip this effect if no onScroll is provided
      if (!props.onScroll) return;

      const processSearch = () => {
        if (!searchInput) {
          setOptions(normalizeOptions(props.values));
          setLoading(false);
          handleSendMessageBoardCastNew({ quickSearch: "" });
          return;
        }

        // Simulate async search with timeout
        setTimeout(() => {
          setOptions(normalizeOptions(props.values));
          setLoading(false);
        }, 300);
      };

      processSearch();
    }, [
      debouncedSearchInput,
      props.values,
      props.onScroll,
      handleSendMessageBoardCastNew,
      normalizeOptions,
    ]);

    // Handle dropdown scroll
    const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (!props.onScroll) return;

      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const itemHeight = 32; // Default height of antd select items

      // Calculate approximate item index
      const currentItemIndex = Math.floor(scrollTop / itemHeight);
      props.onScroll(currentItemIndex);
    };

    // Handle dropdown toggle
    const handleDropdownVisibleChange = (open: boolean) => {
      setIsOpen(open);
    };

    // Calculate dropdown position to avoid being cut off
    const calculatePosition = () => {
      if (!containerRef.current) return {};

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Check if there's more space above than below
      const verticalPlacement =
        spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom";

      return {
        verticalPlacement,
      };
    };

    // AgGrid required interface
    useImperativeHandle(ref, () => {
      return {
        getValue() {
          return value;
        },
        isCancelBeforeStart() {
          return false;
        },
        isCancelAfterEnd() {
          return false;
        },
        // This ensures proper focus behavior in AG-Grid
        afterGuiAttached() {
          const focusedCell = props.api.getFocusedCell();
          const isThisCellFocused =
            focusedCell &&
            focusedCell.rowIndex === props.rowIndex &&
            focusedCell.column.getColId() === props.column.getColId();

          if (isThisCellFocused && selectRef.current) {
            selectRef.current.focus();
            // Only open dropdown immediately if openOutside is explicitly true
            if (props.openOutside === true) {
              setTimeout(() => {
                setIsOpen(true);
              }, 10);
            }
          }
        },
      };
    });

    // Focus the select when the editor is mounted
    useEffect(() => {
      window.setTimeout(() => {
        // selectRef.current?.focus();
        // Only open dropdown if openOutside is explicitly true
        setIsOpen(props.openOutside === true);
      }, 10);
    }, [props.openOutside]);

    // Position dropdown based on available space
    const dropdownProps = calculatePosition();

    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <Select
          ref={selectRef}
          showSearch
          value={value}
          defaultActiveFirstOption={false}
          filterOption={false}
          onSearch={handleSearch}
          onChange={handleChange}
          notFoundContent={loading ? <Spin size="small" /> : notFoundText}
          style={{ width: "100%", height: "125%", borderRadius: "0px" }}
          options={options || []}
          onPopupScroll={handlePopupScroll}
          virtual
          listHeight={256}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: "200px" } } }}
          popupAlign={{
            points:
              dropdownProps.verticalPlacement === "top"
                ? ["bl", "tl"] // If top, align dropdown's bottom-left with input's top-left
                : ["tl", "bl"], // If bottom, align dropdown's top-left with input's bottom-left
            offset: [0, dropdownProps.verticalPlacement === "top" ? -4 : 4],
            overflow: { adjustX: true, adjustY: true },
          }}
          getPopupContainer={() => document.body}
          open={isOpen}
          onOpenChange={handleDropdownVisibleChange}
          loading={loading} // Pass loading state to Select component
          allowClear
        />
      </div>
    );
  },
);

AntdSelectCellEditor.displayName = "AntdSelectCellEditor";

export default AntdSelectCellEditor;
